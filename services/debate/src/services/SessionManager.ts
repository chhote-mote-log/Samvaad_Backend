// src/services/SessionManager.ts

import EventEmitter from "events";
import { RuleEngine } from "./RuleEngine";
import { TimerController } from "./timerController";
import { participantTracker } from "./ParticipantTracker";
import { resultEvaluator } from "./ResultEvaluator";
import { dbConnector } from "./DBConnector";
// Types and Interfaces
export type SessionState = "waiting" | "ongoing" | "paused" | "ended";

export interface DebateParticipant {
  id: string;
  name: string;
  role: "pro" | "con";
  isConnected: boolean;
  score: number;
  disqualified?: boolean;
  lastSpokeAt?: number;
  hasSpoken?: boolean;
}

export interface ChatMessage {
  senderId: string;
  content: string;
  timestamp: number;
}

export interface DebateMessage {
  senderId: string;
  content: string;
  timestamp: number;
  type: "chat" | "voice" | "video";
}
export type DebateType = 'text' | 'audio' | 'video';
export type DebateCategory = 'professional' | 'unprofessional';
export type DebateStatus = 'waiting' | 'in_progress' | 'ended';

export interface ParticipantState {
  userId: string;
  lastSpokeAt?: number;
  hasSpoken?: boolean;
  disqualified?: boolean;
}

export interface DebateMessage {
  senderId: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'voice' | 'video';
}

export interface DebateSession {
  sessionId: string;
  type: DebateType;
  category: DebateCategory;
  durationMins: number;
  state: SessionState;
  participants: DebateParticipant[];
  currentTurn: string | null;
  turnStartedAt: number | null;
  startTime: number | null;
  endTime: number | null;
  pausedAt: number | null;
  totalPausedDuration: number;
  rules: {
    turnDurationSecs: number;
    allowChat: boolean;
    allowVoice: boolean;
    relaxedMode?: boolean;
  };
  messages: DebateMessage[];
  chatMessages: ChatMessage[];
}
// export interface DebateSession {
//   sessionId: string;
//   participants: DebateParticipant[];
  // chatMessages: ChatMessage[];
//   messages: DebateMessage[];
//   currentTurn: string; // participant.id who has the turn
//   state: SessionState;
//   startTime: number | null;
//   endTime: number | null;
//   pausedAt: number | null;
//   totalPausedDuration: number;
// }

// In-memory session store (replace with Redis for scaling)
const debateSessions: Record<string, DebateSession> = {};
const PAUSE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const pauseTimeouts: Record<string, NodeJS.Timeout> = {};

// SessionManager Class
class SessionManager extends EventEmitter {
  private timerController: TimerController;

  constructor() {
    super();
    this.timerController = new TimerController();

    participantTracker.on(
      "participant_disconnected",
      async (sessionId, participantId) => {
        const session = await this.getSession(sessionId);
        if (!session) return;

        // If session ongoing, pause on disconnect
        if (session.state === "ongoing") {
          this.pauseSession(sessionId);
        }
      }
    );
    participantTracker.on(
      "participant_connected",
      async (sessionId, participantId) => {
        // Optional: handle reconnect logic
        // e.g., notify others, resume session if paused and both connected
        const session = await this.getSession(sessionId);
        if (!session) return;

        const allConnected = Object.values(
          participantTracker.getSessionStatus(sessionId)
        ).every((p) => p.isConnected);

        if (session.state === "paused" && allConnected) {
          console.log(
            `[SessionManager] Resuming session ${sessionId} — all reconnected.`
          );
          await this.resumeSession(sessionId);
        }
      }
    );

    // Listen for timer turn timeout events
    this.timerController.on("turn_timeout", (sessionId: string) => {
      this.handleTurnTimeout(sessionId);
    });
  }
  private handleTurnTimeout(sessionId: string) {
    const session = debateSessions[sessionId];
    if (!session) return;

    // Only if session is ongoing
    if (session.state !== "ongoing") return;

    // Emit event or log
    console.log(`Turn timed out for session ${sessionId}, switching turn.`);

    // Switch turn to other participant
    const currentTurnId = session.currentTurn;
    const otherParticipant = session.participants.find(
      (p) => p.id !== currentTurnId
    );
    if (!otherParticipant) return;

    session.currentTurn = otherParticipant.id;

    // Emit events to notify subscribers
    this.emit("turn_timeout", session);
    this.emit("turn_changed", session.currentTurn, session);
    this.notifyMicStatus(sessionId);
    // Restart timer for new turn
    this.timerController.startTimer(sessionId);
  }

  async createSession(
    sessionId: string,
    participant1: DebateParticipant,
    participant2: DebateParticipant
  ): Promise<DebateSession> {
    try {
      if (debateSessions[sessionId]) {
        throw new Error(`Session with id ${sessionId} already exists.`);
      }

      const session: DebateSession = {
        sessionId,
        participants: [participant1, participant2],
        type: "text", // Default type, can be changed later
        category: "professional", // Default category, can be changed later
        durationMins: 30, // Default duration, can be changed later
        messages: [],
        chatMessages: [],
        turnStartedAt: null,
        rules: {
          turnDurationSecs: 60,
          allowChat: true,
          allowVoice: true,
          relaxedMode: true,
        },
        currentTurn: participant1.id,
        state: "waiting",
        startTime: null,
        endTime: null,
        pausedAt: null,
        totalPausedDuration: 0,
      };
      session.startTime = Date.now();

      await dbConnector.createSession(sessionId, session.state);

      await dbConnector.addParticipant(sessionId, participant1);
      await dbConnector.addParticipant(sessionId, participant2);

      debateSessions[sessionId] = session;
      participantTracker.addParticipant(sessionId, participant1);
      participantTracker.addParticipant(sessionId, participant2);

      this.emit("session_created", session);
      return session;
    } catch (error: any) {
      console.error(`Error creating session: ${error.message}`);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<DebateSession> {
    return debateSessions[sessionId] || null;
  }

  async startSession(sessionId: string): Promise<boolean> {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state !== "waiting" && session.state !== "paused") {
      throw new Error(
        `Session ${sessionId} cannot be started from state ${session.state}`
      );
    }

    if (session.state === "paused" && session.pausedAt) {
      // Adjust total paused duration
      session.totalPausedDuration += Date.now() - session.pausedAt;
      session.pausedAt = null;
    } else {
      session.startTime = Date.now();
    }

    session.state = "ongoing";
    this.timerController.startTimer(sessionId);
    await dbConnector.updateSessionState(sessionId, "ongoing");
    this.emit("session_started", session);
    this.notifyMicStatus(sessionId);
    return true;
  }

  async pauseSession(sessionId: string): Promise<boolean> {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state !== "ongoing") {
      throw new Error(
        `Can only pause ongoing sessions, current state: ${session.state}`
      );
    }

    session.state = "paused";
    session.pausedAt = Date.now();
    await dbConnector.updateSessionState(sessionId, "paused");

    this.emit("session_paused", session);

    if (pauseTimeouts[sessionId]) clearTimeout(pauseTimeouts[sessionId]);
    pauseTimeouts[sessionId] = setTimeout(async () => {
      console.log(
        `[SessionManager] Auto-ending session ${sessionId} due to prolonged pause.`
      );
      await this.endSession(sessionId);
      delete pauseTimeouts[sessionId];
    }, PAUSE_TIMEOUT_MS);
    return true;
  }

  async addMessage(
    sessionId: string,
    message: DebateMessage
  ): Promise<boolean> {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state !== "ongoing")
      throw new Error(
        `Cannot add message when session state is ${session.state}`
      );

    // Validate sender is current turn
    RuleEngine.validateMessage(sessionId, message);
    if (message.senderId !== session.currentTurn) {
      throw new Error(`It's not participant ${message.senderId}'s turn.`);
    }

    // Append message
    session.messages.push(message);
    await dbConnector.addMessage(sessionId, message);

    // Switch turn to the other participant
    const otherParticipant = session.participants.find(
      (p) => p.id !== message.senderId
    );
    if (!otherParticipant)
      throw new Error(`Other participant not found in session ${sessionId}`);

    session.currentTurn = otherParticipant.id;
    this.timerController.startTimer(sessionId);

    this.emit("message_added", session, message);
    this.emit("turn_changed", session.currentTurn, session);
    this.notifyMicStatus(sessionId);
    return true;
  }
  async resumeSession(sessionId: string): Promise<boolean> {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state !== "paused") {
      throw new Error(`Session ${sessionId} is not in a paused state.`);
    }

    if (session.pausedAt) {
      session.totalPausedDuration += Date.now() - session.pausedAt;
      session.pausedAt = null;
    }

    session.state = "ongoing";
    await dbConnector.updateSessionState(sessionId, "ongoing");

    this.timerController.startTimer(sessionId);
    this.emit("session_resumed", session);
    this.notifyMicStatus(sessionId);

    if (pauseTimeouts[sessionId]) {
      clearTimeout(pauseTimeouts[sessionId]);
      delete pauseTimeouts[sessionId];
    }
    return true;
  }

  async endSession(sessionId: string): Promise<boolean> {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state === "ended") {
      throw new Error(`Session ${sessionId} already ended.`);
    }
    resultEvaluator.updateScores(session);
    session.state = "ended";
    session.endTime = Date.now();
    await dbConnector.updateSessionState(sessionId, "ended");
    this.emit("session_ended", session);

    const evaluation = resultEvaluator.evaluate(session);
    this.emit("result_evaluated", session, evaluation);
    // Optional: Persist session asynchronously
    // DBConnector.saveSession(session).catch(console.error);
    if (pauseTimeouts[sessionId]) {
      clearTimeout(pauseTimeouts[sessionId]);
      delete pauseTimeouts[sessionId];
    }
    return true;
  }
  async addChatMessage(
    sessionId: string,
    message: ChatMessage
  ): Promise<boolean> {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);

    // Basic validation
    if (!message.content.trim()) {
      throw new Error("Message content cannot be empty");
    }

    // Add timestamp
    message.timestamp = Date.now();

    // Append chat message
    session.chatMessages.push(message);

    this.emit("chat_message_added", session, message);
    return true;
  }

  removeSession(sessionId: string): void {
    if (!debateSessions[sessionId]) {
      throw new Error(`Session ${sessionId} not found.`);
    }
    delete debateSessions[sessionId];
    this.emit("session_removed", sessionId);
  }
  notifyMicStatus(sessionId: string) {
    const session = debateSessions[sessionId];
    if (!session) return;

    // Broadcast mute/unmute instructions based on turn
    session.participants.forEach((participant) => {
      const canSpeak = participant.id === session.currentTurn;
      this.emit("mic_status", sessionId, participant.id, canSpeak);
    });
  }
  addParticipant(sessionId: string, participant: DebateParticipant): boolean {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.participants.find((p) => p.id === participant.id)) {
      throw new Error(
        `Participant with id ${participant.id} already in session.`
      );
    }
    if (session.participants.length >= 2) {
      throw new Error(`Session ${sessionId} already has two participants.`);
    }

    session.participants.push(participant);
    this.emit("participant_added", session, participant);
    return true;
  }
  async changeTurn(sessionId: string, newUserId: string): Promise<void> {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);

    const participant = session.participants.find((p) => p.id === newUserId);
    if (!participant)
      throw new Error(`Participant ${newUserId} not found in session.`);

    session.currentTurn = newUserId;

    this.timerController.startTimer(sessionId);

    this.emit("turn_changed", newUserId, session);

    this.notifyMicStatus(sessionId);

    // await dbConnector.updateSessionTurn(sessionId, newUserId);
  }

  validateParticipantTurn(sessionId: string, participantId: string): boolean {
    const session = debateSessions[sessionId];
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    return session.currentTurn === participantId;
  }
}

export const sessionManager = new SessionManager();

// src/services/SessionManager.ts
import redis from '../utils/redisClient';
import { DebateSession, DebateParticipant, DebateMessage, ChatMessage } from '../utils/types';

import EventEmitter from 'events';
import { RuleEngine } from './RuleEngine';
import { TimerController } from './timerController';
import { participantTracker } from './ParticipantTracker';
import { resultEvaluator } from './ResultEvaluator';
import { dbConnector } from './DBConnector';

const PAUSE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const pauseTimeouts: Record<string, NodeJS.Timeout> = {};

const SESSION_PREFIX = 'debate_session:';

export async function saveSessionToRedis(sessionId: string, session: DebateSession) {
  await redis.set(SESSION_PREFIX + sessionId, JSON.stringify(session));
}

async function getSessionFromRedis(sessionId: string): Promise<DebateSession | null> {
  const data = await redis.get(SESSION_PREFIX + sessionId);
  return data ? JSON.parse(data) : null;
}

async function deleteSessionFromRedis(sessionId: string) {
  await redis.del(SESSION_PREFIX + sessionId);
}

class SessionManager extends EventEmitter {
  private timerController: TimerController;

  constructor() {
    super();
    this.timerController = new TimerController();

    participantTracker.on("participant_disconnected", async (sessionId, _) => {
      const session = await this.getSession(sessionId);
      if (!session) return;

      if (session.state === "ongoing") {
        this.pauseSession(sessionId);
      }
    });

    participantTracker.on("participant_connected", async (sessionId, _) => {
      const session = await this.getSession(sessionId);
      if (!session) return;

      const allConnected = Object.values(participantTracker.getSessionStatus(sessionId)).every((p) => p.isConnected);
      if (session.state === "paused" && allConnected) {
        console.log(`[SessionManager] Resuming session ${sessionId} — all reconnected.`);
        await this.resumeSession(sessionId);
      }
    });

    this.timerController.on("turn_timeout", (sessionId: string) => {
      this.handleTurnTimeout(sessionId);
    });
  }

  private async handleTurnTimeout(sessionId: string) {
    const session = await this.getSession(sessionId);
    if (!session || session.state !== "ongoing") return;

    const currentTurnId = session.currentTurn;
    const otherParticipant = session.participants.find((p) => p.id !== currentTurnId);
    if (!otherParticipant) return;

    session.currentTurn = otherParticipant.id;
    await saveSessionToRedis(sessionId, session);

    this.emit("turn_timeout", session);
    this.emit("turn_changed", session.currentTurn, session);
    this.notifyMicStatus(sessionId);
    this.timerController.startTimer(sessionId);
  }

  async createSession(sessionId: string, participant1: DebateParticipant, participant2: DebateParticipant): Promise<DebateSession> {
    const existing = await getSessionFromRedis(sessionId);
    if (existing) throw new Error(`Session with id ${sessionId} already exists.`);

    const session: DebateSession = {
      sessionId,
      participants: [participant1, participant2],
      type: "text",
      category: "professional",
      durationMins: 30,
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
      startTime: Date.now(),
      endTime: null,
      pausedAt: null,
      totalPausedDuration: 0,
    };

    await dbConnector.createSession(sessionId, session.state);
    await dbConnector.addParticipant(sessionId, participant1);
    await dbConnector.addParticipant(sessionId, participant2);

    await saveSessionToRedis(sessionId, session);
    participantTracker.addParticipant(sessionId, participant1);
    participantTracker.addParticipant(sessionId, participant2);

    this.emit("session_created", session);
    return session;
  }

  async getSession(sessionId: string): Promise<DebateSession | null> {
    return await getSessionFromRedis(sessionId);
  }

  async startSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (!["waiting", "paused"].includes(session.state)) {
      throw new Error(`Session ${sessionId} cannot be started from state ${session.state}`);
    }

    if (session.state === "paused" && session.pausedAt) {
      session.totalPausedDuration += Date.now() - session.pausedAt;
      session.pausedAt = null;
    } else {
      session.startTime = Date.now();
    }

    session.state = "ongoing";
    await saveSessionToRedis(sessionId, session);
    await dbConnector.updateSessionState(sessionId, "ongoing");
    this.timerController.startTimer(sessionId);
    this.emit("session_started", session);
    this.notifyMicStatus(sessionId);
    return true;
  }

  async pauseSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state !== "ongoing") throw new Error(`Can only pause ongoing sessions, current state: ${session.state}`);

    session.state = "paused";
    session.pausedAt = Date.now();

    await saveSessionToRedis(sessionId, session);
    await dbConnector.updateSessionState(sessionId, "paused");
    this.emit("session_paused", session);

    if (pauseTimeouts[sessionId]) clearTimeout(pauseTimeouts[sessionId]);
    pauseTimeouts[sessionId] = setTimeout(async () => {
      console.log(`[SessionManager] Auto-ending session ${sessionId} due to prolonged pause.`);
      await this.endSession(sessionId);
      delete pauseTimeouts[sessionId];
    }, PAUSE_TIMEOUT_MS);

    return true;
  }

  async resumeSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state !== "paused") throw new Error(`Session ${sessionId} is not in a paused state.`);

    if (session.pausedAt) {
      session.totalPausedDuration += Date.now() - session.pausedAt;
      session.pausedAt = null;
    }

    session.state = "ongoing";
    await saveSessionToRedis(sessionId, session);
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
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state === "ended") throw new Error(`Session ${sessionId} already ended.`);

    resultEvaluator.updateScores(session);
    session.state = "ended";
    session.endTime = Date.now();

    await saveSessionToRedis(sessionId, session);
    await dbConnector.updateSessionState(sessionId, "ended");

    this.emit("session_ended", session);
    const evaluation = resultEvaluator.evaluate(session);
    this.emit("result_evaluated", session, evaluation);

    if (pauseTimeouts[sessionId]) {
      clearTimeout(pauseTimeouts[sessionId]);
      delete pauseTimeouts[sessionId];
    }

    return true;
  }

  async addMessage(sessionId: string, message: DebateMessage): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.state !== "ongoing") throw new Error(`Cannot add message when session state is ${session.state}`);

    RuleEngine.validateMessage(sessionId, message);
    // if (message.senderId !== session.currentTurn) throw new Error(`It's not participant ${message.senderId}'s turn.`);

    session.messages.push(message);
    await dbConnector.addMessage(sessionId, message);

    const otherParticipant = session.participants.find((p) => p.id !== message.senderId);
    if (!otherParticipant) throw new Error(`Other participant not found in session ${sessionId}`);

    session.currentTurn = otherParticipant.id;
    await saveSessionToRedis(sessionId, session);

    // this.timerController.startTimer(sessionId);
    this.emit("message_added", session, message);
    // this.emit("turn_changed", session.currentTurn, session);
    // this.notifyMicStatus(sessionId);
    return true;
  }

  async addChatMessage(sessionId: string, message: ChatMessage): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (!message.content.trim()) throw new Error("Message content cannot be empty");

    message.timestamp = Date.now();
    session.chatMessages.push(message);

    await saveSessionToRedis(sessionId, session);
    this.emit("chat_message_added", session, message);
    return true;
  }

  async removeSession(sessionId: string): Promise<void> {
    await deleteSessionFromRedis(sessionId);
    this.emit("session_removed", sessionId);
  }

  async notifyMicStatus(sessionId: string) {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.participants.forEach((participant) => {
      const canSpeak = participant.id === session.currentTurn;
      this.emit("mic_status", sessionId, participant.id, canSpeak);
    });
  }

  async changeTurn(sessionId: string, newUserId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);

    const participant = session.participants.find((p) => p.id === newUserId);
    if (!participant) throw new Error(`Participant ${newUserId} not found in session.`);

    session.currentTurn = newUserId;
    await saveSessionToRedis(sessionId, session);

    this.timerController.startTimer(sessionId);
    this.emit("turn_changed", newUserId, session);
    this.notifyMicStatus(sessionId);
  }

  async addParticipant(sessionId: string, participant: DebateParticipant): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    if (session.participants.find((p) => p.id === participant.id)) {
      throw new Error(`Participant with id ${participant.id} already in session.`);
    }
    if (session.participants.length >= 2) {
      throw new Error(`Session ${sessionId} already has two participants.`);
    }

    session.participants.push(participant);
    await saveSessionToRedis(sessionId, session);
    this.emit("participant_added", session, participant);
    return true;
  }

  async validateParticipantTurn(sessionId: string, participantId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);
    return session.currentTurn === participantId;
  }
}

export const sessionManager = new SessionManager();

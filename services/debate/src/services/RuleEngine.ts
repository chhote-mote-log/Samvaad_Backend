// src/services/RuleEngine.ts

import { sessionManager } from './SessionManager';
import { saveSessionToRedis } from './SessionManager';
type DebateType = 'text' | 'audio' | 'video';
type DebateMode = 'professional' | 'unprofessional';
type DebateStatus = 'waiting' | 'in_progress' | 'ended';

// interface ParticipantState {
//   userId: string;
//   lastSpokeAt?: number;
//   hasSpoken?: boolean;
//   disqualified?: boolean;
// }

// interface DebateSession {
//   sessionId: string;
//   type: DebateType;
//   category: DebateCategory;
//   aiEnabled: boolean;
//   durationMins: number;
//   status: DebateStatus;
//   participants: Record<string, ParticipantState>;
//   currentTurn: string | null;
//   turnStartedAt: number | null;
//   rules: {
//     turnDurationSecs: number;
//     allowChat: boolean;
//     allowVoice: boolean;
//     relaxedMode?: boolean;
//   };
//   messages: DebateMessage[];
// }

interface DebateMessage {
  senderId: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'voice' | 'video';
}

// const debateSessions: Record<string, DebateSession> = {};

const PROFANITY_LIST = ['badword1', 'badword2', 'damn', 'hell', 'shit', 'fuck'];

const REPEATED_CHAR_REGEX = /(.)\1{10,}/; // loosened from 5 to 10
const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 2; // loosened from 5 to 2
const MAX_MESSAGES_PER_PARTICIPANT = 60; // loosened from 30 to 60
const MIN_MESSAGE_INTERVAL_MS = 2000; // loosened from 5000 to 2000

export class RuleViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleViolationError';
  }
}

export class RuleEngine {
  private static lastMessageTimestamps: Record<string, number> = {};

  private static containsProfanity(text: string, mode: DebateMode): boolean {
    if (mode === 'unprofessional') return false;
    const lowerText = text.toLowerCase();
    for (const word of PROFANITY_LIST) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lowerText)) return true;
    }
    return false;
  }

  static async canSpeak(sessionId: string, userId: string): Promise<boolean> {
    const session = await sessionManager.getSession(sessionId);

    if (!session || session.state !== 'ongoing') return false;
    const participant = session.participants.find(p => p.id === userId);
    if (!participant || participant.disqualified) return false;
    if (session.currentTurn !== userId) return false;
    if (!session.turnStartedAt) return false;

    const now = Date.now();
    const turnDurationMs = session.rules.turnDurationSecs * 1000;
    return now - session.turnStartedAt <= turnDurationMs;
  }

  static async canUserSpeak(sessionId: string, userId: string): Promise<boolean> {
    const session = await sessionManager.getSession(sessionId);
    return session?.currentTurn === userId;
  }

  static async switchTurn(sessionId: string): Promise<string | null> {
    const session = await sessionManager.getSession(sessionId);
    if (!session) return null;

    const participantIds = Object.keys(session.participants);
    if (participantIds.length < 2) return session.currentTurn; // loosened: allow continuation

    const nextTurn = participantIds.find(id => id !== session.currentTurn);
    if (!nextTurn) return null;

    session.currentTurn = nextTurn;
    session.turnStartedAt = Date.now();

    return nextTurn;
  }

  static async disqualifyUser(sessionId: string, userId: string): Promise<void> {
  const session = await sessionManager.getSession(sessionId);

  if (!session) {
    throw new Error(`Session with id ${sessionId} not found.`);
  }

  const participant = session.participants.find(p => p.id === userId);

  if (!participant) {
    throw new Error(`Participant with id ${userId} not found in session ${sessionId}.`);
  }

  participant.disqualified = true;
  await saveSessionToRedis(sessionId, session); // Save back if using Redis

  // Optionally emit event or log
  console.log(`Participant ${userId} disqualified from session ${sessionId}`);
}


  static async isDebateOver(sessionId: string): Promise<boolean> {
    const session = await sessionManager.getSession(sessionId);
    if (!session) return true;

    const now = Date.now();
    const startTime = session.turnStartedAt || 0;
    const totalDurationMs = session.durationMins * 60 * 1000;

    if (now - startTime >= totalDurationMs) return true;

    const disqualifiedCount = Object.values(session.participants).filter(p => p.disqualified).length;
    return disqualifiedCount >= 1;
  }

 static async validateMessage(sessionId: string, message: DebateMessage): Promise<boolean> {
  const session = await sessionManager.getSession(sessionId);
  if (!session) throw new RuleViolationError('Debate session not found.');

  const relaxed = session.rules.relaxedMode || session.mode === 'unprofessional';

  if (session.state !== 'ongoing') {
    throw new RuleViolationError('Debate is not ongoing; messages are not accepted.');
  }

  const participant = session.participants.find(p => p.id === message.senderId);
  if (!participant) {
    throw new RuleViolationError('Sender is not a participant in this debate.');
  }
  if (participant.disqualified) {
    throw new RuleViolationError('You are disqualified from this debate.');
  }

  if (message.type === 'chat' && !session.rules.allowChat) {
    throw new RuleViolationError('Chat messages are not allowed in this debate.');
  }
  if (message.type === 'voice' && !session.rules.allowVoice) {
    throw new RuleViolationError('Voice messages are not allowed in this debate.');
  }

  if (!this.canSpeak(sessionId, message.senderId)) {
    throw new RuleViolationError('It is not your turn or your turn has expired.');
  }

  const length = message.content.trim().length;
  if (!relaxed && length < MIN_MESSAGE_LENGTH) {
    throw new RuleViolationError(`Message too short; minimum length is ${MIN_MESSAGE_LENGTH} characters.`);
  }
  if (length > MAX_MESSAGE_LENGTH) {
    throw new RuleViolationError(`Message too long; maximum allowed length is ${MAX_MESSAGE_LENGTH} characters.`);
  }

  if (!relaxed && this.containsProfanity(message.content, session.mode)) {
    throw new RuleViolationError('Message contains inappropriate language.');
  }

  const msgs = session.messages || [];
  if (
    !relaxed &&
    msgs.length > 0 &&
    msgs[msgs.length - 1].senderId === message.senderId &&
    msgs[msgs.length - 1].content === message.content
  ) {
    throw new RuleViolationError('Please avoid repeating the same message consecutively.');
  }

  const lastTime = this.lastMessageTimestamps[message.senderId] || 0;
  const now = Date.now();
  if (!relaxed && now - lastTime < MIN_MESSAGE_INTERVAL_MS) {
    throw new RuleViolationError(`Please wait at least ${MIN_MESSAGE_INTERVAL_MS / 1000} seconds between messages.`);
  }

  if (!relaxed && REPEATED_CHAR_REGEX.test(message.content)) {
    throw new RuleViolationError('Message contains repeated characters or symbols, which is not allowed.');
  }

  const sentCount = msgs.filter(m => m.senderId === message.senderId).length;
  if (!relaxed && sentCount >= MAX_MESSAGES_PER_PARTICIPANT) {
    throw new RuleViolationError('You have reached the maximum number of messages allowed in this debate.');
  }

  this.lastMessageTimestamps[message.senderId] = now;
  return true;
}

}

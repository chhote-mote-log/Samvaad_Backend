// src/services/RuleEngine.ts

// ----- Types -----
import { sessionManager } from './SessionManager';
type DebateType = 'text' | 'audio' | 'video';
type DebateCategory = 'professional' | 'unprofessional';
type DebateStatus = 'waiting' | 'in_progress' | 'ended';

interface ParticipantState {
  userId: string;
  lastSpokeAt?: number;  // timestamp in ms
  hasSpoken?: boolean;
  disqualified?: boolean;
}

interface DebateSession {
  sessionId: string;
  type: DebateType;
  category: DebateCategory;
  aiEnabled: boolean;
  durationMins: number;
  status: DebateStatus;
  participants: Record<string, ParticipantState>; // userId -> ParticipantState
  currentTurn: string | null;
  turnStartedAt: number | null;  // timestamp in ms
  rules: {
    turnDurationSecs: number;
    allowChat: boolean;
    allowVoice: boolean;
  };
  messages: DebateMessage[]; // store messages per session
}

interface DebateMessage {
  senderId: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'voice' | 'video'; // extendable for message type
}

// In-memory storage of debate sessions (replace with DB or Redis in prod)
const debateSessions: Record<string, DebateSession> = {};

// ----- Constants for message validation -----

const PROFANITY_LIST = [
  'badword1', 'badword2', 'damn', 'hell', 'shit', 'fuck'
];

const REPEATED_CHAR_REGEX = /(.)\1{5,}/; // e.g. "aaaaaa" or "!!!!!!"
const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 5;
const MAX_MESSAGES_PER_PARTICIPANT = 30;
const MIN_MESSAGE_INTERVAL_MS = 5000; // 5 seconds

// Custom error for rule violations
export class RuleViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleViolationError';
  }
}

export class RuleEngine {
  // Track last message timestamps by participant (for spam control)
  private static lastMessageTimestamps: Record<string, number> = {};

  // --- Helper: Check profanity ---
  private static containsProfanity(text: string): boolean {
    const lowerText = text.toLowerCase();
    for (const word of PROFANITY_LIST) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lowerText)) return true;
    }
    return false;
  }

  // --- Check if participant can speak now ---
  static canSpeak(sessionId: string, userId: string): boolean {
    const session = debateSessions[sessionId];
    if (!session || session.status !== 'in_progress') return false;

    if (session.participants[userId]?.disqualified) return false;

    if (session.currentTurn !== userId) return false;

    if (!session.turnStartedAt) return false;

    const now = Date.now();
    const turnDurationMs = session.rules.turnDurationSecs * 1000;
    if (now - session.turnStartedAt > turnDurationMs) {
      return false; // Turn expired
    }

    return true;
  }
  static async canUserSpeak(sessionId: string, userId: string): Promise<boolean> {
  const session = await sessionManager.getSession(sessionId);
  return session?.currentTurn === userId;
}

  // --- Switch turn to the other participant (only for 2 participants) ---
  static switchTurn(sessionId: string): string | null {
    const session = debateSessions[sessionId];
    if (!session) return null;

    const participantIds = Object.keys(session.participants);
    if (participantIds.length !== 2) return null;

    const nextTurn = participantIds.find(id => id !== session.currentTurn);
    if (!nextTurn) return null;

    session.currentTurn = nextTurn;
    session.turnStartedAt = Date.now();

    return nextTurn;
  }

  // --- Disqualify a participant ---
  static disqualifyUser(sessionId: string, userId: string): void {
    const session = debateSessions[sessionId];
    if (session && session.participants[userId]) {
      session.participants[userId].disqualified = true;
    }
  }

  // --- Check if debate is over ---
  static isDebateOver(sessionId: string): boolean {
    const session = debateSessions[sessionId];
    if (!session) return true;

    const now = Date.now();
    const startTime = session.turnStartedAt || 0;
    const totalDurationMs = session.durationMins * 60 * 1000;

    if (now - startTime >= totalDurationMs) return true;

    // If any participant is disqualified, debate ends
    const disqualifiedCount = Object.values(session.participants).filter(p => p.disqualified).length;
    if (disqualifiedCount >= 1) return true;

    return false;
  }

  // --- Validate a message for content, spam, turn, and session rules ---
  static validateMessage(sessionId: string, message: DebateMessage): boolean {
    const session = debateSessions[sessionId];
    if (!session) throw new RuleViolationError('Debate session not found.');

    // Session must be in progress
    if (session.status !== 'in_progress') {
      throw new RuleViolationError('Debate is not ongoing; messages are not accepted.');
    }

    // Sender must be a participant and not disqualified
    const participant = session.participants[message.senderId];
    if (!participant) {
      throw new RuleViolationError('Sender is not a participant in this debate.');
    }
    if (participant.disqualified) {
      throw new RuleViolationError('You are disqualified from this debate.');
    }

    // Check if the message type is allowed by session rules
    if (message.type === 'chat' && !session.rules.allowChat) {
      throw new RuleViolationError('Chat messages are not allowed in this debate.');
    }
    if (message.type === 'voice' && !session.rules.allowVoice) {
      throw new RuleViolationError('Voice messages are not allowed in this debate.');
    }

    // Must be participant's turn and turn not expired
    if (!this.canSpeak(sessionId, message.senderId)) {
      throw new RuleViolationError('It is not your turn or your turn has expired.');
    }

    // Validate message content length
    const length = message.content.trim().length;
    if (length < MIN_MESSAGE_LENGTH) {
      throw new RuleViolationError(`Message too short; minimum length is ${MIN_MESSAGE_LENGTH} characters.`);
    }
    if (length > MAX_MESSAGE_LENGTH) {
      throw new RuleViolationError(`Message too long; maximum allowed length is ${MAX_MESSAGE_LENGTH} characters.`);
    }

    // Check for profanity
    if (this.containsProfanity(message.content)) {
      throw new RuleViolationError('Message contains inappropriate language.');
    }

    // Prevent repeated identical consecutive messages by same participant
    const msgs = session.messages || [];
    if (
      msgs.length > 0 &&
      msgs[msgs.length - 1].senderId === message.senderId &&
      msgs[msgs.length - 1].content === message.content
    ) {
      throw new RuleViolationError('Please avoid repeating the same message consecutively.');
    }

    // Enforce minimal interval between messages to prevent flooding
    const lastTime = this.lastMessageTimestamps[message.senderId] || 0;
    const now = Date.now();
    if (now - lastTime < MIN_MESSAGE_INTERVAL_MS) {
      throw new RuleViolationError(`Please wait at least ${MIN_MESSAGE_INTERVAL_MS / 1000} seconds between messages.`);
    }

    // Prevent spammy repeated characters or emojis
    if (REPEATED_CHAR_REGEX.test(message.content)) {
      throw new RuleViolationError('Message contains repeated characters or symbols, which is not allowed.');
    }

    // Enforce maximum messages per participant per session
    const sentCount = msgs.filter(m => m.senderId === message.senderId).length;
    if (sentCount >= MAX_MESSAGES_PER_PARTICIPANT) {
      throw new RuleViolationError('You have reached the maximum number of messages allowed in this debate.');
    }

    // Passed all validations — update last message timestamp
    this.lastMessageTimestamps[message.senderId] = now;

    return true;
  }
}

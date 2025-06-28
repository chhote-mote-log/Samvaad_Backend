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
  mode: DebateCategory;
  durationMins: number;
  topic: string;
  state: SessionState;
  visibility: string;
  chat_enabled: boolean;
  ai_moderation: boolean;
  language: string;
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

export interface ModerationResult {
  messageId: string;
  sessionId: string;
  mode: "text" | "audio" | "video";
  type:"professional" | "fun",
  language: string;
  feedback: {
    motivational: string;
    overallFeedback: string;
  };
  scores: {
    toxicityScore: number;        // 0 (safe) – 1 (toxic)
    sentimentScore: number;       // -1 (negative) to 1 (positive)
    emotionTags: string[];        // e.g., ["anger", "confidence"]
    argumentQuality: number;      // 0–1
    rebuttalScore: number;        // 0–1
    fallacyTags: string[];        // e.g., ["strawman", "ad hominem"]
    languageComplexity: number;   // 0–1 (simple to complex)
    questionsAsked: number;       // count
    factualAccuracy: number;      // 0–1
  };
  score: number;                  // Composite debate performance score (0–100)
  verdict: string;                // e.g., "Excellent rebuttal", "Needs clarity"
  auto_flagged: boolean;          // If the message needs moderator review
}
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
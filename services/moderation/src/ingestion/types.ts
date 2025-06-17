export interface DebateMessage {
  debateId: string;
  userId: string;
  timestamp: number;
  content: string;
  contentType: 'text' | 'audio';
}

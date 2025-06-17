export interface AudioModerationMessage {
  debateId: string;
  userId: string;
  audioUrl: string; // or base64 / blob
  timestamp: number;
}

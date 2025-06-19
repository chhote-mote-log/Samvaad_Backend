export interface TextModerationMessage {
  sessionId: string;
  userId: string;
  message: TextMessage;
  contentType: 'string';
  timestamp: number;
}
export interface TextMessage {
  type: 'text';
  timestamp: number;
  senderId: string;
  content: string; // Optional, if language detection is implemented
}
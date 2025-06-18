export type ModerationSeverity = 'low' | 'medium' | 'high';

export interface ModerationFeedback {
  debateId: string;
  userId: string;
  message: string;
  score: number;
  severity: ModerationSeverity;
  flagged: boolean;
  timestamp: number;
}

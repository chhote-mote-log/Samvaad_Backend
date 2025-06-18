import { ModerationFeedback } from './types';

export function classifySeverity(score: number): ModerationFeedback['severity'] {
  if (score < 0.7) return 'low';
  if (score < 0.9) return 'medium';
  return 'high';
}

export function buildFeedback({
  debateId,
  userId,
  message,
  score,
  flagged,
  timestamp,
}: {
  debateId: string;
  userId: string;
  message: string;
  score: number;
  flagged: boolean;
  timestamp: number;
}): ModerationFeedback {
  return {
    debateId,
    userId,
    message,
    score,
    flagged,
    severity: classifySeverity(score),
    timestamp,
  };
}

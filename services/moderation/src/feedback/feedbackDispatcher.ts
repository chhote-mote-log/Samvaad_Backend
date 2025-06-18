import { ModerationFeedback } from './types';
import { io } from '../socket/socketInstance'; // WebSocket server shared instance

export async function dispatchFeedback(feedback: ModerationFeedback) {
  // 1. Send via WebSocket
  io.to(feedback.debateId).emit('moderation-feedback', feedback);

  // 2. (Optional) Send to Notification Service via Kafka
  // 3. (Optional) Store in DB for audit log
  console.log('⚠️ Sent moderation feedback to session:', feedback);
}

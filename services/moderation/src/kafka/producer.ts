import { producer } from './kafkaClient';
import { TOPICS } from './topics';
import { ModerationResult } from '../pipelines/text/types';

export async function sendModerationResult(result: ModerationResult) {
  try {
    const value = JSON.stringify(result);
    await producer.send({
      topic: TOPICS.MODERATION_RESULT,
      messages: [{ value }],
    });

    console.log(`📤 Sent moderation result for message ${result.messageId}`);
  } catch (err) {
    console.error('❌ Failed to send moderation result to Kafka:', err);
  }
}

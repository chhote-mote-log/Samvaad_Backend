// src/kafka/consumer.ts
import { consumer, producer } from './kafkaClient';
import { v4 as uuidv4 } from 'uuid';

export const startModerationConsumer = async () => {
  await consumer.connect();
  await producer.connect(); // If you want to send feedback back

  await consumer.subscribe({ topic: 'moderation-request', fromBeginning: false });

  console.log('✅ AI Moderation Consumer connected and listening to topic: moderation-request');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString();
        if (!value) return;

        const data = JSON.parse(value);
        const { sessionId, message: userMessage, userId } = data;

        console.log(`🧠 Received message for moderation from session ${sessionId}:`, userMessage.content);

        // 🔍 Dummy moderation logic
        const feedback = moderateMessage(userMessage.content);

        if (feedback.flagged) {
          const moderationResult = {
            sessionId,
            userId,
            message: userMessage.content,
            feedback: feedback.reason,
            severity: feedback.severity,
            timestamp: Date.now(),
            moderationId: uuidv4()
          };

          // ✅ Send to moderation-feedback topic
          await producer.send({
            topic: 'moderation-feedback',
            messages: [{ key: sessionId, value: JSON.stringify(moderationResult) }]
          });

          console.log('✅ Sent moderation feedback:', moderationResult);
        }

      } catch (err) {
        console.error('❌ Error processing moderation message:', err);
      }
    }
  });
};

// Example moderation logic
function moderateMessage(content: string) {
  if (content.includes('badword')) {
    return {
      flagged: true,
      reason: 'Inappropriate language detected',
      severity: 'high'
    };
  }
  return {
    flagged: false
  };
}

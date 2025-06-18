// src/ingestion/adapters/kafkaConsumer.ts
import { consumer } from '../../kafka/kafkaClient';
import { TOPICS } from '../../kafka/topics';
import { validateMessage } from '../validator/validator';
import { checkRateLimit } from '../rateLimiter/rateLimiter';
import { bufferMessage } from '../buffering/bufferManager';
import { handleInvalidMessage } from '../errorHandler/errorHanlder';
import { DebateMessage } from '../types';

export async function startKafkaIngestion() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.DEBATE_CONTENT });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const payload = JSON.parse(message.value.toString());
      const { value, error } = validateMessage(payload);

      if (error) {
        await handleInvalidMessage(payload, error);
        return;
      }

      const isAllowed = await checkRateLimit(value!.userId);
      if (!isAllowed) {
        console.warn(`⏳ Rate limit exceeded for user ${value!.userId}`);
        return;
      }

      bufferMessage(value as DebateMessage);
      console.log('✅ Buffered message:', value);
    },
  });
}

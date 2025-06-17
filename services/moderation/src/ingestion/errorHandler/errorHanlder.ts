import { producer } from '../../kafka/kafkaClient';
import { TOPICS } from '../../kafka/topics';

export async function handleInvalidMessage(msg: any, reason: string) {
  console.error(`❌ Invalid message: ${reason}`, msg);
  await producer.send({
    topic: TOPICS.DEAD_LETTER_QUEUE,
    messages: [
      {
        value: JSON.stringify({
          message: msg,
          reason,
          timestamp: Date.now(),
        }),
      },
    ],
  });
}

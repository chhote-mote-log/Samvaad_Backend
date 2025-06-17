import { consumer, producer } from '../../kafka/kafkaClient';
import { TOPICS } from '../../kafka/topics';
import { moderateText } from './mode';
import { cleanText } from './preprocessor';
import { TextModerationMessage } from './types';

export async function startTextModerationPipeline() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.TEXT_MODERATION });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const raw = JSON.parse(message.value.toString()) as TextModerationMessage;

      raw.content = cleanText(raw.content);
      const result = await moderateText(raw);

      const moderationResult = {
        ...raw,
        result: {
          toxicScore: result.toxicScore,
          flagged: result.flagged,
        },
      };

      console.log('🧠 Moderation result:', moderationResult);

      // Optionally send to Kafka or DB
      await producer.send({
        topic: TOPICS.MODERATION_RESULT,
        messages: [{ value: JSON.stringify(moderationResult) }],
      });
    },
  });
}

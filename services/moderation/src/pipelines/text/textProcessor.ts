import { consumer, producer } from '../../kafka/kafkaClient';
import { TOPICS } from '../../kafka/topics';
import { moderateText } from './mode';
import { cleanText } from './preprocessor';
import { TextModerationMessage } from './types';

export async function startTextModerationPipeline(data: TextModerationMessage) {
  
  // await consumer.run({
  //   eachMessage: async ({ message }) => {
      if (!data) return;

      data.message.content = cleanText(data.message.content);
      const result = await moderateText(data);
      console.log('🧠 Moderation result:', result);
      const moderationResult = {
        ...data,
        result: {
          feedback: result.feedback,
        },

      };

      console.log('🧠 Moderation result:', moderationResult);

      // Optionally send to Kafka or DB
      // await producer.send({
      //   topic: TOPICS.MODERATION_RESULT,
      //   messages: [{ value: JSON.stringify(moderationResult) }],
      // });
  //   },
  // });
}

import { consumer, producer } from '../../kafka/kafkaClient';
import { TOPICS } from '../../kafka/topics';
import { moderateText } from './mode';
import { cleanText } from './preprocessor';
import { TextModerationMessage } from './types';
import { sendModerationResult } from '../../kafka/producer';

export async function startTextModerationPipeline(data: TextModerationMessage) {
  
  // await consumer.run({
  //   eachMessage: async ({ message }) => {
      if (!data) return;

      data.content = cleanText(data.content);
      const result = await moderateText(data);
      console.log('🧠 Moderation result:', result);
      const moderationResult = {
        result: result,
      };

      console.log('🧠 Moderation result:', result);


      await sendModerationResult(result);
      // Optionally send to Kafka or DB
      // await producer.send({
      //   topic: TOPICS.MODERATION_RESULT,
      //   messages: [{ value: JSON.stringify(moderationResult) }],
      // });
  //   },
  // });
}

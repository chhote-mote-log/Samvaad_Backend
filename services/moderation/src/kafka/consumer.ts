import { consumer, producer } from "./kafkaClient";
import { v4 as uuidv4 } from "uuid";
import { runTextModerationPipeline } from "../pipelines/text";
// import { audioModerationPipeline } from '../pipelines/audio';
// import { videoModerationPipeline } from '../pipelines/video';

let isConsumerInitialized = false;

export const startModerationConsumer = async () => {
  if (isConsumerInitialized) {
    console.warn("⚠️ Consumer already initialized. Skipping...");
    return;
  }

  try {
    await consumer.connect();
    await producer.connect();

    console.log("✅ Kafka client connected");

    await consumer.subscribe({
      topic: "moderation.request",
      fromBeginning: false,
    });
    console.log("✅ Subscribed to topic: moderation.request");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          if (!value) return;

          const data = JSON.parse(value);
          const {
            sessionId,
            messageId,
            senderId,
            receiverId,
            content,
            timestamp,
            language,
            turn_number,
            mode,
            type,
            topic,
            rules,
            context,
            contentType,
          } = data;

          if (!sessionId || !contentType) {
            console.warn("⚠️ Invalid moderation request payload:", data);
            return;
          }

          console.log(
            `🧠 Routing ${contentType} message for moderation from session ${sessionId}`
          );

          switch (contentType) {
            case "text":
              await runTextModerationPipeline(data);
              break;
            case "audio":
              // await audioModerationPipeline(data);
              break;
            case "video":
              // await videoModerationPipeline(data);
              break;
            default:
              console.warn(`⚠️ Unknown contentType "${contentType}"`);
          }
        } catch (err) {
          console.error("❌ Error processing moderation message:", err);
        }
      },
    });

    isConsumerInitialized = true;
  } catch (err) {
    console.error("❌ Failed to initialize Kafka consumer:", err);
    throw err;
  }
};

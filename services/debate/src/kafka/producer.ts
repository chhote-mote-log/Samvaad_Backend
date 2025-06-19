// src/kafka/producer.ts
import {kafkaProducer} from './kafkaService';


export const initProducer = async () => {
  await kafkaProducer.connect();
  console.log("✅ Kafka Producer connected");
};

export const sendToModeration = async (data: any) => {
  try {
    await kafkaProducer.send({
      topic: 'moderation.request',
      messages: [
        {
          key: data.sessionId,
          value: JSON.stringify(data)
        }
      ]
    });
  } catch (err) {
    console.error("❌ Failed to send message to moderation:", err);
  }
};

// src/kafka/producer.ts
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'debate-session-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

export const initProducer = async () => {
  await producer.connect();
  console.log("✅ Kafka Producer connected");
};

export const sendToModeration = async (data: any) => {
  try {
    await producer.send({
      topic: 'moderation-request',
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

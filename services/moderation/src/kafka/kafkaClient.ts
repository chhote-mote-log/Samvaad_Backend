// src/kafka/kafkaClient.ts
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'ai-moderation-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'ai-moderation-ingestion' });

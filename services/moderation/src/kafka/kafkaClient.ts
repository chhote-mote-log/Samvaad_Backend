import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId: 'ai-moderation-service',
  brokers: ['localhost:9092'], // or your broker
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'ai-moderation-ingestion' });

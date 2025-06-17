import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'debate-session',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

export const kafkaProducer = kafka.producer();
export const kafkaConsumer = kafka.consumer({ groupId: 'debate-session-group' });

export async function initKafka() {
  await kafkaProducer.connect();
  await kafkaConsumer.connect();
}

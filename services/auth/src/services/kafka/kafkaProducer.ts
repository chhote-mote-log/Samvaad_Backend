import kafka from './kafkaClient';

const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};

export const publishEvent = async (topic: string, message: any) => {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
};

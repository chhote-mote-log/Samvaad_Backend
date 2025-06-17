import kafka from './kafkaClient';

const consumer = kafka.consumer({ groupId: 'auth-service-group' });

export const kafkaConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user.commands', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log('Received from Kafka:', message.value?.toString());
      // Add your message handling logic here
    },
  });
};

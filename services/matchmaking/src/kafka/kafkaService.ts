import { Kafka, logLevel, Producer, Consumer } from "kafkajs";

const kafka = new Kafka({
  clientId: "matchmaking-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  logLevel: logLevel.WARN,
});

const producer: Producer = kafka.producer();
const consumer: Consumer = kafka.consumer({ groupId: "matchmaking-group" });

let producerConnected = false;
let consumerConnected = false;

export const KafkaService = {
  kafka,
  producer,
  consumer,

  async initProducer() {
    if (!producerConnected) {
      await producer.connect();
      producerConnected = true;
      console.log("✅ Kafka producer connected");
    }
  },

  async initConsumer() {
    if (!consumerConnected) {
      await consumer.connect();
      consumerConnected = true;
      console.log("✅ Kafka consumer connected");
    }
  },
};

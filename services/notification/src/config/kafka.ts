import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "notification-service",
  brokers: ["localhost:9092"], // Your Kafka broker address(es)
});

export const consumer = kafka.consumer({ groupId: "notification-group" });

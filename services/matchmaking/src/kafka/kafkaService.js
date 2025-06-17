"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaService = void 0;
const kafkajs_1 = require("kafkajs");
const kafka = new kafkajs_1.Kafka({
    clientId: "matchmaking-service",
    brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});
exports.KafkaService = {
    kafka,
    producer: kafka.producer(),
    consumer: kafka.consumer({ groupId: "matchmaking-group" }),
};

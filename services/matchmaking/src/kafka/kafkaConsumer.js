"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchConsumer = void 0;
const kafkaService_1 = require("./kafkaService");
exports.MatchConsumer = {
    listenToMatchEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const consumer = kafkaService_1.KafkaService.consumer;
            yield consumer.connect();
            yield consumer.subscribe({ topic: "match-found", fromBeginning: false });
            yield consumer.run({
                eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ topic, partition, message }) {
                    var _b;
                    const value = (_b = message.value) === null || _b === void 0 ? void 0 : _b.toString();
                    console.log(`📥 Kafka match-found received: ${value}`);
                }),
            });
            console.log("🟢 Kafka consumer listening to match-found events");
        });
    },
};

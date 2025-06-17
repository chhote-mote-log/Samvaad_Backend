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
exports.MatchProducer = void 0;
const kafkaService_1 = require("./kafkaService");
exports.MatchProducer = {
    /**
     * Connect and send match-found event
     */
    sendMatchFoundEvent(matchPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            const producer = kafkaService_1.KafkaService.producer;
            yield producer.connect();
            yield producer.send({
                topic: "match-found",
                messages: [
                    {
                        key: matchPayload.users.join("-"),
                        value: JSON.stringify(matchPayload),
                    },
                ],
            });
            yield producer.disconnect();
            console.log("📤 Kafka: match-found event sent");
        });
    },
};

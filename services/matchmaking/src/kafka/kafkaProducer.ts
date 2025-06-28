import { KafkaService } from "./kafkaService";
interface UserMatchPayload {
  userId:string;
  elo?: number; // optional, for future use
  language?: string;
}
const TOPIC = "matchmaking.match.found";

export const MatchProducer = {
  /**
   * Send match-found event to Kafka
   */
  async sendMatchFoundEvent(matchPayload: {
    users: string[];
    debateType: string;
    mode: string;
    duration_minutes: number;
    title?: string;
    visibility?: string;
    ai_moderation?: boolean;
    chat_enabled?: boolean;
    language?: string;
    rated?: boolean;
    timestamp: number;
  }) {
    try {
      await KafkaService.initProducer();

      await KafkaService.producer.send({
        topic: TOPIC,
        messages: [
          {
            key: matchPayload.users.join("-"),
            value: JSON.stringify(matchPayload),
          },
        ],
      });

      console.log("📤 Kafka: match-found event sent", matchPayload);
    } catch (err) {
      console.error("❌ Kafka Producer Error:", err);
    }
  },
};

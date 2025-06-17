import { KafkaService } from "./kafkaService";

const TOPIC = "matchmaking.match.found";

export const MatchConsumer = {
  /**
   * Listen to Kafka topic for match-found events
   */
  async listenToMatchEvents() {
    try {
      await KafkaService.initConsumer();
      await KafkaService.consumer.subscribe({ topic: TOPIC, fromBeginning: false });

      await KafkaService.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const value = message.value?.toString();
            const payload = value ? JSON.parse(value) : null;
            if (payload) {
              console.log(`📥 Kafka: match-found event received`, payload);

              // TODO: Trigger next steps (e.g., notify clients, spin up debate session)
            }
          } catch (err) {
            console.error("⚠️ Error processing Kafka message:", err);
          }
        },
      });

      console.log("🟢 Kafka consumer listening to match-found events");
    } catch (err) {
      console.error("❌ Kafka Consumer Error:", err);
    }
  },
};

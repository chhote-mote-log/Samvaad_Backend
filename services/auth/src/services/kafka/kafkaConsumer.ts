import kafka from "./kafkaClient";
// import { KAFKA_TOPICS } from "./topics";
import { updateMultipleUsersStats } from "../eloUpdater";
export const KAFKA_TOPICS = {
  ELO_UPDATE: "debate.result_evaluated"
};

const consumer = kafka.consumer({ groupId: "user-service-group" });

export const runUserConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: KAFKA_TOPICS.ELO_UPDATE, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = JSON.parse(message.value!.toString());

        if (!Array.isArray(payload.results)) {
          console.warn("Malformed message: missing results array");
          return;
        }

        await updateMultipleUsersStats(payload.results);
        console.log(`✅ Updated stats for ${payload.results.length} users from debate: ${payload.debateId}`);
      } catch (err) {
        console.error("❌ Kafka consumer error in user-service:", err);
      }
    },
  });
};

import { kafkaConsumer, initKafka } from "../services/kafkaService";
import { createDebateFromMatch } from "../services/debateService";
import { sendDebateStartedToSessionService } from "./producer";

// Utility: Retry with exponential backoff
async function retryWithBackoff(
  fn: () => Promise<void>,
  retries = 5,
  delay = 2000
) {
  for (let i = 1; i <= retries; i++) {
    try {
      await fn();
      return;
    } catch (err: any) {
      console.warn(`⏳ Retry ${i}/${retries} failed: ${err.message}`);
      if (i === retries) throw err;
      await new Promise((res) => setTimeout(res, delay * i));
    }
  }
}

export async function setupConsumers() {
  try {
    console.log("🚀 Initializing Kafka consumer...");
    await retryWithBackoff(() => initKafka());

    await retryWithBackoff(() => kafkaConsumer.connect(), 5, 2000);

    await retryWithBackoff(() =>
      kafkaConsumer.subscribe({
        topic: "matchmaking.match.found",
        fromBeginning: false,
      })
    );

    await retryWithBackoff(() =>
      kafkaConsumer.subscribe({ topic: "debate.ended", fromBeginning: false })
    );

    console.log(
      "✅ Kafka consumer subscribed to: matchmaking.match.found, debate.ended"
    );

    await retryWithBackoff(() =>
      kafkaConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return;
            const payload = JSON.parse(message.value.toString());

            console.log(
              `📥 [${topic}] Partition ${partition} | Message:`,
              payload
            );

            switch (topic) {
              case "matchmaking.match.found":
                await handleMatchFound(payload);
                break;

              case "debate.ended":
                await handleDebateEnded(payload);
                break;

              default:
                console.warn("⚠️ Unknown topic received:", topic);
            }
          } catch (err) {
            console.error(
              `❌ Error processing message from topic ${topic}:`,
              err
            );
          }
        },
      })
    );
  } catch (err) {
    console.error("🔥 Kafka consumer setup failed:", err);
  }
}

async function handleMatchFound(payload: any) {
  try {
      const result =  await createDebateFromMatch(payload);
      if (!result) {
        console.warn("⚠️ No debate created for match:", payload); 
        return;
      }
      const {sessionId} = result;
      console.log("📥 Match found, creating debate:", result);
    await sendDebateStartedToSessionService({
      debateId: sessionId ?? "",
      user1: { id: payload.users?.[0], name: "User One" },
      user2: { id: payload.users?.[1], name: "User Two" },
      topic: payload.title ?? "Untitled Debate",
      debateType: payload.debateType,
    });

    console.log("✅ Debate created and sent to session service");
  } catch (err) {
    console.error("❌ Failed to handle matchmaking.match.found:", err);
  }
}

async function handleDebateEnded(payload: any) {
  try {
    console.log("📥 Debate ended:", payload);
    // TODO: Persist debate results
  } catch (err) {
    console.error("❌ Failed to handle debate.ended:", err);
  }
}

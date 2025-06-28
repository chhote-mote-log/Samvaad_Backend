import { EachMessagePayload } from "kafkajs";
import { kafkaConsumer } from "../kafka/kafkaService";
import { sessionManager } from "../services/SessionManager";
import { ModerationResult } from "../utils/types"; // Adjust path

export async function setupConsumers() {
  try {
    await kafkaConsumer.connect();

    // Subscribe to both topics
    await kafkaConsumer.subscribe({ topic: "debate.session.start", fromBeginning: false });
    await kafkaConsumer.subscribe({ topic: "moderation.result", fromBeginning: false });

    console.log("✅ Subscribed to 'debate.session.start' and 'moderation.result' topics");

    await kafkaConsumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        if (!message.value) return;
        const payloadStr = message.value.toString();

        try {
          switch (topic) {
            case "debate.session.start": {
              const payload = JSON.parse(payloadStr);
              console.log("📥 Debate Session Start Received:", payload);

              const sessionId = payload.debateId;
              const participant1 = {
                id: payload.user1.id,
                name: payload.user1.name,
                role: "pro" as const,
                isConnected: true,
                score: 0,
              };
              const participant2 = {
                id: payload.user2.id,
                name: payload.user2.name,
                role: "con" as const,
                isConnected: true,
                score: 0,
              };

              await sessionManager.createSession(
                sessionId,
                participant1,
                participant2,
                payload.topic,
                payload.debateType,
                payload.mode,
                payload.visibility || "PUBLIC",
                payload.chat_enabled ?? true,
                payload.ai_moderation ?? true,
                payload.turn_duration || 60,
                payload.duration_minutes || 15,
                payload.language || "en"
              );

              console.log("🟢 Debate Session Initialized:", sessionId);
              break;
            }

            case "ai.moderation.result": {
              const result: ModerationResult = JSON.parse(payloadStr);
              console.log("🧠 Received Moderation Result:", result);

              // Handle result
              // await sessionManager.handleModerationResult(result);
              break;
            }

            default:
              console.warn("⚠️ Unknown topic:", topic);
          }
        } catch (err) {
          console.error(`❌ Error handling topic ${topic}:`, err);
        }
      },
    });
  } catch (err) {
    console.error("❌ Kafka consumer setup failed:", err);
  }
}

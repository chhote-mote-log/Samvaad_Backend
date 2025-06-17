import { EachMessagePayload } from "kafkajs";
import { kafkaConsumer } from "../kafka/kafkaService";
import { sessionManager } from "../services/SessionManager";

export async function setupConsumers() {
  try {
    await kafkaConsumer.connect();

    await kafkaConsumer.subscribe({
      topic: "debate.session.start",
      fromBeginning: false,
    });

    console.log("✅ Subscribed to 'debate.session.start' topic");

    await kafkaConsumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        if (!message.value) return;
        const payload = JSON.parse(message.value.toString());

        switch (topic) {
          case "debate.session.start":
            console.log("📥 Debate Session Start Received:", payload);
            try {
              const sessionId = payload.debateId;
              const participant1 = {
                id: payload.user1.id,
                name: payload.user1.name,
                role: "pro" as 'pro',
                isConnected: true,
                score: 0,
              };
              const participant2 = {
                id: payload.user2.id,
                name: payload.user2.name,
                role: "con" as 'con',
                isConnected: true,
                score: 0,
              };

              await sessionManager.createSession(
                sessionId,
                participant1,
                participant2
              );
              console.log("🟢 Debate Session Initialized:", sessionId);
            } catch (error) {
              console.error("❌ Failed to create debate session:", error);
            }
            break;
        }
      },
    });
  } catch (err) {
    console.error("❌ Kafka consumer setup failed:", err);
  }
}

import { consumer } from "../config/kafka";
import { handleNotificationEvent } from "../services/notificationHandler";

export async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "notifications" });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());
      await handleNotificationEvent(event);
    },
  });
}

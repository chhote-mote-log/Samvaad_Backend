import { prisma } from "../models";
import { sendPushNotification } from "./firebasePush";
import { sendWebSocketMessage } from "./webSocketManager";
import { NotificationEvent } from "../types";

export async function handleNotificationEvent(event: NotificationEvent) {
  const { userId, message, type, metadata } = event;

  const notification = await prisma.notification.create({
    data: { userId, type, message, metadata },
  });

  sendWebSocketMessage(userId, notification);

  await sendPushNotification(userId, message, type, metadata);
}

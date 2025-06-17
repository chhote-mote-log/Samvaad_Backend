// File: services/notification/src/services/firebasePush.ts
// import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "../models";
import {admin} from "../config/firebase";

export async function sendPushNotification(
  userId: string,
  message: string,
  type: string,
  metadata?: Record<string, any>
) {
  const tokens = await prisma.pushToken.findMany({ where: { userId } });
  if (!tokens.length) return;

  const payload = {
    notification: {
      title: "Samvaad Notification",
      body: message,
    },
    data: {
      type,
      ...(metadata || {}),
    },
  };

//   await admin.messaging().sendMulticast({
//     tokens,
//     notification: {
//       title: "Test",
//       body: "Test message",
//     },
//   });
   console.log('Sent multicast');
}

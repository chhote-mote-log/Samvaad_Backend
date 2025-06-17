import { prisma } from "../../models";
import { Request, Response } from "express";

export async function getNotifications(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json(notification);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

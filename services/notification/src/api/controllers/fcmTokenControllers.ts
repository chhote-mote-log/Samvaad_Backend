import { RequestHandler } from "express";
import { prisma } from "../../models";

export const savePushToken: RequestHandler = async (req, res) => {
  const { userId } = req.params;
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Token required" });
    return;
  }

  try {
    await prisma.pushToken.upsert({
      where: { token },
      update: { userId },
      create: { userId, token },
    });

    res.json({ success: true }); // ✅ no `return` here
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

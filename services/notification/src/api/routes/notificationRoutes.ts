import express from "express";
import { getNotifications, markNotificationRead } from "../controllers/notificationControllers";

const router = express.Router();

router.get("/:userId", getNotifications);
router.post("/mark-read/:id", markNotificationRead);

export default router;

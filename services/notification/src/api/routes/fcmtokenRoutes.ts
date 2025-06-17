import express from "express";
import { savePushToken } from "../controllers/fcmTokenControllers";

const router = express.Router();


router.post("/:userId/push-token", savePushToken);

export default router;

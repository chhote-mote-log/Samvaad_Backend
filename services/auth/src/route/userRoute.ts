import express from "express";
// import { authMiddleware } from "../middlewares/authMiddleware";
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getPublicProfile,
  updatePreferences,
  updateNotificationSettings,
} from "../controller/userController";

const router = express.Router();

// Authenticated user profile
router.get("/me",  getMyProfile);
router.patch("/me", updateMyProfile);
router.patch("/me/security", changePassword);
// router.patch("/me/avatar", updateAvatar);
router.patch("/me/preferences", updatePreferences);
router.patch("/me/settings", updateNotificationSettings);

// Public profile
router.get("/users/:id", getPublicProfile);

export default router;

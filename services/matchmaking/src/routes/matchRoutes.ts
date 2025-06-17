import { Router } from "express";
import { MatchController } from "../controllers/matchController";

const router = Router();

router.post("/enqueue", MatchController.enqueue);
router.post("/dequeue", MatchController.dequeue);
router.get("/queue", MatchController.getQueue);
router.delete("/queue", MatchController.clearQueue); // Admin route

export default router;

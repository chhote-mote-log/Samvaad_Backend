"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchController_1 = require("../controllers/matchController");
const router = (0, express_1.Router)();
router.post("/enqueue", matchController_1.MatchController.enqueue);
router.post("/dequeue", matchController_1.MatchController.dequeue);
router.get("/queue", matchController_1.MatchController.getQueue);
router.delete("/queue", matchController_1.MatchController.clearQueue); // Admin route
exports.default = router;

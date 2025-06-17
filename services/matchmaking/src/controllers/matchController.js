"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchController = void 0;
const MatchMaker_1 = require("../services/MatchMaker");
exports.MatchController = {
    /**
     * Enqueue a user into the matchmaking queue
     */
    enqueue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.body;
                console.log("Enqueueing user:", user);
                if (!user.userId || !user.debateType || !user.mode) {
                    res.status(400).json({ message: "Missing required fields." });
                    return;
                }
                yield MatchMaker_1.Matchmaker.enqueueUser(user);
                res.status(200).json({ message: "User added to queue." });
                return;
            }
            catch (error) {
                console.error("Error enqueueing user:", error);
                res.status(500).json({ message: "Internal server error." });
                return;
            }
        });
    },
    /**
     * Remove a user from the queue
     */
    dequeue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.body;
                if (!userId) {
                    res.status(400).json({ message: "Missing userId." });
                    return;
                }
                yield MatchMaker_1.Matchmaker.removeUser(userId);
                res.status(200).json({ message: "User removed from queue." });
                return;
            }
            catch (error) {
                console.error("Error dequeueing user:", error);
                res.status(500).json({ message: "Internal server error." });
                return;
            }
        });
    },
    /**
     * Get all users currently in the queue
     */
    getQueue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const queue = yield MatchMaker_1.Matchmaker.getQueue();
                res.status(200).json({ queue });
                return;
            }
            catch (error) {
                console.error("Error fetching queue:", error);
                res.status(500).json({ message: "Internal server error." });
                return;
            }
        });
    },
    /**
     * Clear the queue (admin use only)
     */
    clearQueue(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield MatchMaker_1.Matchmaker.clearQueue();
                res.status(200).json({ message: "Queue cleared." });
                return;
            }
            catch (error) {
                console.error("Error clearing queue:", error);
                res.status(500).json({ message: "Internal server error." });
                return;
            }
        });
    }
};

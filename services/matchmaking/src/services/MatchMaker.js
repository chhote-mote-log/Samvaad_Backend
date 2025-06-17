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
exports.Matchmaker = void 0;
const QueueManager_1 = require("./QueueManager");
class Matchmaker {
    /**
     * Enqueue a new user into the matchmaking queue
     */
    static enqueueUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const alreadyInQueue = yield QueueManager_1.QueueManager.isUserInQueue(user.userId);
            if (!alreadyInQueue) {
                yield QueueManager_1.QueueManager.addToQueue(user);
                console.log(`📥 User ${user.userId} added to matchmaking queue.`);
            }
            else {
                console.log(`⚠️ User ${user.userId} is already in the queue.`);
            }
        });
    }
    /**
     * Remove a specific user from the queue
     */
    static removeUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield QueueManager_1.QueueManager.removeUser(userId);
            console.log(`🗑️ User ${userId} removed from matchmaking queue.`);
        });
    }
    /**
     * Return all currently waiting users
     */
    static getQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield QueueManager_1.QueueManager.getQueue();
        });
    }
    /**
     * Check if a user is in the queue
     */
    static isUserQueued(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield QueueManager_1.QueueManager.isUserInQueue(userId);
        });
    }
    /**
     * Clear the matchmaking queue (for admin/debug)
     */
    static clearQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            yield QueueManager_1.QueueManager.clearQueue();
            console.log("🧹 Matchmaking queue cleared.");
        });
    }
}
exports.Matchmaker = Matchmaker;

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL || "redis://localhost:6379");
const QUEUE_KEY = "matchmaking:queue";
exports.QueueManager = {
    /**
     * Add user to the matchmaking queue
     */
    addToQueue: (user) => __awaiter(void 0, void 0, void 0, function* () {
        user.timestamp = Date.now();
        yield redis.lpush(QUEUE_KEY, JSON.stringify(user));
    }),
    /**
     * Remove the last user in the queue (FIFO)
     */
    removeFromQueue: () => __awaiter(void 0, void 0, void 0, function* () {
        const userStr = yield redis.rpop(QUEUE_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }),
    /**
     * Get the entire queue as array of MatchRequest
     */
    getQueue: () => __awaiter(void 0, void 0, void 0, function* () {
        const users = yield redis.lrange(QUEUE_KEY, 0, -1);
        return users.map((u) => JSON.parse(u));
    }),
    /**
     * Remove a specific user by userId
     */
    removeUser: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const queue = yield exports.QueueManager.getQueue();
        const newQueue = queue.filter((u) => u.userId !== userId);
        yield redis.del(QUEUE_KEY);
        for (const user of newQueue.reverse()) {
            yield redis.lpush(QUEUE_KEY, JSON.stringify(user));
        }
    }),
    /**
     * Check if user is already in queue
     */
    isUserInQueue: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const queue = yield exports.QueueManager.getQueue();
        return queue.some((u) => u.userId === userId);
    }),
    /**
     * Clear the entire queue (for testing/dev)
     */
    clearQueue: () => __awaiter(void 0, void 0, void 0, function* () {
        yield redis.del(QUEUE_KEY);
    })
};

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
exports.BackgroundWorker = void 0;
const QueueManager_1 = require("./QueueManager");
const scorer_1 = require("../utils/scorer");
const kafkaProducer_1 = require("../kafka/kafkaProducer");
const dbMatchMaker_1 = require("../services/dbMatchMaker");
class BackgroundWorker {
    static start(interval = 5000) {
        console.log(`⏳ Background worker started (interval: ${interval}ms)`);
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const queue = yield QueueManager_1.QueueManager.getQueue();
                if (queue.length < 2)
                    return;
                const matchedIndices = new Set();
                for (let i = 0; i < queue.length; i++) {
                    if (matchedIndices.has(i))
                        continue;
                    const a = queue[i];
                    let bestMatchIndex = -1;
                    let bestScore = 0;
                    for (let j = i + 1; j < queue.length; j++) {
                        if (matchedIndices.has(j))
                            continue;
                        const b = queue[j];
                        const score = (0, scorer_1.scoreMatch)(a, b);
                        if (score > bestScore && score >= 0.8) {
                            bestScore = score;
                            bestMatchIndex = j;
                        }
                    }
                    if (bestMatchIndex !== -1) {
                        const b = queue[bestMatchIndex];
                        // Remove matched users from queue
                        yield Promise.all([
                            QueueManager_1.QueueManager.removeUser(a.userId),
                            QueueManager_1.QueueManager.removeUser(b.userId),
                        ]);
                        // Send match-found event
                        yield kafkaProducer_1.MatchProducer.sendMatchFoundEvent({
                            users: [a.userId, b.userId],
                            debateType: a.debateType,
                            mode: a.mode,
                            timestamp: Date.now(),
                        });
                        console.log(`✅ Match found: ${a.userId} vs ${b.userId} (score: ${bestScore.toFixed(2)})`);
                        yield dbMatchMaker_1.MatchService.createMatch({
                            userAId: a.userId,
                            userBId: b.userId,
                            debateType: a.debateType,
                            mode: a.mode,
                            score: bestScore,
                        });
                        matchedIndices.add(i);
                        matchedIndices.add(bestMatchIndex);
                    }
                }
            }
            catch (err) {
                console.error("❌ Error in BackgroundWorker:", err);
            }
        }), interval);
    }
}
exports.BackgroundWorker = BackgroundWorker;

import { QueueManager, MatchRequest } from "./QueueManager";
import { scoreMatch } from "../utils/scorer";
import { MatchProducer } from "../kafka/kafkaProducer";
import { MatchService } from "../services/dbMatchMaker";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");

export class BackgroundWorker {
  static async acquireLock(key: string, ttl: number): Promise<boolean> {
    const result = await (redis.set as any)(
      key,
      "locked",
      "NX",
      "EX",
      ttl.toString()
    );
    return result === "OK";
  }

  static start(interval: number = 5000) {
    console.log(`⏳ Background worker started (interval: ${interval}ms)`);

    setInterval(async () => {
      const lockAcquired = await BackgroundWorker.acquireLock(
        "matchmaking:lock",
        interval / 1000
      );
      if (!lockAcquired) return;

      try {
        let queue = await QueueManager.getQueue();
        const matchedUserIds = new Set<string>();

        while (queue.length >= 2) {
          let matched = false;

          for (let i = 0; i < queue.length; i++) {
            const a = queue[i];
            if (matchedUserIds.has(a.userId)) continue;

            const isPermanentlyMatchedA = await redis.get(
              `matched:${a.userId}`
            );
            if (isPermanentlyMatchedA) continue;
            let bestMatch: MatchRequest | null = null;
            let bestScore = 0;

            for (let j = i + 1; j < queue.length; j++) {
              const b = queue[j];
              if (matchedUserIds.has(b.userId)) continue;
              if (a.userId === b.userId) continue;
              const isPermanentlyMatchedB = await redis.get(
                `matched:${b.userId}`
              );
              if (isPermanentlyMatchedB) continue;

              const score = scoreMatch(a, b);
              if (score > bestScore && score >= 0.8) {
                bestScore = score;
                bestMatch = b;
              }
            }

            if (bestMatch && a.userId !== bestMatch.userId) {
              await Promise.all([
                QueueManager.removeUser(a.userId),
                QueueManager.removeUser(bestMatch.userId),
              ]);

              console.log(
                "Before removal:",
                queue.map((u) => u.userId)
              );

              queue = queue.filter(
                (u) => u.userId !== a.userId && u.userId !== bestMatch.userId
              );

              console.log(
                "After removal:",
                queue.map((u) => u.userId)
              );

              matchedUserIds.add(a.userId);
              matchedUserIds.add(bestMatch.userId);
              const matchId = `${a.userId}:${bestMatch.userId}`;
              const alreadyMatched = await redis.get(`match-event:${matchId}`);
              if (alreadyMatched) return;

              await Promise.all([
                redis.set(`matched:${a.userId}`, "true"),
                redis.set(`matched:${bestMatch.userId}`, "true"),
              ]);

              await MatchProducer.sendMatchFoundEvent({
                users: [a.userId, bestMatch.userId],
                debateType: a.debateType,
                mode: a.mode,
                duration_minutes: 10,
                visibility: "PUBLIC",
                ai_moderation: true,
                chat_enabled: true,
                language: a.language,
                timestamp: Date.now(),
              });
              await redis.setex(`match-event:${matchId}`, 10, "true");

              await MatchService.createMatch({
                userAId: a.userId,
                userBId: bestMatch.userId,
                debateType: a.debateType,
                mode: a.mode,
                score: bestScore,
              });

              console.log(
                `✅ Match found: ${a.userId} vs ${
                  bestMatch.userId
                } (score: ${bestScore.toFixed(2)})`
              );
              queue = await QueueManager.getQueue();

              matched = true;
              break; // Refresh queue
            }
          }

          // 🔁 Refresh queue only after a match
          if (!matched) break;
        }
      } catch (err) {
        console.error("❌ Error in BackgroundWorker:", err);
      }
    }, interval);
  }
}

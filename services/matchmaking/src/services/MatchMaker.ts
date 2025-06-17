import { QueueManager, MatchRequest } from "./QueueManager";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");

export class Matchmaker {
  /**
   * Enqueue a new user into the matchmaking queue
   */
  static async enqueueUser(user: MatchRequest): Promise<void> {
    const alreadyInQueue = await QueueManager.isUserInQueue(user.userId);
    if (!alreadyInQueue) {
       const lastMatch = await redis.get(`recent-match:${user.userId}`);
  if (lastMatch) {
    console.log(`🛑 User ${user.userId} was just matched recently. Skipping re-enqueue.`);
    return;
  }

  await QueueManager.addToQueue(user);
  console.log(`📥 User ${user.userId} added to matchmaking queue.`);

  // Prevent immediate re-enqueue
  await redis.setex(`recent-match:${user.userId}`, 10, "true"); // 10s cooldown
    } else {
      console.log(`⚠️ User ${user.userId} is already in the queue.`);
    }
  }

  /**
   * Remove a specific user from the queue
   */
  static async removeUser(userId: string): Promise<void> {
    await QueueManager.removeUser(userId);
    console.log(`🗑️ User ${userId} removed from matchmaking queue.`);
  }

  /**
   * Return all currently waiting users
   */
  static async getQueue(): Promise<MatchRequest[]> {
    return await QueueManager.getQueue();
  }

  /**
   * Check if a user is in the queue
   */
  static async isUserQueued(userId: string): Promise<boolean> {
    return await QueueManager.isUserInQueue(userId);
  }

  /**
   * Clear the matchmaking queue (for admin/debug)
   */
  static async clearQueue(): Promise<void> {
    await QueueManager.clearQueue();
    console.log("🧹 Matchmaking queue cleared.");
  }
}

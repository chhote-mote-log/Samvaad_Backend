import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");
const QUEUE_KEY = "matchmaking:queue";

export interface MatchRequest {
  userId: string;
  debateType: "professional" | "unprofessional";
  mode: "text" | "audio" | "video";
  elo?: number; // optional, for future use
  language?: string;
  timestamp?: number;
}

export const QueueManager = {
  /**
   * Add user to the matchmaking queue
   */
  addToQueue: async (user: MatchRequest): Promise<void> => {
    user.timestamp = Date.now();
    await redis.lpush(QUEUE_KEY, JSON.stringify(user));
  },

  /**
   * Remove the last user in the queue (FIFO)
   */
  removeFromQueue: async (): Promise<MatchRequest | null> => {
    const userStr = await redis.rpop(QUEUE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Get the entire queue as array of MatchRequest
   */
  getQueue: async (): Promise<MatchRequest[]> => {
    const users = await redis.lrange(QUEUE_KEY, 0, -1);
    return users.map((u) => JSON.parse(u));
  },

  /**
   * Remove a specific user by userId
   */
removeUser: async (userId: string): Promise<void> => {
  const queue = await redis.lrange(QUEUE_KEY, 0, -1);
  const filtered = queue.filter(u => JSON.parse(u).userId !== userId);
  if (filtered.length === 0) {
    await redis.del(QUEUE_KEY);
  } else {
    await redis.multi()
      .del(QUEUE_KEY)
      .lpush(QUEUE_KEY, ...filtered.reverse())
      .exec();
  }
},


  /**
   * Check if user is already in queue
   */
  isUserInQueue: async (userId: string): Promise<boolean> => {
    const queue = await QueueManager.getQueue();
    return queue.some((u) => u.userId === userId);
  },

  /**
   * Clear the entire queue (for testing/dev)
   */
  clearQueue: async (): Promise<void> => {
    await redis.del(QUEUE_KEY);
  }
};

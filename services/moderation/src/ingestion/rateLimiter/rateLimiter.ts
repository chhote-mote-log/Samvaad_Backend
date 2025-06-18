// src/ingestion/rateLimiter/rateLimiter.ts
// src: services/moderation/src/ingestion/rateLimiter/rateLimiter.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';

const limiter = new RateLimiterMemory({
  points: 10, // Max 10 messages
  duration: 1, // per second
});

export async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    await limiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}

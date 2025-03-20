import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || '');

export class RateLimit {
  limit: number;
  windowSeconds: number;
  keyPrefix: string;

  constructor(limit: number, windowSeconds: number, keyPrefix = 'rate:') {
    this.limit = limit;
    this.windowSeconds = windowSeconds;
    this.keyPrefix = keyPrefix;
  }

  private getFullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async tryIncrementAndGetCount(
    key: string
  ): Promise<{ count: number; success: boolean }> {
    try {
      const fullKey = this.getFullKey(key);
      const oldCount = await this.checkKey(key);

      if (oldCount >= this.limit) {
        return { count: oldCount, success: false };
      }

      const currentCount = await redis.incr(fullKey);

      if (currentCount === 1) {
        await redis.expire(fullKey, this.windowSeconds);
      }

      return { count: currentCount, success: true };
    } catch (error) {
      console.error('Rate limit error:', error);
      return { count: 0, success: true };
    }
  }

  async checkKey(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const currentCount = await redis.get(fullKey);
      return currentCount ? parseInt(currentCount, 10) : 0;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return 0;
    }
  }

  async getRemainingTime(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      return await redis.ttl(fullKey);
    } catch (error) {
      console.error('Error getting remaining time:', error);
      return 0;
    }
  }

  async reset(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      await redis.del(fullKey);
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }
  }
}

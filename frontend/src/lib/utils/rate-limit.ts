import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || '');

export class RateLimit {
  limit: number;
  windowSeconds: number;

  constructor(limit: number, windowSeconds: number) {
    this.limit = limit;
    this.windowSeconds = windowSeconds;
  }

  async incrementAndGetCount(key: string) {
    const currentCount = await redis.incr(`rate:${key}`);

    if (currentCount === 1) {
      await redis.expire(key, this.windowSeconds);
    }
    return currentCount;
  }

  async checkKey(key: string) {
    const currentCount = await redis.get(`rate:${key}`);
    return currentCount ? parseInt(currentCount, 10) : 0;
  }
}

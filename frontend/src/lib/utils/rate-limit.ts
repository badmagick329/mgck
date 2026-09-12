import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || '');

// Keep admission and expiry atomic across requests and server instances.
const incrementScript = `
  local count = tonumber(redis.call('GET', KEYS[1]) or '0')
  if count >= tonumber(ARGV[1]) then
    return {count, 0}
  end
  count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
  end
  return {count, 1}
`;

export class RateLimit {
  constructor(
    private readonly limit: number,
    private readonly windowSeconds: number,
    private readonly keyPrefix = 'rate:',
    private readonly failOpen = true
  ) {}

  async tryIncrementAndGetCount(
    key: string
  ): Promise<{ count: number; success: boolean }> {
    try {
      const [count, admitted] = (await redis.eval(
        incrementScript,
        1,
        `${this.keyPrefix}${key}`,
        this.limit,
        this.windowSeconds
      )) as [number, number];
      return { count, success: admitted === 1 };
    } catch (error) {
      console.error('Rate limit error:', error);
      return { count: 0, success: this.failOpen };
    }
  }
}

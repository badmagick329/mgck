import Redis from 'ioredis';

const REDIS_TIMEOUT_MS = 2000;

// Created on first admission check, never at import: server-action modules are
// imported during `next build` and by every route that bundles them.
let client: Redis | undefined;
let connecting: Promise<void> | undefined;

async function getRedis(): Promise<Redis> {
  client ??= createClient();
  // No background reconnects: while Redis is down, each admission check makes
  // one bounded attempt (shared by concurrent callers) and fails closed.
  if (client.status === 'wait' || client.status === 'end') {
    const redis = client;
    connecting ??= redis.connect().finally(() => {
      connecting = undefined;
    });
    await connecting;
  } else if (connecting) {
    await connecting;
  }
  return client;
}

function createClient(): Redis {
  const redis = new Redis(process.env.REDIS_URL || '', {
    lazyConnect: true,
    connectTimeout: REDIS_TIMEOUT_MS,
    commandTimeout: REDIS_TIMEOUT_MS,
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
  // Failures already reach callers as rejected commands; without a listener
  // ioredis also reports each one as an unhandled error event.
  redis.on('error', () => {});
  return redis;
}

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
    private readonly keyPrefix = 'rate:'
  ) {}

  async tryIncrementAndGetCount(
    key: string
  ): Promise<{ count: number; success: boolean }> {
    try {
      const redis = await getRedis();
      const [count, admitted] = (await redis.eval(
        incrementScript,
        1,
        `${this.keyPrefix}${key}`,
        this.limit,
        this.windowSeconds
      )) as [number, number];
      return { count, success: admitted === 1 };
    } catch {
      console.error('Rate limit unavailable');
      return { count: 0, success: false };
    }
  }
}

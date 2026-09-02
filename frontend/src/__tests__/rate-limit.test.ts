jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    expire: jest.fn(),
    get: jest.fn(),
    incr: jest.fn(),
    ttl: jest.fn(),
    del: jest.fn(),
  }))
);

import Redis from 'ioredis';

import { RateLimit } from '@/lib/utils/rate-limit';

const mockRedis = (Redis as unknown as jest.Mock).mock.results[0].value;

describe('RateLimit failure policy', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRedis.get.mockRejectedValue(new Error('redis unavailable'));
    mockRedis.incr.mockRejectedValue(new Error('redis unavailable'));
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test('fails closed when configured for a paid API action', async () => {
    const rateLimit = new RateLimit(20, 60, 'rate:emojify:', false);

    await expect(rateLimit.tryIncrementAndGetCount('user')).resolves.toEqual({
      count: 0,
      success: false,
    });
  });

  test('preserves fail-open behavior for existing callers by default', async () => {
    const rateLimit = new RateLimit(3, 60);

    await expect(rateLimit.tryIncrementAndGetCount('user')).resolves.toEqual({
      count: 0,
      success: true,
    });
  });
});

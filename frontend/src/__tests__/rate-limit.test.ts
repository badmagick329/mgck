jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    eval: jest.fn(),
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
    mockRedis.eval.mockRejectedValue(new Error('redis unavailable'));
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test('fails closed when configured for a paid API action', async () => {
    const rateLimit = new RateLimit(20, 60, 'rate:emojify:');

    await expect(rateLimit.tryIncrementAndGetCount('user')).resolves.toEqual({
      count: 0,
      success: false,
    });
  });

  test('fails closed for default callers too', async () => {
    const rateLimit = new RateLimit(3, 60);

    await expect(rateLimit.tryIncrementAndGetCount('user')).resolves.toEqual({
      count: 0,
      success: false,
    });
  });

  test.each([
    [[1, 1], { count: 1, success: true }],
    [[3, 1], { count: 3, success: true }],
    [[3, 0], { count: 3, success: false }],
  ])('uses the atomic admission result %j', async (reply, expected) => {
    mockRedis.eval.mockResolvedValue(reply);
    const rateLimit = new RateLimit(3, 60, 'feedback:');

    await expect(rateLimit.tryIncrementAndGetCount('user')).resolves.toEqual(
      expected
    );
    expect(mockRedis.eval).toHaveBeenCalledWith(
      expect.any(String),
      1,
      'feedback:user',
      3,
      60
    );
  });
});

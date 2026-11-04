/**
 * @jest-environment node
 */
import { createServer, type AddressInfo, type Server } from 'node:net';

// MGK-24: the limiter's Redis client once connected at module import (so during
// `next build`) and, with Redis down, reconnected forever, logging an unhandled
// error event each time. These tests use the real ioredis driver against local
// sockets.

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return (server.address() as AddressInfo).port;
}

async function importRateLimit(redisUrl: string) {
  process.env.REDIS_URL = redisUrl;
  jest.resetModules();
  return (await import('@/lib/utils/rate-limit')).RateLimit;
}

describe('RateLimit Redis connection', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test('importing the limiter opens no connection', async () => {
    let connections = 0;
    const server = createServer((socket) => {
      connections += 1;
      socket.destroy();
    });
    const port = await listen(server);
    try {
      const RateLimit = await importRateLimit(`redis://127.0.0.1:${port}`);
      new RateLimit(3, 60);
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(connections).toBe(0);
    } finally {
      server.close();
    }
  });

  test('broken Redis denies admission with one attempt per check', async () => {
    // Accept and drop every connection, as a crashing Redis would.
    let connections = 0;
    const server = createServer((socket) => {
      connections += 1;
      socket.destroy();
    });
    const port = await listen(server);
    try {
      const RateLimit = await importRateLimit(`redis://127.0.0.1:${port}`);
      const rateLimit = new RateLimit(3, 60);

      for (let attempt = 0; attempt < 2; attempt++) {
        await expect(
          rateLimit.tryIncrementAndGetCount('user')
        ).resolves.toEqual({ count: 0, success: false });
      }
      // Leave time for any background reconnect loop to show itself.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(connections).toBeLessThanOrEqual(2);
    } finally {
      server.close();
    }
  });
});

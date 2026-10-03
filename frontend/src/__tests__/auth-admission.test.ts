/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({ headers: jest.fn() }));
jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({ eval: jest.fn() }))
);

import Redis from 'ioredis';
import { headers } from 'next/headers';
import { admitAuthentication } from '@/lib/account/auth-admission';

const redis = (Redis as unknown as jest.Mock).mock.results[0].value;
const counters = new Map<string, number>();
const client = (address: string | null) =>
  jest
    .mocked(headers)
    .mockResolvedValue(
      new Headers(address ? { 'x-forwarded-for': address } : {}) as never
    );

beforeEach(() => {
  counters.clear();
  redis.eval.mockReset();
  redis.eval.mockImplementation(
    async (_script: string, _keyCount: number, key: string, limit: number) => {
      const count = counters.get(key) || 0;
      if (count >= limit) return [count, 0];
      counters.set(key, count + 1);
      return [count + 1, 1];
    }
  );
});

test('rotating usernames shares the client registration limit; login has its own allowance', async () => {
  client('198.51.100.1');
  for (let index = 0; index < 3; index++)
    expect(
      await admitAuthentication('registration', `new-${index}`)
    ).toBeUndefined();
  expect(await admitAuthentication('registration', 'fresh')).toMatchObject({
    status: 429,
  });
  expect(await admitAuthentication('login', 'existing')).toBeUndefined();
});

test('victim attempts from one client do not lock out a different client', async () => {
  client('198.51.100.1');
  for (let index = 0; index < 5; index++)
    expect(await admitAuthentication('login', 'Alice')).toBeUndefined();
  expect(await admitAuthentication('login', 'ALICE')).toMatchObject({
    status: 429,
  });
  client('198.51.100.2');
  expect(await admitAuthentication('login', 'alice')).toBeUndefined();
});

test('caller-prepended addresses do not create fresh client buckets', async () => {
  for (let index = 0; index < 3; index++) {
    client(`192.0.2.${index + 1}, 198.51.100.1`);
    expect(
      await admitAuthentication('registration', `new-${index}`)
    ).toBeUndefined();
  }
  client('192.0.2.99, 198.51.100.1');
  expect(await admitAuthentication('registration', 'fresh')).toMatchObject({
    status: 429,
  });
});

test('aggregate registration cap survives rotating usernames and client headers', async () => {
  for (let index = 0; index < 10; index++) {
    client(`198.51.100.${index + 1}`);
    expect(
      await admitAuthentication('registration', `new-${index}`)
    ).toBeUndefined();
  }
  client('198.51.100.99');
  expect(await admitAuthentication('registration', 'fresh')).toMatchObject({
    status: 429,
  });
});

test.each([null, 'unknown', '198.51.100.1, bad'])(
  'missing or invalid peer %s fails closed',
  async (address) => {
    client(address);
    expect(await admitAuthentication('login', 'Alice')).toMatchObject({
      status: 503,
    });
    expect(redis.eval).not.toHaveBeenCalled();
  }
);

test('Redis failure denies admission', async () => {
  client('198.51.100.1');
  redis.eval.mockRejectedValue(new Error('unavailable'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(await admitAuthentication('login', 'Alice')).toMatchObject({
    status: 429,
  });
  log.mockRestore();
});

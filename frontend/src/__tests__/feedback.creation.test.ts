/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({ headers: jest.fn() }));
jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({ eval: jest.fn() }))
);
jest.mock('../lib/account/verified-session', () => ({
  getVerifiedCoreSession: jest.fn(),
}));

import Redis from 'ioredis';
import { headers } from 'next/headers';
import { createFeedbackAction } from '@/actions/feedback';
import {
  asFeedbacksSuccessOrError,
  asCreationSuccessOrError,
} from '@/lib/feedback/parsed-server-response';

const redis = (Redis as unknown as jest.Mock).mock.results[0].value;
const counters = new Map<string, number>();
const input = {
  comment: 'Useful feedback',
  createdBy: ' Alice ',
  originPath: '/',
};
const feedback = {
  id: 1,
  ...input,
  createdBy: 'Alice',
  createdAt: '2026-10-03T00:00:00Z',
};
const peer = (ip: string | null) =>
  jest
    .mocked(headers)
    .mockResolvedValue(
      new Headers(
        ip ? { 'x-forwarded-for': ip } : { 'x-real-ip': '198.51.100.1' }
      ) as never
    );

beforeEach(() => {
  counters.clear();
  global.fetch = jest
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify(feedback), { status: 201 })
    );
  redis.eval.mockReset();
  redis.eval.mockImplementation(
    async (_script: string, _keys: number, key: string, limit: number) => {
      const count = counters.get(key) || 0;
      if (count >= limit) return [count, 0];
      counters.set(key, count + 1);
      return [count + 1, 1];
    }
  );
  peer('198.51.100.1');
});

test.each([
  null,
  {},
  { ...input, comment: 42 },
  { ...input, comment: '   ' },
  { ...input, comment: 'x'.repeat(4001) },
  { ...input, createdBy: 'x'.repeat(201) },
  { ...input, originPath: 'x'.repeat(2049) },
  { ...input, originPath: '' },
])(
  'rejects invalid feedback before admission or Core fetch (%j)',
  async (value) => {
    expect(await createFeedbackAction(value as never)).toMatchObject({
      type: 'error',
      status: 400,
    });
    expect(redis.eval).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  }
);

test.each([null, 'bad', '198.51.100.1, invalid', 'fe80::1%eth0'])(
  'fails closed for absent/invalid ingress peer %s',
  async (ip) => {
    peer(ip);
    expect(await createFeedbackAction(input)).toMatchObject({ status: 503 });
    expect(redis.eval).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  }
);

test('caller-prepended IP changes cannot evade the three-per-client allowance', async () => {
  for (let index = 0; index < 3; index++) {
    peer(`192.0.2.${index + 1}, 198.51.100.1`);
    expect(await createFeedbackAction(input)).toMatchObject({
      type: 'success',
    });
  }
  peer('192.0.2.99, 198.51.100.1');
  expect(await createFeedbackAction(input)).toMatchObject({ status: 429 });
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      body: JSON.stringify({ ...input, createdBy: 'Alice' }),
    })
  );
});

test('equivalent IPv6 peers share the same client allowance', async () => {
  peer('2001:db8::1');
  for (let i = 0; i < 3; i++) await createFeedbackAction(input);
  peer('2001:0db8:0000:0000:0000:0000:0000:0001');
  expect(await createFeedbackAction(input)).toMatchObject({ status: 429 });
  expect(fetch).toHaveBeenCalledTimes(3);
});

test('aggregate allowance bounds rotating clients', async () => {
  for (let index = 0; index < 30; index++) {
    peer(`198.51.100.${index + 1}`);
    expect(await createFeedbackAction(input)).toMatchObject({
      type: 'success',
    });
  }
  peer('198.51.100.99');
  expect(await createFeedbackAction(input)).toMatchObject({ status: 429 });
  expect(fetch).toHaveBeenCalledTimes(30);
});

test('Redis failure never forwards a feedback write', async () => {
  redis.eval.mockRejectedValue(new Error('unavailable'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(await createFeedbackAction(input)).toMatchObject({ status: 429 });
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});

test('accepts exact input length boundaries', async () => {
  expect(
    await createFeedbackAction({
      comment: 'x'.repeat(4000),
      createdBy: 'x'.repeat(200),
      originPath: 'x'.repeat(2048),
    })
  ).toMatchObject({ type: 'success' });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('parses bounded cursor pages and rejects the obsolete unbounded array response', async () => {
  expect(
    await asFeedbacksSuccessOrError(
      new Response(JSON.stringify({ feedbacks: [feedback], nextCursor: 1 }))
    )
  ).toMatchObject({
    type: 'success',
    data: { feedbacks: [feedback], nextCursor: 1 },
  });
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(await asFeedbacksSuccessOrError(new Response('[]'))).toMatchObject({
      type: 'error',
    });
    expect(
      await asFeedbacksSuccessOrError(
        new Response(
          JSON.stringify({ feedbacks: Array(51).fill(feedback), nextCursor: 1 })
        )
      )
    ).toMatchObject({ type: 'error' });
  } finally {
    log.mockRestore();
  }
});

test('Core validation errors become a usable form error', async () => {
  expect(
    await asCreationSuccessOrError(
      new Response(JSON.stringify({ errors: { Comment: ['Too long'] } }), {
        status: 400,
      })
    )
  ).toEqual({
    type: 'error',
    status: 400,
    data: { errors: ['Too long'] },
  });
});

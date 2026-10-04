/** @jest-environment node */
import { deleteFeedbackAction, getFeedbacksAction } from '@/actions/feedback';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';

jest.mock('../lib/account/verified-session', () => ({
  getVerifiedCoreSession: jest.fn(),
}));
jest.mock('../lib/utils/rate-limit', () => ({ RateLimit: jest.fn() }));
jest.mock('next/headers', () => ({ headers: jest.fn() }));

const session = {
  accessToken: 'verified-token',
  userId: 'user-1',
  username: 'Admin',
  role: 'Admin',
  expiresAt: 9999999999,
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

test.each([null, { ...session, role: 'AcceptedUser' }])(
  'denies feedback management without an admin session',
  async (value) => {
    jest.mocked(getVerifiedCoreSession).mockResolvedValue(value);
    expect(await getFeedbacksAction()).toMatchObject({
      type: 'error',
      status: 403,
    });
    expect(await deleteFeedbackAction({ feedbackId: 1 })).toMatchObject({
      type: 'error',
      status: 403,
    });
    expect(fetch).not.toHaveBeenCalled();
  }
);

test('forwards the verified token for feedback listing and deletion', async () => {
  jest.mocked(getVerifiedCoreSession).mockResolvedValue(session);
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(new Response('{"feedbacks":[],"nextCursor":null}'))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));

  expect(await getFeedbacksAction()).toMatchObject({ type: 'success' });
  expect(await deleteFeedbackAction({ feedbackId: 1 })).toEqual({
    success: true,
  });
  expect(fetch).toHaveBeenNthCalledWith(1, expect.any(String), {
    headers: { Authorization: 'Bearer verified-token' },
    cache: 'no-store',
  });
  expect(fetch).toHaveBeenNthCalledWith(2, expect.any(String), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer verified-token',
    },
    body: JSON.stringify({ id: 1 }),
  });
});

test('forwards a validated pagination cursor', async () => {
  jest.mocked(getVerifiedCoreSession).mockResolvedValue(session);
  jest
    .mocked(fetch)
    .mockResolvedValue(new Response('{"feedbacks":[],"nextCursor":null}'));
  expect(await getFeedbacksAction(123)).toMatchObject({ type: 'success' });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('?beforeId=123'),
    expect.any(Object)
  );
});

test.each([0, -1, 1.5, NaN, 2147483648])(
  'invalid cursor %s makes no Core request',
  async (cursor) => {
    jest.mocked(getVerifiedCoreSession).mockResolvedValue(session);
    expect(await getFeedbacksAction(cursor)).toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  }
);

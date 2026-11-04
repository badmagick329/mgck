/** @jest-environment node */
jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('../lib/account/core-token', () => ({
  verifyCoreAccessToken: jest.fn(),
}));
import { cookies } from 'next/headers';
import { verifyCoreAccessToken } from '@/lib/account/core-token';
type FollowingActions = typeof import('@/actions/kpop-following');
const originalBaseUrl = process.env.CORE_API_BASE_URL;
let addAccountFollowing: FollowingActions['addAccountFollowing'];
let mergeAccountFollowing: FollowingActions['mergeAccountFollowing'];
let removeAccountFollowing: FollowingActions['removeAccountFollowing'];
// The actions read CORE_API_BASE_URL at module load, so import after setting it.
beforeAll(async () => {
  process.env.CORE_API_BASE_URL = 'http://core.test';
  ({ addAccountFollowing, mergeAccountFollowing, removeAccountFollowing } =
    await import('../actions/kpop-following'));
});
afterAll(() => {
  process.env.CORE_API_BASE_URL = originalBaseUrl;
});

const artist = {
  artistPublicId: '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5',
  displayName: 'Artist',
};
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  jest
    .mocked(cookies)
    .mockResolvedValue({ get: () => ({ value: 'current-token' }) } as never);
  jest.mocked(verifyCoreAccessToken).mockResolvedValue({
    ok: true,
    session: {
      accessToken: 'current-token',
      userId: 'bob',
      username: 'Bob',
      role: 'AcceptedUser',
      expiresAt: 9999999999,
    },
  });
});

test('pending A additions, removals and anonymous imports cannot be sent under B cookies', async () => {
  expect(await addAccountFollowing(artist, 'alice')).toEqual({
    type: 'unauthenticated',
  });
  expect(await removeAccountFollowing(artist.artistPublicId, 'alice')).toEqual({
    type: 'unauthenticated',
  });
  expect(await mergeAccountFollowing([artist], 'alice')).toEqual({
    type: 'unauthenticated',
  });
  expect(fetch).not.toHaveBeenCalled();
  expect(verifyCoreAccessToken).toHaveBeenCalledTimes(3);
});

test('the selected account can still persist follows', async () => {
  jest.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify({ userId: 'bob', artists: [] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  );
  expect(await addAccountFollowing(artist, 'bob')).toMatchObject({
    type: 'ok',
    data: { userId: 'bob' },
  });
  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer current-token',
      }),
    })
  );
});

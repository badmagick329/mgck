/**
 * @jest-environment node
 */

import { loginUserAction, logoutUserAction } from '@/actions/account';
import { NAME_CLAIM, NAME_IDENTIFIER_CLAIM } from '@/lib/account/core-token';
import { REFRESH_COOKIE_MAX_AGE_SECONDS } from '@/lib/account/auth-cookies';
import { fetchWithAuthHeader } from '@/lib/account/requests';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('../lib/account/requests', () => ({
  fetchWithAuthHeader: jest.fn(),
}));

const mockedCookies = jest.mocked(cookies);
const mockedFetchWithAuthHeader = jest.mocked(fetchWithAuthHeader);
const issuer = 'http://core.test';
const audience = 'http://core.test';
const signingKey = 'test-core-signing-key-at-least-32-characters-long';
const originalEnv = process.env;
const cookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

async function createToken(
  key = signingKey,
  expiresAt = Math.floor(Date.now() / 1000) + 300
) {
  return new SignJWT({
    [NAME_IDENTIFIER_CLAIM]: 'core-user-123',
    [NAME_CLAIM]: 'Alice',
    role: 'AcceptedUser',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(key));
}

describe('account server actions', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT__Issuer: issuer,
      JWT__Audience: audience,
      JWT__SigningKey: signingKey,
    };
    jest.clearAllMocks();
    mockedCookies.mockResolvedValue(cookieStore as never);
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('verifies login tokens and sets consistent persistent cookies', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const token = await createToken(signingKey, expiresAt);
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ token, refreshToken: 'device-session' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await loginUserAction({
      username: 'Alice',
      password: 'password1',
    });

    expect(result).toEqual({
      type: 'success',
      status: 200,
      data: { message: 'Received new tokens' },
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      'token',
      token,
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: expect.any(Number),
      })
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'refreshToken',
      'device-session',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
      })
    );
    const accessOptions = cookieStore.set.mock.calls[0][2];
    expect(accessOptions.maxAge).toBeGreaterThanOrEqual(299);
    expect(accessOptions.maxAge).toBeLessThanOrEqual(300);
  });

  test('rejects forged login tokens without setting cookies', async () => {
    const token = await createToken(
      'forged-signing-key-at-least-32-characters-long'
    );
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ token, refreshToken: 'device-session' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await loginUserAction({
      username: 'Alice',
      password: 'password1',
    });

    expect(result).toEqual(
      expect.objectContaining({ type: 'error', status: 502 })
    );
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  test('sends the current refresh token on logout and always clears cookies', async () => {
    cookieStore.get.mockImplementation((name: string) => {
      if (name === 'token') return { value: 'access-token' };
      if (name === 'refreshToken') return { value: 'device-session' };
      return undefined;
    });
    mockedFetchWithAuthHeader.mockResolvedValue({
      type: 'success',
      status: 200,
      data: { message: 'User logged out' },
    });

    const result = await logoutUserAction();

    expect(result).toEqual(
      expect.objectContaining({ type: 'success', status: 200 })
    );
    expect(mockedFetchWithAuthHeader).toHaveBeenCalledWith({
      url: expect.stringContaining('/api/auth/logout'),
      method: 'POST',
      data: { refreshToken: 'device-session' },
    });
    expect(cookieStore.delete).toHaveBeenCalledWith('token');
    expect(cookieStore.delete).toHaveBeenCalledWith('refreshToken');
  });

  test('clears local cookies when the Core logout request fails', async () => {
    cookieStore.get.mockImplementation((name: string) => ({
      value: name === 'token' ? 'access-token' : 'device-session',
    }));
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockedFetchWithAuthHeader.mockRejectedValue(new Error('offline'));

    const result = await logoutUserAction();

    expect(result).toEqual(expect.objectContaining({ type: 'error' }));
    expect(cookieStore.delete).toHaveBeenCalledWith('token');
    expect(cookieStore.delete).toHaveBeenCalledWith('refreshToken');
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to revoke Core refresh session',
      expect.any(Error)
    );
  });
});

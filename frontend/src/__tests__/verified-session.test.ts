/**
 * @jest-environment node
 */

import { canUseAiEmojis, canUseShortener } from '@/lib/account/permissions';
import { NAME_CLAIM, NAME_IDENTIFIER_CLAIM } from '@/lib/account/core-token';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

const mockedCookies = jest.mocked(cookies);
const issuer = 'http://core.test';
const audience = 'http://core.test';
const signingKey = 'test-core-signing-key-at-least-32-characters-long';
const originalEnv = process.env;

async function createToken(key = signingKey) {
  return new SignJWT({
    [NAME_IDENTIFIER_CLAIM]: 'core-user-123',
    [NAME_CLAIM]: 'Alice',
    role: 'User',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(key));
}

function mockTokenCookie(token: string) {
  mockedCookies.mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: token }),
  } as never);
}

describe('verified Core session authorization', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT__Issuer: issuer,
      JWT__Audience: audience,
      JWT__SigningKey: signingKey,
    };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('verified tokens expose identity and unlock role-gated features', async () => {
    mockTokenCookie(await createToken());

    const session = await getVerifiedCoreSession();

    expect(session).toEqual(
      expect.objectContaining({ userId: 'core-user-123', username: 'Alice' })
    );
    expect(canUseAiEmojis(session)).toBe(true);
    expect(canUseShortener(session)).toBe(true);
  });

  test('forged tokens cannot expose identity or unlock role-gated features', async () => {
    mockTokenCookie(
      await createToken('forged-signing-key-at-least-32-characters-long')
    );

    const session = await getVerifiedCoreSession();

    expect(session).toBeNull();
    expect(canUseAiEmojis(session)).toBe(false);
    expect(canUseShortener(session)).toBe(false);
  });
});

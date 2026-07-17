/**
 * @jest-environment node
 */

import {
  NAME_CLAIM,
  NAME_IDENTIFIER_CLAIM,
  verifyCoreAccessToken,
} from '@/lib/account/core-token';
import { SignJWT } from 'jose';

const issuer = 'http://core.test';
const audience = 'http://core.test';
const signingKey = 'test-core-signing-key-at-least-32-characters-long';
const originalEnv = process.env;

async function createToken({
  key = signingKey,
  tokenIssuer = issuer,
  tokenAudience = audience,
  expiresAt = '5m',
  algorithm = 'HS256',
  claims = {},
}: {
  key?: string;
  tokenIssuer?: string;
  tokenAudience?: string;
  expiresAt?: string | number;
  algorithm?: 'HS256' | 'HS384';
  claims?: Record<string, unknown>;
} = {}) {
  return new SignJWT({
    [NAME_IDENTIFIER_CLAIM]: 'core-user-123',
    [NAME_CLAIM]: 'Alice',
    role: 'User',
    ...claims,
  })
    .setProtectedHeader({ alg: algorithm })
    .setIssuer(tokenIssuer)
    .setAudience(tokenAudience)
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(key));
}

describe('Core token verification', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT__Issuer: issuer,
      JWT__Audience: audience,
      JWT__SigningKey: signingKey,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns verified stable identity and role claims', async () => {
    const token = await createToken();
    const result = await verifyCoreAccessToken(token);

    expect(result).toEqual({
      ok: true,
      session: expect.objectContaining({
        accessToken: token,
        userId: 'core-user-123',
        username: 'Alice',
        role: 'User',
      }),
    });
  });

  test.each([
    ['malformed', async () => 'not-a-token'],
    [
      'wrong signature',
      () => createToken({ key: 'wrong-key-at-least-32-characters-long' }),
    ],
    ['wrong issuer', () => createToken({ tokenIssuer: 'http://wrong.test' })],
    [
      'wrong audience',
      () => createToken({ tokenAudience: 'http://wrong.test' }),
    ],
    [
      'expired',
      () => createToken({ expiresAt: Math.floor(Date.now() / 1000) - 1 }),
    ],
    ['wrong algorithm', () => createToken({ algorithm: 'HS384' })],
    [
      'missing stable ID',
      () => createToken({ claims: { [NAME_IDENTIFIER_CLAIM]: undefined } }),
    ],
    [
      'missing username',
      () => createToken({ claims: { [NAME_CLAIM]: undefined } }),
    ],
    ['invalid role', () => createToken({ claims: { role: 123 } })],
    ['empty role', () => createToken({ claims: { role: ' ' } })],
  ])('rejects %s tokens', async (_label, tokenFactory) => {
    const result = await verifyCoreAccessToken(await tokenFactory());
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  test('fails closed when verification configuration is missing', async () => {
    delete process.env.JWT__SigningKey;
    const result = await verifyCoreAccessToken(await createToken());
    expect(result).toEqual({ ok: false, reason: 'configuration' });
  });
});

/**
 * @jest-environment node
 */

import { NAME_CLAIM, NAME_IDENTIFIER_CLAIM } from '@/lib/account/core-token';
import { middleware } from '@/middleware';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const issuer = 'http://core.test';
const audience = 'http://core.test';
const signingKey = 'test-core-signing-key-at-least-32-characters-long';
const originalEnv = process.env;

async function createToken(
  expiresAt: string | number = '5m',
  key = signingKey
) {
  return new SignJWT({
    [NAME_IDENTIFIER_CLAIM]: 'core-user-123',
    [NAME_CLAIM]: 'Alice',
    role: 'User',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(key));
}

function request(path: string, token?: string, refreshToken?: string) {
  const cookies = [
    token ? `token=${token}` : '',
    refreshToken ? `refreshToken=${refreshToken}` : '',
  ]
    .filter(Boolean)
    .join('; ');
  return new NextRequest(`http://localhost:5000${path}`, {
    headers: cookies ? { Cookie: cookies } : undefined,
  });
}

describe('authentication middleware', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT__Issuer: issuer,
      JWT__Audience: audience,
      JWT__SigningKey: signingKey,
    };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('passes through a valid token without refreshing', async () => {
    const response = await middleware(
      request('/milestones', await createToken(), 'refresh-token')
    );

    expect(response.status).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.cookies.get('token')).toBeUndefined();
  });

  test.each([
    ['near expiry', Math.floor(Date.now() / 1000) + 5],
    ['expired', Math.floor(Date.now() / 1000) - 1],
  ])(
    'refreshes a %s token and forwards it to the same request',
    async (_label, expiry) => {
      const refreshedToken = await createToken('5m');
      (global.fetch as jest.Mock).mockResolvedValue(
        new Response(
          JSON.stringify({
            token: refreshedToken,
            refreshToken: 'rotated-refresh-token',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const response = await middleware(
        request('/milestones', await createToken(expiry), 'refresh-token')
      );

      expect(response.status).toBe(200);
      expect(response.cookies.get('token')?.value).toBe(refreshedToken);
      expect(response.cookies.get('refreshToken')?.value).toBe(
        'rotated-refresh-token'
      );
      expect(response.headers.get('x-middleware-request-cookie')).toContain(
        `token=${refreshedToken}`
      );
    }
  );

  test('rejects an invalid refreshed access token', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          token: await createToken(
            '5m',
            'wrong-key-at-least-32-characters-long'
          ),
          refreshToken: 'rotated-refresh-token',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const response = await middleware(
      request('/milestones', 'invalid-token', 'refresh-token')
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get('token')?.value).toBe('');
    expect(response.headers.get('x-middleware-request-cookie')).not.toContain(
      'token='
    );
  });

  test('clears stale cookies and redirects a protected route after refresh failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response('{}', { status: 401 })
    );

    const response = await middleware(
      request('/account/home', 'invalid-token', 'refresh-token')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:5000/account/login'
    );
    expect(response.cookies.get('token')?.value).toBe('');
    expect(response.cookies.get('refreshToken')?.value).toBe('');
  });

  test('clears a near-expiry token when its proactive refresh fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response('{}', { status: 503 })
    );

    const response = await middleware(
      request(
        '/milestones',
        await createToken(Math.floor(Date.now() / 1000) + 5),
        'refresh-token'
      )
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get('token')?.value).toBe('');
    expect(response.cookies.get('refreshToken')?.value).toBe('');
  });
});

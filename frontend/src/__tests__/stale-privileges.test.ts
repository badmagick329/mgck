/**
 * @jest-environment node
 */

// MGK-18: an access token keeps its role until it expires, so a demoted user's
// already-issued token must not keep Django-side privileges.
jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

import { changeAiAvailability } from '@/actions/ai-monitoring';
import { NAME_CLAIM, NAME_IDENTIFIER_CLAIM } from '@/lib/account/core-token';
import { getCurrentCoreSession } from '@/lib/account/verified-session';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const issuer = 'http://core.test';
const signingKey = 'test-core-signing-key-at-least-32-characters-long';
const originalEnv = process.env;
const djangoRequests: { url: string; headers: Record<string, string> }[] = [];
let coreRoleResponse: () => Promise<Response>;

async function signInWithTokenRole(role: string) {
  const token = await new SignJWT({
    [NAME_IDENTIFIER_CLAIM]: 'core-user-123',
    [NAME_CLAIM]: 'Alice',
    role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setAudience(issuer)
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(signingKey));
  jest.mocked(cookies).mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: token }),
  } as never);
  return token;
}

function coreReportsRole(role: string) {
  coreRoleResponse = async () =>
    new Response(JSON.stringify({ username: 'Alice', role }));
}

beforeEach(() => {
  process.env = {
    ...originalEnv,
    JWT__Issuer: issuer,
    JWT__Audience: issuer,
    JWT__SigningKey: signingKey,
    CORE_API_BASE_URL: 'http://core.test',
    BASE_URL: 'http://django.test',
    NEXT_DJANGO_INTERNAL_API_KEY: 'test-internal-key-at-least-32-characters',
  };
  djangoRequests.length = 0;
  global.fetch = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith('http://core.test/')) return coreRoleResponse();
      djangoRequests.push({
        url,
        headers: (init?.headers ?? {}) as Record<string, string>,
      });
      return new Response(JSON.stringify({ record: null }));
    }
  ) as typeof fetch;
});

afterAll(() => {
  process.env = originalEnv;
});

// The shortener reads BASE_URL at module load, so load it after the env is set.
async function createShortenedUrl(input: { url: string; customCode: string }) {
  const actions = await import('@/actions/urlshortener');
  return actions.createShortenedUrl(input);
}

describe('getCurrentCoreSession', () => {
  test('replaces the token role with the role Core reports now', async () => {
    const token = await signInWithTokenRole('Admin');
    coreReportsRole('AcceptedUser');

    const session = await getCurrentCoreSession();

    expect(session).toEqual(
      expect.objectContaining({ userId: 'core-user-123', role: 'AcceptedUser' })
    );
    expect(fetch).toHaveBeenCalledWith(
      'http://core.test/api/role',
      expect.objectContaining({
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
    );
  });

  test.each([
    ['a deleted user', async () => new Response(null, { status: 401 })],
    ['an unreachable Core', () => Promise.reject(new Error('ECONNREFUSED'))],
    ['a malformed reply', async () => new Response('{"role":""}')],
  ])('fails closed for %s', async (_, response) => {
    await signInWithTokenRole('Admin');
    coreRoleResponse = response;

    expect(await getCurrentCoreSession()).toBeNull();
  });
});

describe('an already-issued token after demotion', () => {
  test('forwards the current role to Django, not the token role', async () => {
    await signInWithTokenRole('Admin');
    coreReportsRole('AcceptedUser');
    const form = new FormData();
    form.set('enabled', 'false');

    await changeAiAvailability(form).catch(() => undefined);

    expect(djangoRequests).toHaveLength(1);
    expect(djangoRequests[0].headers['X-MGCK-Core-Role']).toBe('AcceptedUser');
  });

  test('cannot reach the URL shortener once demoted to NewUser', async () => {
    await signInWithTokenRole('AcceptedUser');
    coreReportsRole('NewUser');

    const result = await createShortenedUrl({
      url: 'https://example.com',
      customCode: '',
    });

    expect(result.error).toBeDefined();
    expect(djangoRequests).toHaveLength(0);
  });

  test('still reaches the URL shortener while the role is current', async () => {
    await signInWithTokenRole('AcceptedUser');
    coreReportsRole('AcceptedUser');

    await createShortenedUrl({ url: 'https://example.com', customCode: '' });

    expect(djangoRequests).toHaveLength(1);
    expect(djangoRequests[0].headers['X-MGCK-Core-Username']).toBe('Alice');
  });
});

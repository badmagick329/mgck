/**
 * @jest-environment node
 */
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

jest.mock('../actions/kpop', () => ({ fetchComebacks: jest.fn() }));
jest.mock('../lib/account/verified-session', () => ({
  getVerifiedCoreSession: jest.fn(),
}));
// Footer's feedback form opens a Redis connection that keeps Jest alive.
jest.mock('../app/_components/Footer', () => () => null);
jest.mock('../app/_components/Navbar', () => () => null);
jest.mock('../app/kpop/_components/ComebacksForm', () => () => null);
jest.mock('../app/kpop/_components/FollowedArtistsDialog', () => () => null);
jest.mock('../app/kpop/_components/FollowingKpopResults', () => () => null);
jest.mock('../app/kpop/_components/KpopInfiniteResults', () => () => null);
jest.mock('../app/kpop/_context/FollowingStore', () => ({
  FollowingProvider: () => null,
}));

const originalEnv = process.env;

function request(path: string) {
  return new NextRequest(`http://localhost:5000${path}`);
}

describe('K-pop canonical routing', () => {
  beforeEach(() => {
    // Default open-ended window starts 7 days back: 261102.
    jest.useFakeTimers({
      now: new Date('2026-11-09T12:00:00Z'),
      doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate', 'setTimeout'],
    });
    process.env = {
      ...originalEnv,
      JWT__Issuer: 'http://core.test',
      JWT__Audience: 'http://core.test',
      JWT__SigningKey: 'test-core-signing-key-at-least-32-characters-long',
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
  });

  test.each([
    ['/kpop?start-date=261102', 'http://localhost:5000/kpop'],
    [
      '/kpop?start-date=250601&page=-4',
      'http://localhost:5000/kpop?start-date=250601',
    ],
    [
      '/kpop?start-date=261102&view=following',
      'http://localhost:5000/kpop?view=following',
    ],
  ])('temporarily redirects %s to its canonical URL', async (path, target) => {
    const response = await middleware(request(path));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(target);
  });

  test.each(['/kpop', '/kpop?start-date=250601', '/kpop?view=following'])(
    'serves canonical %s without redirecting',
    async (path) => {
      const response = await middleware(request(path));

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    }
  );

  test('leaves other routes to the authentication flow', async () => {
    const response = await middleware(request('/gfys?start-date=261102'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  test('declares a self-canonical, and keeps Following out of the index', async () => {
    const { generateMetadata } = await import('@/app/kpop/page');
    const metadataFor = (searchParams: Record<string, string>) =>
      generateMetadata({ searchParams: Promise.resolve(searchParams) });

    expect(await metadataFor({})).toEqual({
      alternates: { canonical: '/kpop' },
    });
    expect(await metadataFor({ 'start-date': '250601' })).toEqual({
      alternates: { canonical: '/kpop?start-date=250601' },
    });
    expect(await metadataFor({ view: 'following' })).toEqual({
      alternates: { canonical: '/kpop?view=following' },
      robots: { index: false, follow: true },
    });
  });
});

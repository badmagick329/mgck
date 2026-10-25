/**
 * @jest-environment node
 */
import { getCanonicalGfysUrl } from '@/lib/gfys';

jest.mock('../actions/gfys', () => ({ fetchGfy: jest.fn() }));
jest.mock('../app/gfys/[videoId]/_components/GfyView', () => () => null);
// Footer's feedback form opens a Redis connection that keeps Jest alive.
jest.mock('../app/_components/Footer', () => () => null);
jest.mock('../app/_components/Navbar', () => () => null);
jest.mock('../app/gfys/_components/GfyList', () => () => null);
jest.mock('../app/gfys/_components/SearchForm', () => () => null);
jest.mock('../app/gfys/_components/SearchNavigation', () => () => null);

const canonical = (query: string) =>
  getCanonicalGfysUrl(new URLSearchParams(query));

describe('getCanonicalGfysUrl', () => {
  test('collapses default, empty and unknown params into one URL', () => {
    const variants = [
      'tags=mv',
      'sort=recent&tags=mv',
      'sort=recent&tags=mv&page=1',
      'page=1&sort=recent&tags=mv',
      'tags=MV&sort=bogus&page=0',
      'tags=+mv+&title=&account=All&start_date=nope&utm_source=x',
      'tags=mv,mv,',
    ];
    for (const variant of variants) {
      expect(canonical(variant)).toBe('/gfys?tags=mv');
    }
  });

  test('orders params stably regardless of input order', () => {
    expect(canonical('page=3&sort=oldest&tags=kpop&title=wave')).toBe(
      canonical('title=wave&tags=kpop&sort=oldest&page=3')
    );
    expect(canonical('page=3&sort=oldest&tags=kpop&title=wave')).toBe(
      '/gfys?title=wave&tags=kpop&sort=oldest&page=3'
    );
    expect(canonical('tags=wendy,irene')).toBe(canonical('tags=irene,wendy'));
  });

  test('keeps distinct tags, pages and sorts distinct', () => {
    const distinct = [
      'tags=mv',
      'tags=kpop',
      'tags=weekly idol',
      'tags=kpop&page=2',
      'tags=kpop&page=100',
      'tags=kpop&sort=most_viewed',
      'tags=kpop&account=archive',
      'tags=kpop&start_date=201019',
    ];
    const urls = distinct.map(canonical);
    expect(new Set(urls).size).toBe(distinct.length);
    expect(urls).not.toContain('/gfys');
    expect(canonical('page=100&sort=recent&tags=kpop')).toBe(
      '/gfys?tags=kpop&page=100'
    );
    expect(canonical('sort=recent&tags=weekly+idol&page=1')).toBe(
      '/gfys?tags=weekly+idol'
    );
  });

  test('normalises dates to the form the search action sends', () => {
    expect(canonical('start_date=201019')).toBe(
      canonical('start_date=2020-10-19')
    );
  });

  test('returns the bare listing only when no filter applies', () => {
    expect(canonical('')).toBe('/gfys');
    expect(canonical('page=1&sort=recent')).toBe('/gfys');
  });

  test('accepts Next page searchParams records', () => {
    expect(
      getCanonicalGfysUrl({ tags: ['171213', 'ignored'], page: '1' })
    ).toBe('/gfys?tags=171213');
  });
});

describe('gfys page metadata', () => {
  test('listing emits the normalised canonical', async () => {
    const { generateMetadata } = await import('@/app/gfys/page');
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ sort: 'recent', tags: 'mv', page: '1' }),
    });
    expect(metadata.alternates).toEqual({ canonical: '/gfys?tags=mv' });
  });

  test('clip page emits a self canonical without the query string', async () => {
    const { fetchGfy } = await import('@/actions/gfys');
    (fetchGfy as jest.Mock).mockResolvedValue({
      display_title: 'Irene',
      tags: ['irene'],
      imgur_id: 'imgur123',
      width: null,
      height: null,
      video_url: 'https://mgck.ink/gfy-videos/imgur123.mp4',
    });
    const { generateMetadata } = await import('@/app/gfys/[videoId]/page');
    const metadata = await generateMetadata({
      params: Promise.resolve({ videoId: 'abc123' }),
    });
    expect(metadata.alternates).toEqual({ canonical: '/gfys/abc123' });
  });
});

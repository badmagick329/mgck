/**
 * @jest-environment node
 */

describe('Gfy server actions', () => {
  let fetchRandomGfy: typeof import('@/actions/gfys').fetchRandomGfy;
  let fetchGfy: typeof import('@/actions/gfys').fetchGfy;

  beforeEach(() => {
    jest.resetModules();
    process.env.BASE_URL = 'http://djangobackend:8002';
    ({ fetchRandomGfy, fetchGfy } = require('../actions/gfys'));
    global.fetch = jest.fn();
  });

  test('serializes filtered search parameters for random selection', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ imgur_id: 'random-id' }), { status: 200 })
    );

    await expect(
      fetchRandomGfy('title=Peek-A-Boo&account=Irene&sort=most_viewed')
    ).resolves.toBe('random-id');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url.pathname).toBe('/api/gfys/random');
    expect(url.searchParams.toString()).toBe('title=Peek-A-Boo&account=Irene');
  });

  const detail = {
    title: 'original',
    display_title: 'Clean title',
    gfy_title: 'Gfycat original',
    gfy_id: 'OriginalSlug',
    tags: ['Irene'],
    date: null,
    account: 'archive',
    imgur_id: 'abc',
    width: null,
    height: null,
    video_url: 'https://mgck.ink/gfy-videos/abc.mp4',
    view_count: 3,
    related_clips: [
      {
        id: 'canonical',
        imgur_id: 'def',
        title: 'Related',
        tags: ['Irene'],
        date: null,
        width: null,
        height: null,
      },
    ],
  };

  test('validates source metadata and related clips at the API boundary', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(detail))
    );
    await expect(fetchGfy('abc')).resolves.toEqual(detail);
  });

  test('accepts an unowned archived clip', async () => {
    const unowned = { ...detail, account: null };
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(unowned))
    );
    await expect(fetchGfy('abc')).resolves.toEqual(unowned);
  });

  test.each([
    { ...detail, display_title: undefined },
    { ...detail, related_clips: [{ ...detail.related_clips[0], id: 42 }] },
    { ...detail, video_url: 'not a URL' },
  ])('rejects malformed clip detail responses', async (response) => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(response))
    );
    await expect(fetchGfy('abc')).resolves.toBeNull();
  });

  test('rejects an unsuccessful detail response even if its body looks valid', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify(detail), { status: 404 })
    );
    await expect(fetchGfy('abc')).resolves.toBeNull();
  });
});

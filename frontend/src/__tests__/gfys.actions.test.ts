/**
 * @jest-environment node
 */

describe('Gfy server actions', () => {
  let fetchRandomGfy: typeof import('@/actions/gfys').fetchRandomGfy;

  beforeEach(() => {
    jest.resetModules();
    process.env.BASE_URL = 'http://djangobackend:8002';
    ({ fetchRandomGfy } = require('../actions/gfys'));
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
    expect(url.searchParams.toString()).toBe(
      'title=Peek-A-Boo&account=Irene'
    );
  });
});

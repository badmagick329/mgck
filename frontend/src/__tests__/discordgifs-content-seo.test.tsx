// Only the route modules' exports matter here, not what they render.
jest.mock('../components/ui/toaster', () => ({ Toaster: () => null }));
jest.mock('../app/_components/Navbar', () => () => null);
jest.mock('../app/_components/Footer', () => () => null);
jest.mock('../app/discordgifs/_components/FileDropzone', () => () => null);

import { discordGifsMetadata } from '@/app/discordgifs/metadata';
import * as discordGifsLayout from '@/app/discordgifs/layout';
import * as discordGifsPage from '@/app/discordgifs/page';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { discordGifMakerCard } from '@/lib/homepage/discord-gif-maker';

describe('Discord GIF Maker SEO', () => {
  test('defines canonical, Open Graph, Twitter, and preview image metadata', () => {
    expect(discordGifsMetadata.alternates).toEqual({
      canonical: '/discordgifs',
    });
    expect(discordGifsMetadata.openGraph).toMatchObject({
      url: '/discordgifs',
      title: 'Discord GIF Maker for Emojis, Stickers, and Avatars',
      description:
        'Make Discord emojis, stickers, and avatars from videos or GIFs. Trim and crop videos, with all processing done in your browser.',
    });
    expect(discordGifsMetadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Discord GIF Maker for Emojis, Stickers, and Avatars',
      description:
        'Make Discord emojis, stickers, and avatars from videos or GIFs. Trim and crop videos, with all processing done in your browser.',
      images: ['/discordgifs/opengraph-image'],
    });
    expect(discordGifsMetadata).not.toHaveProperty('keywords');
    expect(discordGifsMetadata.openGraph).toMatchObject({
      images: [expect.objectContaining({ width: 1200, height: 630 })],
    });
  });

  // MGK-37: /discordgifs?mode=advanced is a link into the same page, not a
  // separate page for search engines.
  test('keeps Advanced mode links canonical to /discordgifs', () => {
    expect(discordGifsLayout.metadata).toBe(discordGifsMetadata);
    expect(discordGifsLayout).not.toHaveProperty('generateMetadata');
    expect(discordGifsPage).not.toHaveProperty('generateMetadata');
    expect(discordGifsMetadata.alternates?.canonical).toBe('/discordgifs');
    expect(discordGifsMetadata.openGraph?.url).toBe('/discordgifs');
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.filter((url) => url.includes('discordgifs'))).toEqual([
      'https://mgck.ink/discordgifs',
    ]);
  });

  test('lists only the intended stable public routes in the sitemap', () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      'https://mgck.ink/',
      'https://mgck.ink/discordgifs',
      'https://mgck.ink/emojify',
      'https://mgck.ink/gfys',
      'https://mgck.ink/image-edit',
      'https://mgck.ink/kpop',
      'https://mgck.ink/milestones',
    ]);
    expect(urls.some((url) => url.includes('/account'))).toBe(false);
    expect(urls.some((url) => url.includes('/api'))).toBe(false);
  });

  test('allows public crawling and advertises the sitemap', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://mgck.ink/sitemap.xml',
    });
  });

  test('uses accurate homepage card wording', () => {
    expect(discordGifMakerCard).toEqual({
      title: 'Discord GIF Maker',
      description:
        'Turn video clips and GIFs into Discord-ready emojis, stickers, and avatars.',
      href: '/discordgifs',
      buttonLabel: 'Open Discord GIF Maker',
    });
  });
});

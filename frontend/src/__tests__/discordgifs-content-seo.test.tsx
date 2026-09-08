import { discordGifsMetadata } from '@/app/discordgifs/metadata';
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
      'https://mgck.ink/shorten',
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

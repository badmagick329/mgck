import type { Metadata } from 'next';

export const discordGifsMetadata: Metadata = {
  title: 'Discord GIF Maker for Emojis, Stickers, and Avatars',
  description:
    'Turn video clips and GIFs into Discord-ready animated emojis, APNG stickers, and GIF avatars. Files are processed privately in your browser.',
  alternates: { canonical: '/discordgifs' },
  openGraph: {
    url: '/discordgifs',
    title: 'Discord GIF Maker for Emojis, Stickers, and Avatars',
    description:
      'Turn video clips and GIFs into Discord-ready animated emojis, APNG stickers, and GIF avatars. Files are processed privately in your browser.',
    images: [
      {
        url: '/discordgifs/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Discord GIF Maker — Emoji, Sticker, and Avatar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discord GIF Maker for Emojis, Stickers, and Avatars',
    description:
      'Turn video clips and GIFs into Discord-ready animated emojis, APNG stickers, and GIF avatars. Files are processed privately in your browser.',
    images: ['/discordgifs/opengraph-image'],
  },
  icons: {
    icon: '/discordgifs.ico',
  },
};

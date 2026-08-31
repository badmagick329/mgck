import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discord GIF Maker for Emojis, Stickers, and Avatars',
  description:
    'Convert videos and GIFs into animated Discord emojis, stickers, and profile avatars that meet Discord size limits.',
  keywords: [
    'discord',
    'emotes',
    'stickers',
    'video',
    'clips',
    'gifs',
    'animated',
    'emojis',
    'avatars',
    'video to gif',
    'size limits',
  ],
  icons: {
    icon: '/discordgifs.ico',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

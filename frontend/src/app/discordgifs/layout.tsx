import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create emotes and stickers',
  description:
    'Use your video clips to make discord emotes and stickers that fit the size limits.',
  keywords: [
    'discord',
    'emotes',
    'stickers',
    'video',
    'clips',
    'gifs',
    'animated',
    'emojis',
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

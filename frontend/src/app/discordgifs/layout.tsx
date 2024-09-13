import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create emotes and stickers',
  description:
    "Create emotes and stickers for Discord from your video clips, complying with Discord's size limits.",
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

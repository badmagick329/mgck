import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a discord emote from a video clip',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

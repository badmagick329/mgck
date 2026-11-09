import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: '/emojify' },
  title: 'Emojifier | Add random emojis to any message',
  description:
    'Add random emojis to any message. Choose an emoji set and intensity, shuffle the result, then copy it.',
  icons: {
    icon: '/emojify.ico',
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

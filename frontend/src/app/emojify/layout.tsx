import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emojify 😀 Your 😳 Message',
  description:
    'Use the emoji generator to improve your messages by 300%. Add an emoji between each word to impress everyone.',
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

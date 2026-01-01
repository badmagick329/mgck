import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Milestones',
  description:
    'Life moves fast. This app slows it down. Set your milestones, watch your countdown, and gain perspective on the time you have.',
  icons: {
    icon: '/milestones.ico',
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

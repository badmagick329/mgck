import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Make choices',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

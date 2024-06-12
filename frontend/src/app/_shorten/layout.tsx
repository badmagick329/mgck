import { GlobalContextProvider } from '@/app/gfys/context/store';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'URL Shortener',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalContextProvider>{children}</GlobalContextProvider>
      <Toaster />
    </>
  );
}

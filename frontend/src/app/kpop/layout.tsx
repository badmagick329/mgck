import { GlobalContextProvider } from '@/app/gfys/context/store';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kpop comebacks',
  description:
    'Check out the latest Kpop comebacks or search for any comebacks you may have missed.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalContextProvider>{children}</GlobalContextProvider>
      <Toaster />
    </>
  );
}

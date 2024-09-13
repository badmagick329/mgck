import { GlobalContextProvider } from '@/app/gfys/context/store';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Red Velvet Gfy Archive',
  description: 'Browse Gfys of the famous Kpop girl group Red Velvet from Imgur.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalContextProvider>{children}</GlobalContextProvider>
      <Toaster />
    </>
  );
}

import { GfyContextProvider } from '@/app/gfys/_context/store';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Red Velvet Gfy Archive',
  description:
    'Browse High Quality Gfys of the famous Kpop girl group Red Velvet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GfyContextProvider>{children}</GfyContextProvider>
      <Toaster />
    </>
  );
}

import { Toaster } from '@/components/ui/toaster';
import { discordGifsMetadata } from './metadata';

export const metadata = discordGifsMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

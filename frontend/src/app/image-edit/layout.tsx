import { Toaster } from '@/components/ui/toaster';
import { autoCropperMetadata } from './metadata';

export const metadata = autoCropperMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

import Navbar from '@/app/_components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Login and Registration',
  description: 'Login or registration for your account.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className={
        'flex min-h-screen flex-col items-center justify-center bg-background-kp'
      }
    >
      <Navbar />
      {children}
      <Toaster />
    </main>
  );
}

import Navbar from '@/app/_components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Login and Registration',
  description: 'Login or registration for your account.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen flex flex-col items-center'>
      <Navbar />
      {children}
      <Toaster />
    </div>
  );
}

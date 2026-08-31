'use client';

import Navbar from '@/app/_components/Navbar';

import { EmojifyContextProvider } from '@/app/emojify/_context/store';
import EmojifyMain from './EmojifyMain';
import Footer from '@/app/_components/Footer';

export default function EmojifyClientPage({
  username,
  showAi,
}: {
  username: string;
  showAi: boolean;
}) {
  return (
    <EmojifyContextProvider>
      <main className='flex min-h-dvh flex-col items-center bg-background-em'>
        <Navbar />
        <EmojifyMain username={username} showAi={showAi} />
        <Footer />
      </main>
    </EmojifyContextProvider>
  );
}

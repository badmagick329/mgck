'use client';

import Navbar from '@/app/_components/Navbar';

import { EmojifyContextProvider } from '@/app/emojify/_context/store';
import EmojifyMain from './EmojifyMain';

export default function EmojifyClientPage({
  username,
  showAi,
}: {
  username: string;
  showAi: boolean;
}) {
  return (
    <EmojifyContextProvider>
      <main className='bg-background-em flex min-h-dvh flex-col items-center'>
        <Navbar />
        <EmojifyMain username={username} showAi={showAi} />
      </main>
    </EmojifyContextProvider>
  );
}

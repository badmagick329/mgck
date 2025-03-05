'use client';

import Navbar from '@/app/_components/Navbar';

import { EmojifyContextProvider } from '@/app/emojify/_context/store';
import EmojifyMain from './EmojifyMain';

export default function EmojifyClientPage({
  username,
  showAi,
  headerTypingSequence,
}: {
  username: string;
  showAi: boolean;
  headerTypingSequence: (string | number)[];
}) {
  return (
    <EmojifyContextProvider>
      <main className='bg-background-em flex min-h-dvh flex-col items-center'>
        <Navbar />
        <EmojifyMain
          username={username}
          showAi={showAi}
          headerTypingSequence={headerTypingSequence}
        />
      </main>
    </EmojifyContextProvider>
  );
}

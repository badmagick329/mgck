'use client';

import Navbar from '@/app/_components/Navbar';

import { EmojifyContextProvider } from '@/app/emojify/_context/store';
import EmojifyMain from './EmojifyMain';
import Footer from '@/app/_components/Footer';

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
      <main className='flex min-h-dvh flex-col items-center bg-background-em'>
        <Navbar />
        <EmojifyMain
          username={username}
          showAi={showAi}
          headerTypingSequence={headerTypingSequence}
        />
        <Footer />
      </main>
    </EmojifyContextProvider>
  );
}

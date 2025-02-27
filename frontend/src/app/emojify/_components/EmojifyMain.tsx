'use client';

import Navbar from '@/components/navbar';

import EmojisField from '@/app/emojify/_components/emojis-field';
import MessageField from '@/app/emojify/_components/message-field';
import OutputField from '@/app/emojify/_components/output-field';
import { EmojifyContextProvider } from '@/app/emojify/_context/store';
import EmojifyHeader from '@/app/emojify/_components/EmojifyHeader';

export default function EmojifyMain({
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
        <article className='flex w-full min-w-[360px] max-w-[800px] flex-col grow px-2 pt-6'>
          <EmojifyHeader username={username} />
          <MessageField />
          <EmojisField aiEnabled={showAi} />
          <OutputField username={username} showAi={showAi} />
        </article>
      </main>
    </EmojifyContextProvider>
  );
}

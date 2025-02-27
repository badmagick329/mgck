'use client';

import Navbar from '@/components/navbar';
import useLocalStorage from '@/hooks/use-local-storage';
import { DEFAULT_EMOJIS } from '@/lib/consts';
import { emojifyText } from '@/lib/utils';
import { useEffect, useState } from 'react';

import EmojisField from '@/app/emojify/_components/emojis-field';
import MessageField from '@/app/emojify/_components/message-field';
import OutputField from '@/app/emojify/_components/output-field';
import ZoomingEmoji from './ZoomingEmoji';
import EmojifyHelpButton from './EmojifyHelpButton';
import { EmojifyContextProvider } from '@/app/emojify/_context/store';

const plainHeaderMessage = (username: string) =>
  username ? `Hello ${username} !` : 'Emojify Your Message';

export default function EmojifyMain({
  username,
  showAi,
}: {
  username: string;
  showAi: boolean;
}) {
  const [messageInput, setMessageInput] = useState('');
  const [headerMessage, setHeaderMessage] = useState(
    plainHeaderMessage(username)
  );
  const { value: emojisInput, updateValue: setEmojisInput } = useLocalStorage(
    'defaultEmojis',
    DEFAULT_EMOJIS.join(' ')
  );

  useEffect(() => {
    const plainMessage = plainHeaderMessage(username);
    setHeaderMessage(emojifyText(plainMessage, DEFAULT_EMOJIS.join(' ')));

    const cancelTimer = setInterval(() => {
      setHeaderMessage(emojifyText(plainMessage, DEFAULT_EMOJIS.join(' ')));
    }, 1500);
    return () => clearInterval(cancelTimer);
  }, []);

  return (
    <EmojifyContextProvider>
      <main className='bg-background-em flex min-h-dvh flex-col'>
        <Navbar />
        <div className='relative mx-auto my-auto'>
          <ZoomingEmoji probability={0.5} />
          <ZoomingEmoji probability={0.1} />
          <ZoomingEmoji probability={0.1} />
          <div className='flex w-full max-w-[800px] flex-col gap-4 z-10'>
            <section className='flex justify-between'>
              <span className='flex justify-center text-2xl'>
                {headerMessage}
              </span>
              <EmojifyHelpButton />
            </section>
            <MessageField
              messageInput={messageInput}
              setMessageInput={setMessageInput}
            />
            <EmojisField
              emojisInput={emojisInput}
              setEmojisInput={setEmojisInput}
              aiEnabled={showAi}
            />
            <OutputField
              messageInput={messageInput}
              emojisInput={emojisInput}
              setEmojisInput={setEmojisInput}
              username={username}
              showAi={showAi}
            />
          </div>
        </div>
      </main>
    </EmojifyContextProvider>
  );
}

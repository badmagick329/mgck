'use client';

import Navbar from '@/components/navbar';
import useLocalStorage from '@/hooks/use-local-storage';
import { DEFAULT_EMOJIS } from '@/lib/consts';
import { emojifyText } from '@/lib/utils';
import { useEffect, useState } from 'react';

import EmojisField from './_components/emojis-field';
import MessageField from './_components/message-field';
import OutputField from './_components/output-field';

const plainHeaderMessage = 'Emojify Your Message';

export default function EmojifyPage() {
  const [messageInput, setMessageInput] = useState('');
  const [headerMessage, setHeaderMessage] = useState(plainHeaderMessage);
  const [emojisInput, setEmojisInput] = useLocalStorage(
    'defaultEmojis',
    DEFAULT_EMOJIS.join(' ')
  );

  useEffect(() => {
    setHeaderMessage(emojifyText(plainHeaderMessage, emojisInput));
    const cancelTimer = setInterval(() => {
      setHeaderMessage(emojifyText(plainHeaderMessage, emojisInput));
    }, 1000);
    return () => clearInterval(cancelTimer);
  }, []);

  return (
    <main className='bg-background-em flex min-h-dvh flex-col'>
      <Navbar />
      <div className='grid grow place-content-center place-items-center px-2'>
        <div className='flex w-full max-w-[800px] flex-col gap-4'>
          <span className='flex justify-center text-2xl'>{headerMessage}</span>
          <MessageField
            messageInput={messageInput}
            setMessageInput={setMessageInput}
          />
          <EmojisField
            emojisInput={emojisInput}
            setEmojisInput={setEmojisInput}
          />
          <OutputField
            messageInput={messageInput}
            emojisInput={emojisInput}
            setEmojisInput={setEmojisInput}
          />
        </div>
      </div>
    </main>
  );
}

'use client';

import Navbar from '@/components/navbar';
import useLocalStorage from '@/hooks/use-local-storage';
import { DEFAULT_EMOJIS } from '@/lib/consts';
import { emojifyText } from '@/lib/utils';
import { useEffect, useState } from 'react';

import EmojisField from '@/app/emojify/_components/emojis-field';
import MessageField from '@/app/emojify/_components/message-field';
import OutputField from '@/app/emojify/_components/output-field';

const plainHeaderMessage = (username: string) =>
  username ? `Hello ${username} !` : 'Emojify Your Message';

export default function EmojifyMain({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const [messageInput, setMessageInput] = useState('');
  const [headerMessage, setHeaderMessage] = useState(plainHeaderMessage(name));
  const [emojisInput, setEmojisInput] = useLocalStorage(
    'defaultEmojis',
    DEFAULT_EMOJIS.join(' ')
  );

  useEffect(() => {
    const plainMessage = plainHeaderMessage(name);
    setHeaderMessage(emojifyText(plainMessage, DEFAULT_EMOJIS.join(' ')));

    const cancelTimer = setInterval(() => {
      setHeaderMessage(emojifyText(plainMessage, DEFAULT_EMOJIS.join(' ')));
    }, 1500);
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

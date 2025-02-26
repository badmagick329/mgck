'use client';

import Navbar from '@/components/navbar';
import useLocalStorage from '@/hooks/use-local-storage';
import { DEFAULT_EMOJIS } from '@/lib/consts';
import { emojifyText } from '@/lib/utils';
import { useEffect, useState } from 'react';

import EmojisField from '@/app/emojify/_components/emojis-field';
import MessageField from '@/app/emojify/_components/message-field';
import OutputField from '@/app/emojify/_components/output-field';
import { NEW_USER_ROLE } from '@/lib/types/auth';

const plainHeaderMessage = (username: string) =>
  username ? `Hello ${username} !` : 'Emojify Your Message';

export default function EmojifyMain({
  username,
  role,
}: {
  username: string;
  role: string;
}) {
  const [messageInput, setMessageInput] = useState('');
  const [headerMessage, setHeaderMessage] = useState(
    plainHeaderMessage(username)
  );
  const [emojisInput, setEmojisInput] = useLocalStorage(
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
            username={username}
            showAi={role !== '' && role !== NEW_USER_ROLE}
          />
        </div>
      </div>
    </main>
  );
}

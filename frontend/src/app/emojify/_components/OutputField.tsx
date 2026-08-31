'use client';

import { useEmojifyContext } from '@/app/emojify/_context/store';
import { emojifyText } from '@/lib/emojify';
import { useEffect, useState } from 'react';

import EmojifyButtons from './EmojifyButtons';

type OutputFieldProps = {
  username: string;
  showAi: boolean;
};

export default function OutputField({ username, showAi }: OutputFieldProps) {
  const { messageInput, emojisInput, intensity } = useEmojifyContext();
  const [output, setOutput] = useState('');
  const [shuffleCount, setShuffleCount] = useState(0);

  useEffect(() => {
    setOutput(emojifyText(messageInput, emojisInput, intensity));
  }, [emojisInput, intensity, messageInput, shuffleCount]);

  return (
    <section className='overflow-hidden rounded-lg border border-primary-em/25 bg-background/50'>
      <div className='flex items-center justify-between border-b border-primary-em/20 bg-primary-em/10 px-4 py-3'>
        <h2 className='text-base font-semibold'>Result</h2>
        <span className='text-xs text-muted-foreground' aria-live='polite'>
          {output ? `${output.length} characters` : 'Waiting for a message'}
        </span>
      </div>
      <div
        className='min-h-36 whitespace-pre-wrap break-words p-4 text-base leading-7'
        aria-live='polite'
      >
        {output || (
          <span className='text-muted-foreground'>
            Your emojified message will appear here.
          </span>
        )}
      </div>
      <EmojifyButtons
        output={output}
        setOutput={setOutput}
        onShuffle={() => setShuffleCount((count) => count + 1)}
        username={username}
        showAi={showAi}
      />
    </section>
  );
}

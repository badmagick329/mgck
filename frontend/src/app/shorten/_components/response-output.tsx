'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { copyToClipboard } from '@/lib/utils';
import { useState } from 'react';

const DEFAULT_MESSAGE = 'Copy to clipboard';

export default function ResponseOutput({ output }: { output: string }) {
  const { toast } = useToast();
  const [buttonText, setButtonText] = useState(DEFAULT_MESSAGE);

  return (
    <div className='flex flex-col items-center gap-4'>
      <div className='flex items-center justify-center gap-4'>
        <span className='md:text-xl'>Shortened URL 👉</span>
        <Button
          className='font-semibold text-green-500 md:text-xl'
          variant='link'
        >
          <a href={output} target='_blank'>
            {output}
          </a>
        </Button>
      </div>
      <Button
        onClick={async () => {
          if (buttonText === 'Copied!') return;

          try {
            await copyToClipboard(output);
            setButtonText('Copied!');
            setTimeout(() => setButtonText(DEFAULT_MESSAGE), 1000);
          } catch (error) {
            setButtonText('Failed to copy');
            setTimeout(() => setButtonText(DEFAULT_MESSAGE), 1000);
          }
        }}
      >
        {buttonText}
      </Button>
      <span className='text-sm'>
        Shortened URLs will be removed after a year of inactivity
      </span>
    </div>
  );
}

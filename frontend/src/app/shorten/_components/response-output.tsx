'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { handleCopyToClipboard } from '@/lib/utils';

export default function ResponseOutput({ output }: { output: string }) {
  const { toast } = useToast();

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
      <Button onClick={() => handleCopyToClipboard(output, toast)}>
        Copy to clipboard
      </Button>
      <span className='text-sm'>
        Shortened URLs will be removed after a year of inactivity
      </span>
    </div>
  );
}

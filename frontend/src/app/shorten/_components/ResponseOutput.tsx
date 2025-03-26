'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { handleCopyToClipboard } from '@/lib/utils';
import Link from 'next/link';

export default function ResponseOutput({ output }: { output: string }) {
  const { toast } = useToast();

  return (
    <div className='flex flex-col items-center gap-4'>
      <div className='flex items-center justify-center gap-4'>
        <span>Shortened URL 👉</span>
        <Link
          className='text-lg font-semibold text-green-500'
          href={output}
          target='_blank'
        >
          {output}
        </Link>
      </div>
      <Button
        className='bg-primary-kp/70 px-8 font-semibold text-primary-foreground hover:bg-primary-kp md:text-lg'
        onClick={() => handleCopyToClipboard(output, toast)}
      >
        Copy to clipboard
      </Button>
    </div>
  );
}

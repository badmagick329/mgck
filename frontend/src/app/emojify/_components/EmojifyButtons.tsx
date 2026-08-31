'use client';

import { useEmojifyContext } from '@/app/emojify/_context/store';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { handleCopyToClipboard } from '@/lib/utils';
import { Copy, Shuffle } from 'lucide-react';
import { useState } from 'react';

import GenerateButton from './GenerateButton';

type EmojifyButtonsProps = {
  output: string;
  setOutput: (output: string) => void;
  onShuffle: () => void;
  username: string;
  showAi: boolean;
};

export default function EmojifyButtons({
  output,
  setOutput,
  onShuffle,
  username,
  showAi,
}: EmojifyButtonsProps) {
  const { toast } = useToast();
  const { emojisInput, messageInput } = useEmojifyContext();
  const [frequent, setFrequent] = useState(false);
  const canRandomize = Boolean(messageInput && emojisInput.trim());

  return (
    <div className='flex flex-col gap-3 border-t border-primary-em/20 p-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={onShuffle}
          disabled={!canRandomize}
          className='border-primary-em/30 bg-transparent hover:bg-primary-em/10'
        >
          <Shuffle />
          Shuffle again
        </Button>
        <Button
          type='button'
          onClick={() => handleCopyToClipboard(output, toast)}
          disabled={!output}
          className='bg-primary-em/80 text-white hover:bg-primary-em'
        >
          <Copy />
          Copy
        </Button>
      </div>
      <GenerateButton
        messageInput={messageInput}
        setOutput={setOutput}
        username={username}
        showAi={showAi}
        frequent={frequent}
        setFrequent={setFrequent}
      />
    </div>
  );
}

'use client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { handleCopyToClipboard } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useEmojifyContext } from '@/app/emojify/_context/store';
import GenerateButton from './GenerateButton';
import { emojifyText } from '@/lib/emojify';

type EmojifyButtonsProps = {
  setOutput: (output: string) => void;
  output: string;
  username: string;
  showAi: boolean;
};

export default function EmojifyButtons({
  setOutput,
  output,
  username,
  showAi,
}: EmojifyButtonsProps) {
  const { toast } = useToast();
  const { emojisInput, messageInput } = useEmojifyContext();
  const [frequent, setFrequent] = useState(true);

  useEffect(() => {
    setOutput(emojifyText(messageInput, emojisInput));
  }, [messageInput, emojisInput, setOutput]);

  return (
    <section className='flex justify-between gap-2 p-2 shadow-glow-primary-em md:gap-6 md:shadow-none'>
      <abbr className='no-underline' title='Copy the output to clipboard'>
        <Button
          className='w-40 bg-primary-em/70 hover:bg-primary-em'
          onClick={() => handleCopyToClipboard(output, toast)}
        >
          Copy 📋
        </Button>
      </abbr>
      <GenerateButton
        messageInput={messageInput}
        setOutput={setOutput}
        username={username}
        showAi={showAi}
        frequent={frequent}
        setFrequent={setFrequent}
      />
    </section>
  );
}

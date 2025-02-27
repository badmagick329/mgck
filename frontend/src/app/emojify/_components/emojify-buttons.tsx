'use client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { handleCopyToClipboard } from '@/lib/utils';
import { useEffect } from 'react';
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

  useEffect(() => {
    setOutput(emojifyText(messageInput, emojisInput));
  }, [messageInput, emojisInput, setOutput]);

  return (
    <section className='grid grid-cols-2 gap-6 p-2 shadow-glow-primary-em md:shadow-none z-10'>
      <Button
        className='bg-primary-em/70 hover:bg-primary-em w-40 justify-self-start'
        onClick={() => handleCopyToClipboard(output, toast)}
      >
        Copy 📋
      </Button>
      <GenerateButton
        messageInput={messageInput}
        setOutput={setOutput}
        username={username}
        showAi={showAi}
      />
    </section>
  );
}

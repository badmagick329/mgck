import { emojifyWithAi } from '@/actions/emojify';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_EMOJIS } from '@/lib/consts';
import { cn, copyToClipboard, emojifyText } from '@/lib/utils';
import { useState } from 'react';

type ToastType = ReturnType<typeof useToast>['toast'];

type EmojifyButtonsProps = {
  messageInput: string;
  emojisInput: string;
  setEmojisInput: (emojisInput: string) => void;
  setOutput: (output: string) => void;
  output: string;
  username: string;
  showAi: boolean;
};

export default function EmojifyButtons({
  messageInput,
  emojisInput,
  setEmojisInput,
  setOutput,
  output,
  username,
  showAi,
}: EmojifyButtonsProps) {
  const { toast } = useToast();

  return (
    <section className='grid grid-cols-2 md:grid-cols-4 gap-6 p-2 shadow-glow-primary-em md:shadow-none z-10'>
      <Button
        className='bg-primary-em/70 hover:bg-primary-em w-40 justify-self-start'
        onClick={() => setOutput(emojifyText(messageInput, emojisInput))}
      >
        Regenerate
      </Button>
      <Button
        className='bg-primary-em/70 hover:bg-primary-em w-40 justify-self-end'
        onClick={() => setEmojisInput(DEFAULT_EMOJIS.join(' '))}
      >
        Reset
      </Button>
      <GenerateButton
        messageInput={messageInput}
        setOutput={setOutput}
        username={username}
        showAi={showAi}
      />
      <Button
        className='bg-primary-em/70 hover:bg-primary-em w-40 justify-self-end'
        onClick={() => handleCopy(output, toast)}
      >
        Copy
      </Button>
    </section>
  );
}

type GenerateButtonProps = {
  setOutput: (output: string) => void;
  messageInput: string;
  username: string;
  showAi: boolean;
};

function GenerateButton({
  messageInput,
  setOutput,
  username,
  showAi,
}: GenerateButtonProps) {
  const [generating, setGenerating] = useState(false);

  if (!showAi) {
    return null;
  }

  return (
    <Button
      className='bg-primary-em/70 hover:bg-primary-em w-40 justify-self-start'
      disabled={generating}
      onClick={async () => {
        try {
          setGenerating(true);
          const generatedText = await emojifyWithAi(username, messageInput);
          setOutput(generatedText);
          setGenerating(false);
        } catch (error) {
          setGenerating(false);
        }
      }}
    >
      Generate with AI ✨
    </Button>
  );
}

async function handleCopy(text: string, toast: ToastType) {
  try {
    await copyToClipboard(text);
    toast({
      className: cn(
        'fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]'
      ),
      variant: 'default',
      description: `Copied to clipboard`,
      duration: 1000,
    });
  } catch (error) {
    toast({
      className: cn(
        'fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]'
      ),
      variant: 'default',
      description: `Failed to copy to clipboard`,
      duration: 1000,
    });
  }
}

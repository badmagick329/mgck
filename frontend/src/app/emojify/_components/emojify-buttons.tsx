import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_EMOJIS } from '@/lib/consts';
import { cn, copyToClipboard, emojifyText } from '@/lib/utils';

type ToastType = ReturnType<typeof useToast>['toast'];

type EmojifyButtonsProps = {
  messageInput: string;
  emojisInput: string;
  setEmojisInput: (emojisInput: string) => void;
  setOutput: (output: string) => void;
  output: string;
};

export default function EmojifyButtons({
  messageInput,
  emojisInput,
  setEmojisInput,
  setOutput,
  output,
}: EmojifyButtonsProps) {
  const { toast } = useToast();

  return (
    <>
      <Button
        className='bg-primary-em/70 hover:bg-primary-em'
        onClick={() => setOutput(emojifyText(messageInput, emojisInput))}
      >
        Regenerate
      </Button>
      <Button
        className='bg-primary-em/70 hover:bg-primary-em'
        onClick={() => setEmojisInput(DEFAULT_EMOJIS.join(' '))}
      >
        Reset
      </Button>
      <Button
        className='bg-primary-em/70 hover:bg-primary-em'
        onClick={() => handleCopy(output, toast)}
      >
        Copy
      </Button>
    </>
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

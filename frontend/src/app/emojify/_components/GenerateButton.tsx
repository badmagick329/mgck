import { emojifyWithAi } from '@/actions/emojify';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type GenerateButtonProps = {
  setOutput: (output: string) => void;
  messageInput: string;
  username: string;
  showAi: boolean;
  frequent: boolean;
  setFrequent: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function GenerateButton({
  messageInput,
  setOutput,
  username,
  showAi,
  frequent,
  setFrequent,
}: GenerateButtonProps) {
  const [generating, setGenerating] = useState(false);

  if (!showAi) {
    return null;
  }

  return (
    <section className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
      <abbr
        className='order-2 flex w-full flex-col items-center justify-between no-underline sm:order-1'
        title='Control the frequency of emojis inserts by AI'
      >
        <div className='flex h-10 flex-wrap items-center space-x-2 rounded-md'>
          <Label htmlFor='emoji-frequency'>
            {frequent ? 'Max emojis' : 'Low emojis'}
          </Label>
          <Switch
            id='emoji-frequency'
            className='data-[state=checked]:bg-green-400 dark:data-[state=checked]:bg-green-200'
            defaultChecked={frequent}
            onCheckedChange={setFrequent}
          />
        </div>
      </abbr>
      <abbr
        className='order-1 justify-self-end no-underline sm:order-2'
        title='Use AI to generate emojis for your message'
      >
        <Button
          className='w-40 bg-primary-em/70 hover:bg-primary-em'
          disabled={generating}
          onClick={async () => {
            try {
              setGenerating(true);
              const generatedText = await emojifyWithAi(
                username,
                messageInput,
                frequent
              );
              setOutput(generatedText);
              setGenerating(false);
            } catch (error) {
              // TODO: add logging
            } finally {
              setGenerating(false);
            }
          }}
        >
          Generate with AI ✨
        </Button>
      </abbr>
    </section>
  );
}

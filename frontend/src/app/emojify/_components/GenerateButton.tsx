import { emojifyWithAi } from '@/actions/emojify';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';

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
    <div className='flex flex-wrap items-center gap-3'>
      <div className='flex items-center gap-2'>
        <Switch
          id='emoji-frequency'
          className='data-[state=checked]:bg-primary-em'
          checked={frequent}
          onCheckedChange={setFrequent}
        />
        <Label htmlFor='emoji-frequency' className='text-xs'>
          More emojis
        </Label>
      </div>
      <Button
        type='button'
        variant='outline'
        className='border-primary-em/30 bg-transparent hover:bg-primary-em/10'
        disabled={generating || !messageInput.trim()}
        onClick={async () => {
          try {
            setGenerating(true);
            const generatedText = await emojifyWithAi(
              username,
              messageInput,
              frequent
            );
            setOutput(generatedText);
          } finally {
            setGenerating(false);
          }
        }}
      >
        <Sparkles />
        {generating ? 'Matching...' : 'Smart match'}
      </Button>
    </div>
  );
}

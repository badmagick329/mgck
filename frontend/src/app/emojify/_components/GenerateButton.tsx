import { emojifyWithAi } from '@/actions/emojify';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type GenerateButtonProps = {
  setOutput: (output: string) => void;
  messageInput: string;
  username: string;
  showAi: boolean;
};

export default function GenerateButton({
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
    <abbr
      className='no-underline justify-self-end'
      title='Use AI to generate emojis for your message'
    >
      <Button
        className='bg-primary-em/70 hover:bg-primary-em w-40'
        disabled={generating}
        onClick={async () => {
          try {
            setGenerating(true);
            const generatedText = await emojifyWithAi(username, messageInput);
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
  );
}

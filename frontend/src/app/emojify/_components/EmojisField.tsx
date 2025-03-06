'use client';
import { Input } from '@/components/ui/input';
import EmojifyHelpText from './EmojifyHelpText';
import { useEmojifyContext } from '@/app/emojify/_context/store';

type EmojisFieldProps = {
  aiEnabled: boolean;
};

export default function EmojisField({ aiEnabled }: EmojisFieldProps) {
  const { emojisInput, setEmojisInput } = useEmojifyContext();

  return (
    <section className='pb-6'>
      <abbr
        className='no-underline'
        title='These will be inserted between words at random'
      >
        <Input
          className='bg-background-em-dark/10 dark:bg-background-em-dark rounded-md'
          onChange={(e) => setEmojisInput(e.target.value.slice(0, 1000))}
          value={emojisInput}
          placeholder='Enter emojis (or words) separated by spaces'
        />
      </abbr>
      <EmojifyHelpText aiEnabled={aiEnabled} />
    </section>
  );
}

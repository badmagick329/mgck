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
    <section className='flex flex-col gap-2 pb-6'>
      <abbr
        className='no-underline'
        title='These emojis (or words) will be inserted between your input text at random'
      >
        <Input
          className='rounded-md bg-background-em-dark/10 focus:outline-none focus:ring-1 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-0 dark:bg-background-em-dark'
          onChange={(e) => setEmojisInput(e.target.value.slice(0, 1000))}
          value={emojisInput}
          placeholder='Enter emojis (or words) separated by spaces'
        />
      </abbr>
      <EmojifyHelpText aiEnabled={aiEnabled} />
    </section>
  );
}

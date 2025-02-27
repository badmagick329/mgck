import { Input } from '@/components/ui/input';
import EmojifyHelp from './EmojifyHelp';

type EmojisFieldProps = {
  emojisInput: string;
  setEmojisInput: (emojisInput: string) => void;
  aiEnabled: boolean;
};

export default function EmojisField({
  emojisInput,
  setEmojisInput,
  aiEnabled,
}: EmojisFieldProps) {
  return (
    <>
      <Input
        className='bg-background-em-dark/10 dark:bg-background-em-dark rounded-md'
        onChange={(e) => setEmojisInput(e.target.value.slice(0, 1000))}
        value={emojisInput}
        placeholder='Enter emojis (or words) separated by spaces'
      />
      <EmojifyHelp aiEnabled={aiEnabled} />
    </>
  );
}

import { Input } from '@/components/ui/input';

type EmojisFieldProps = {
  emojisInput: string;
  setEmojisInput: (emojisInput: string) => void;
};

export default function EmojisField({
  emojisInput,
  setEmojisInput,
}: EmojisFieldProps) {
  return (
    <>
      <Input
        className='bg-background-em-dark/10 dark:bg-background-em-dark rounded-md'
        onChange={(e) => setEmojisInput(e.target.value.slice(0, 1000))}
        value={emojisInput}
        placeholder='Enter emojis (or words) separated by spaces'
      />
      <span>
        Emojis will be picked from the above list at random. You can edit it and
        it will be saved in your browser. Use reset to bring back default list.
      </span>
    </>
  );
}

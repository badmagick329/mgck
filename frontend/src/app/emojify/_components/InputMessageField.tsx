'use client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEmojifyContext } from '@/app/emojify/_context/store';

export default function InputMessageField() {
  const { messageInput, setMessageInput } = useEmojifyContext();

  return (
    <section className='space-y-2'>
      <div className='flex items-center justify-between gap-4'>
        <Label htmlFor='emojify-message' className='text-base font-semibold'>
          Message
        </Label>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => setMessageInput('')}
          disabled={!messageInput}
        >
          Clear
        </Button>
      </div>
      <Textarea
        id='emojify-message'
        className='min-h-36 resize-y rounded-md border-primary-em/25 bg-background-em-dark/10 p-3 text-base focus-visible:ring-primary-em dark:bg-background-em-dark'
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder='Type or paste a message'
        value={messageInput}
        rows={6}
      />
    </section>
  );
}

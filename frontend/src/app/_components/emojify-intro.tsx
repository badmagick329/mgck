import { Button } from '@/components/ui/button';
import { EMOJIFY_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function EmojifyIntro() {
  return (
    <div className='flex w-full flex-col items-center gap-8'>
      <span className='text-lg'>
        Improve your messages by 300% by adding emojis between each word.
      </span>

      <Link href={EMOJIFY_BASE}>
        <Button className='w-72 font-semibold md:w-96 md:text-lg'>
          Emojifier 😎
        </Button>
      </Link>
    </div>
  );
}

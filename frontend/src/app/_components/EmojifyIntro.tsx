import { Button } from '@/components/ui/button';
import { EMOJIFY_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function EmojifyIntro() {
  return (
    <div className='bg-background-em border-primary-em grid place-content-center place-items-center gap-8 border-t-2 px-8 py-4 sm:px-12 sm:py-6'>
      <span className='text-lg'>
        Improve your messages by 300% by adding emojis between each word.
      </span>

      <Link href={EMOJIFY_BASE}>
        <Button className='bg-primary-em/70 hover:bg-primary-em shadow-glow-primary-em w-72 font-semibold text-primary-foreground md:w-96 md:text-lg'>
          Emojifier 😎
        </Button>
      </Link>
    </div>
  );
}

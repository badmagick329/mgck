import { Button } from '@/components/ui/button';
import { EMOJIFY_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function EmojifyIntro() {
  return (
    <div className='grid place-content-center place-items-center gap-8 border-t-2 border-primary-em bg-background-em px-8 py-4 sm:px-12 sm:py-6'>
      <span className='text-lg'>
        Pick an emoji set, choose how chaotic it gets, and shuffle your message.
      </span>

      <Link href={EMOJIFY_BASE}>
        <Button className='w-72 bg-primary-em/70 font-semibold text-primary-foreground shadow-glow-primary-em hover:bg-primary-em md:w-96 md:text-lg'>
          Emojifier 😎
        </Button>
      </Link>
    </div>
  );
}

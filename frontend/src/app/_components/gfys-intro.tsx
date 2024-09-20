import { Button } from '@/components/ui/button';
import { GFYS_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function GfysIntro() {
  return (
    <div className='bg-background-gf border-primary-gf grid place-content-center place-items-center gap-8 border-t-2 px-8 py-4 sm:px-12 sm:py-6'>
      <span className='text-lg'>
        Browse Red Velvet Gfys now moved to Imgur.
      </span>
      <Link href={GFYS_BASE}>
        <Button className='bg-primary-gf/70 hover:bg-primary-gf shadow-glow-primary-gf w-72 font-semibold text-primary-foreground md:w-96 md:text-lg'>
          Red Velvet Gfys
        </Button>
      </Link>
    </div>
  );
}

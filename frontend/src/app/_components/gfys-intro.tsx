import { Button } from '@/components/ui/button';
import { GFYS_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function GfysIntro() {
  return (
    <div className='flex w-full flex-col items-center gap-8'>
      <span className='text-lg'>
        Browse Red Velvet Gfys now moved to Imgur.
      </span>
      <Link href={GFYS_BASE}>
        <Button className='w-72 font-semibold md:w-96 md:text-lg'>
          Red Velvet Gfys
        </Button>
      </Link>
    </div>
  );
}

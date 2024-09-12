import { Button } from '@/components/ui/button';
import { KPOP_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function KpopComebacksIntro() {
  return (
    <div className='flex w-full flex-col items-center gap-8'>
      <span className='text-lg'>
        Check out the latest Kpop comebacks or search for any comebacks you may
        have missed.
      </span>
      <Link href={KPOP_BASE}>
        <Button className='w-72 font-semibold md:w-96 md:text-lg'>
          Kpop Comebacks
        </Button>
      </Link>
    </div>
  );
}

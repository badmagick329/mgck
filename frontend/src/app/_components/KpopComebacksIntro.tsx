import { Button } from '@/components/ui/button';
import { KPOP_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function KpopComebacksIntro() {
  return (
    <div className='bg-background-kp border-primary-kp grid place-content-center place-items-center gap-8 border-t-2 px-8 py-4 sm:px-12 sm:py-6'>
      <span className='text-lg'>
        Check out the latest Kpop comebacks or search for any comebacks you may
        have missed.
      </span>
      <Link href={KPOP_BASE}>
        <Button className='bg-primary-kp/70 hover:bg-primary-kp shadow-glow-primary-kp w-72 font-semibold text-primary-foreground md:w-96 md:text-lg'>
          Kpop Comebacks
        </Button>
      </Link>
    </div>
  );
}

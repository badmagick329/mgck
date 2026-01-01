import { Button } from '@/components/ui/button';
import { MILESTONES_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function MilestonesIntro() {
  return (
    <div className='grid place-content-center place-items-center gap-8 border-t-2 border-primary-ml bg-background-ml px-8 py-4 sm:px-12 sm:py-6'>
      <span className='text-lg'>Milestone in minutes, days, seconds.</span>
      <Link href={MILESTONES_BASE}>
        <Button className='shadow-glow-primary-ml bg-primary-ml/70 w-72 font-semibold text-primary-foreground hover:bg-primary-ml md:w-96 md:text-lg'>
          Milestones
        </Button>
      </Link>
    </div>
  );
}

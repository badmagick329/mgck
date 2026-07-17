import SignPostSvg from '@/app/milestones/_components/SignPostSvg';
import { motion } from 'motion/react';
import { Outfit } from 'next/font/google';
import { MilestoneSyncStatus } from '@/lib/types/milestones';

const font = Outfit({
  subsets: ['latin'],
  weight: ['700'],
});

export default function MilestonesHeading({
  syncStatus,
}: {
  syncStatus: MilestoneSyncStatus;
}) {
  return (
    <section className={`flex flex-col items-center ${font.className}`}>
      <div className='flex justify-center gap-2'>
        <SignPostSvg />
        <motion.h1
          initial={{ x: 100, opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 15,
          }}
          className='mt-auto pt-1 text-center text-4xl font-bold'
        >
          Milestones
        </motion.h1>
      </div>
      {syncStatus === 'not-synced' && (
        <p
          className='pt-2 text-center text-xs font-normal text-muted-foreground'
          aria-live='polite'
        >
          Not synced — changes are saved on this device and will retry
          automatically.
        </p>
      )}
    </section>
  );
}

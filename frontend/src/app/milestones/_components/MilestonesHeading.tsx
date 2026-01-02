import SignPostSvg from '@/app/milestones/_components/SignPostSvg';
import { motion } from 'motion/react';
import { Outfit } from 'next/font/google';

const font = Outfit({
  subsets: ['latin'],
  weight: ['700'],
});

export default function MilestonesHeading() {
  return (
    <section className={`flex justify-center gap-2 ${font.className}`}>
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
    </section>
  );
}

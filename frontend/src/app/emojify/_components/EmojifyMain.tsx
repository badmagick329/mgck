import EmojisField from '@/app/emojify/_components/EmojisField';
import InputMessageField from '@/app/emojify/_components/InputMessageField';
import OutputField from '@/app/emojify/_components/OutputField';
import { motion } from 'motion/react';
import { useEmojifyContext } from '../_context/store';
import Link from 'next/link';

export default function EmojifyMain({
  username,
  showAi,
}: {
  username: string;
  showAi: boolean;
}) {
  const { isLoaded } = useEmojifyContext();

  return (
    <article className='flex w-full max-w-3xl grow flex-col px-4 py-10 sm:px-6'>
      <motion.div
        key='content'
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 40 }}
        transition={{
          delay: 0.3,
          opacity: { duration: 0.5, ease: 'easeOut' },
          y: { type: 'spring', stiffness: 500, damping: 15 },
        }}
      >
        <header className='mb-8 space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            Emojifier
          </h1>
          <p className='max-w-2xl text-base text-muted-foreground sm:text-lg'>
            Add random emojis to any message. Pick a set, choose how chaotic it
            should get, and shuffle until it feels right.
          </p>
        </header>
        <div className='space-y-5'>
          <InputMessageField />
          <EmojisField />
          <OutputField username={username} showAi={showAi} />
        </div>
        {!showAi && (
          <p className='mt-4 text-sm text-muted-foreground'>
            Want the emojis matched to the message?{' '}
            <Link
              className='text-foreground underline underline-offset-4 hover:text-primary-em'
              href='/account/login?returnTo=%2Femojify'
            >
              Sign in to use Smart match
            </Link>
            .
          </p>
        )}
      </motion.div>
    </article>
  );
}

import EmojisField from '@/app/emojify/_components/EmojisField';
import InputMessageField from '@/app/emojify/_components/InputMessageField';
import OutputField from '@/app/emojify/_components/OutputField';
import EmojifyHeader from '@/app/emojify/_components/EmojifyHeader';
import { motion } from 'motion/react';
import { useEmojifyContext } from '../_context/store';
import Link from 'next/link';

export default function EmojifyMain({
  username,
  showAi,
  headerTypingSequence,
}: {
  username: string;
  showAi: boolean;
  headerTypingSequence: (string | number)[];
}) {
  const { isLoaded } = useEmojifyContext();

  return (
    <article className='flex w-full min-w-[360px] max-w-[800px] grow flex-col px-2 pt-6'>
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
        <EmojifyHeader headerTypingSequence={headerTypingSequence} />
        <InputMessageField />
        <EmojisField aiEnabled={showAi} />
        <OutputField username={username} showAi={showAi} />
        {!showAi && (
          <p className='mt-3 text-right text-sm text-muted-foreground'>
            AI emoji suggestions are available when signed in.{' '}
            <Link
              className='text-foreground underline underline-offset-4 hover:text-primary-em'
              href='/account/login?returnTo=%2Femojify'
            >
              Sign in
            </Link>
          </p>
        )}
      </motion.div>
    </article>
  );
}

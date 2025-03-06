import EmojisField from '@/app/emojify/_components/EmojisField';
import MessageField from '@/app/emojify/_components/MessageField';
import OutputField from '@/app/emojify/_components/OutputField';
import EmojifyHeader from '@/app/emojify/_components/EmojifyHeader';
import { motion } from 'motion/react';
import { useEmojifyContext } from '../_context/store';

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
    <article className='flex w-full min-w-[360px] max-w-[800px] flex-col grow px-2 pt-6'>
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
        <MessageField />
        <EmojisField aiEnabled={showAi} />
        <OutputField username={username} showAi={showAi} />
      </motion.div>
    </article>
  );
}

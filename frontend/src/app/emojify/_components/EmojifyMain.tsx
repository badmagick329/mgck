import EmojisField from '@/app/emojify/_components/EmojisField';
import MessageField from '@/app/emojify/_components/MessageField';
import OutputField from '@/app/emojify/_components/OutputField';
import EmojifyHeader from '@/app/emojify/_components/EmojifyHeader';
import { AnimatePresence, motion } from 'motion/react';
import { useEmojifyContext } from '../_context/store';

export default function EmojifyMain({
  username,
  showAi,
  loaderEmoji,
}: {
  username: string;
  showAi: boolean;
  loaderEmoji: string;
}) {
  const { isLoaded } = useEmojifyContext();

  return (
    <article className='flex w-full min-w-[360px] max-w-[800px] flex-col grow px-2 pt-6'>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key='loader'
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='fixed inset-0 z-50 flex items-center justify-center'
          >
            <span className='text-4xl'>{loaderEmoji}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        key='content'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 10 }}
        transition={{ duration: 0.2 }}
      >
        <EmojifyHeader username={username} />
        <MessageField />
        <EmojisField aiEnabled={showAi} />
        <OutputField username={username} showAi={showAi} />
      </motion.div>
    </article>
  );
}

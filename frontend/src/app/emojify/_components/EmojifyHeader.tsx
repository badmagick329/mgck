import { Button } from '@/components/ui/button';
import EmojifyHelpButton from './EmojifyHelpButton';
import { useEffect, useState } from 'react';
import { topRightDefaultToast } from '@/lib/utils';
import { defaultEmojis, emojifyText } from '@/lib/emojify';
import { useEmojifyContext } from '@/app/emojify/_context/store';
import { useToast } from '@/components/ui/use-toast';

export default function EmojifyHeader({ username }: { username: string }) {
  const plainHeaderMessage = (username: string) =>
    username ? `Hello ${username} !` : 'Emojify Your Message';
  const [headerMessage, setHeaderMessage] = useState(
    plainHeaderMessage(username)
  );
  const { emojisInput, setEmojisInput } = useEmojifyContext();
  const { toast } = useToast();

  useEffect(() => {
    const plainMessage = plainHeaderMessage(username);
    setHeaderMessage(emojifyText(plainMessage, defaultEmojis()));

    const cancelTimer = setInterval(() => {
      setHeaderMessage(emojifyText(plainMessage, defaultEmojis()));
    }, 1500);
    return () => clearInterval(cancelTimer);
  }, []);

  return (
    <section>
      <span className='flex justify-center text-2xl'>{headerMessage}</span>
      <div className='flex justify-between p-0'>
        <Button
          variant={'plain'}
          className='py-0 px-2 h-6'
          disabled={emojisInput === defaultEmojis()}
          onClick={() => {
            setEmojisInput(defaultEmojis());
            topRightDefaultToast('Emojis reset', toast);
          }}
        >
          Reset emojis
        </Button>
        <EmojifyHelpButton />
      </div>
    </section>
  );
}

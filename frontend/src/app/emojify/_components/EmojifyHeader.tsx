import { Button } from '@/components/ui/button';
import EmojifyHelpButton from './EmojifyHelpButton';
import { topRightDefaultToast } from '@/lib/utils';
import { defaultEmojis } from '@/lib/emojify';
import { useEmojifyContext } from '@/app/emojify/_context/store';
import { useToast } from '@/components/ui/use-toast';
import { TypeAnimation } from 'react-type-animation';

export default function EmojifyHeader({
  headerTypingSequence,
}: {
  headerTypingSequence: (string | number)[];
}) {
  const { emojisInput, setEmojisInput } = useEmojifyContext();
  const { toast } = useToast();

  return (
    <section>
      <abbr className='flex justify-center no-underline' title='Hi 👋'>
        <TypeAnimation
          className='mx-auto inline-block p-2 text-xl'
          sequence={[...headerTypingSequence]}
          wrapper='span'
          cursor={true}
        />
      </abbr>
      <div className='flex justify-between p-0'>
        <abbr
          className='justify-self-start no-underline'
          title='Reset emojis to the default list'
        >
          <Button
            variant={'ghost'}
            className='h-6 px-2 py-0'
            disabled={emojisInput === defaultEmojis()}
            onClick={() => {
              setEmojisInput(defaultEmojis());
              topRightDefaultToast('Emojis reset', toast);
            }}
          >
            Reset emojis
          </Button>
        </abbr>
        <EmojifyHelpButton />
      </div>
    </section>
  );
}

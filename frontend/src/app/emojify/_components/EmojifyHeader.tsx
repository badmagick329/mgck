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
      <abbr className='no-underline flex justify-center' title='Hi 👋'>
        <TypeAnimation
          className='inline-block mx-auto text-xl p-2'
          sequence={[...headerTypingSequence]}
          wrapper='span'
          cursor={true}
        />
      </abbr>
      <div className='flex justify-between p-0'>
        <abbr
          className='no-underline justify-self-start'
          title='Reset emojis to the default list'
        >
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
        </abbr>
        <EmojifyHelpButton />
      </div>
    </section>
  );
}

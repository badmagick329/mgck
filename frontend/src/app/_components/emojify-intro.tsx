import { Button } from '@/components/ui/button';
import { DEFAULT_EMOJIS } from '@/lib/consts';
import { EMOJIFY_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

import ConveyorBeltContent from './conveyor-belt-content';

export default function EmojifyIntro() {
  return (
    <div className='flex w-full flex-col items-center gap-8'>
      <span className='text-lg'>
        Improve your messages by 300% by adding emojis between each word.
      </span>

      <Link href={EMOJIFY_BASE}>
        <Button className='w-72 font-semibold md:w-96 md:text-lg'>
          <ConveyorBeltContent
            emojis={[
              DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)],
              ...DEFAULT_EMOJIS,
            ]}
            maxWidthInRem={12}
            maxHeightInRem={1.4}
            startingX={-10}
            startingY={-1.4}
          />
          <ConveyorBeltContent
            emojis={[
              DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)],
              ...DEFAULT_EMOJIS,
            ]}
            maxWidthInRem={12}
            maxHeightInRem={1.4}
            startingX={10}
            startingY={1.4}
          />
          Emojify your message 😀
        </Button>
      </Link>
    </div>
  );
}

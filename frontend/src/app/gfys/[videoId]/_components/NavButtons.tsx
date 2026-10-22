import { fetchRandomGfy } from '@/actions/gfys';
import { useGfyContext } from '@/app/gfys/_context/store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isShortcutBlocked } from '@/lib/gfys/keyboard';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Dices } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { IoIosUndo } from 'react-icons/io';
import { TfiLoop } from 'react-icons/tfi';

import NavButton from './NavButton';

export default function NavButtons() {
  const backRef = useRef<HTMLButtonElement>(null);
  const loopAllRef = useRef<HTMLButtonElement>(null);
  const randomRef = useRef<HTMLButtonElement>(null);
  const { gfyViewData, loopAll, setLoopAll } = useGfyContext();
  const router = useRouter();
  const [isFindingRandom, setIsFindingRandom] = useState(false);

  async function showRandomGfy() {
    if (isFindingRandom) return;
    setIsFindingRandom(true);
    const id = await fetchRandomGfy('');
    if (id) router.replace(`/gfys/${id}`);
    setIsFindingRandom(false);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutBlocked(e)) {
        return;
      }
      if (e.key.toLowerCase() === 'r') {
        randomRef.current?.click();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        backRef.current?.click();
      } else if (e.key === 'p') {
        loopAllRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <NavButton direction='previous' />
      <NavButton direction='next' />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label='Show a random Gfy'
              className='h-9 border-primary-gf/30 bg-transparent px-3 shadow-none hover:bg-primary-gf/10'
              disabled={isFindingRandom}
              onClick={showRandomGfy}
              ref={randomRef}
              variant='outline'
            >
              <Dices aria-hidden='true' />
              <span>Random</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Random Gfy [r]</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {gfyViewData.videoIds.length > 1 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  loopAll ? 'bg-primary-gf/20' : 'bg-transparent',
                  'border-primary-gf/30 shadow-none hover:bg-primary-gf/10'
                )}
                variant='outline'
                aria-label='Loop all clips'
                aria-pressed={loopAll}
                ref={loopAllRef}
                size={'icon'}
                onClick={() => setLoopAll(!loopAll)}
              >
                <TfiLoop />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Loo[p] all</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {gfyViewData?.listUrl && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  'border-primary-gf/30 bg-transparent shadow-none hover:bg-primary-gf/10'
                )}
                variant='outline'
                aria-label='Back to results'
                size={'icon'}
                ref={backRef}
                onClick={() => router.replace(gfyViewData.listUrl)}
              >
                <IoIosUndo />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Back [Down Arrow] [j]</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

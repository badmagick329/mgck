import { fetchRandomGfy } from '@/actions/gfys';
import { useGfyContext } from '@/app/gfys/_context/store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
      const target = e.target as HTMLElement | null;
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target?.matches('input, textarea, select, button, a, [contenteditable="true"]')
      ) {
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
    <div className='flex justify-center gap-2'>
      <NavButton direction='previous' />
      <NavButton direction='next' />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label='Show a random Gfy'
              className='text-bold bg-primary-gf/90 text-primary-gf-foreground hover:bg-primary-gf'
              disabled={isFindingRandom}
              onClick={showRandomGfy}
              ref={randomRef}
              size='icon'
              variant='secondary'
            >
              <Dices aria-hidden='true' />
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
                  loopAll ? 'shadow-glow-primary-gf' : '',
                  'text-bold bg-primary-gf/90 hover:bg-primary-gf text-primary-gf-foreground'
                )}
                variant={loopAll ? 'default' : 'secondary'}
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
                  'text-bold bg-primary-gf/90 hover:bg-primary-gf text-primary-gf-foreground'
                )}
                variant='secondary'
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

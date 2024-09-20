import { useGlobalContext } from '@/app/gfys/context/store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { IoIosUndo } from 'react-icons/io';
import { TfiLoop } from 'react-icons/tfi';

import NavButton from './nav-button';

export default function NavButtons() {
  const backRef = useRef<HTMLButtonElement>(null);
  const loopAllRef = useRef<HTMLButtonElement>(null);
  const { gfyViewData, loopAll, setLoopAll } = useGlobalContext();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
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

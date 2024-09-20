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
import { useEffect, useRef, useState } from 'react';
import { ImArrowLeft, ImArrowRight } from 'react-icons/im';

export default function NavButton({
  direction,
}: {
  direction: 'previous' | 'next';
}) {
  const Icon = direction === 'previous' ? ImArrowLeft : ImArrowRight;
  const { nextGfyExists, previousGfyExists, goToNextGfy, goToPreviousGfy } =
    useGlobalContext();
  const leftRef = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);
  const [disabledButton, setDisabledButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (direction === 'next' && !nextGfyExists()) {
      setDisabledButton(true);
    }
    if (direction === 'previous' && !previousGfyExists()) {
      setDisabledButton(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'l') {
        rightRef.current?.click();
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        leftRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!(nextGfyExists() || previousGfyExists())) {
    return null;
  }

  let tooltipText = '';
  if (direction === 'next') {
    tooltipText = 'Next [Right Arrow] [l]';
  } else {
    tooltipText = 'Previous [Left Arrow] [h]';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            disabled={disabledButton}
            className={cn(
              'text-bold bg-primary-gf/90 hover:bg-primary-gf text-primary-gf-foreground'
            )}
            variant='secondary'
            size={'icon'}
            ref={direction === 'previous' ? leftRef : rightRef}
            onClick={(e) => {
              (async () => {
                try {
                  setDisabledButton(true);
                  let newGfyURL;
                  if (direction === 'next') {
                    newGfyURL = await goToNextGfy();
                  } else {
                    newGfyURL = await goToPreviousGfy();
                  }
                  if (newGfyURL) {
                    router.replace(newGfyURL);
                  }
                } finally {
                  setDisabledButton(false);
                }
              })();
            }}
          >
            <Icon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>{tooltipText}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import useNavButton from '@/hooks/gfys/useNavButton';
import { cn } from '@/lib/utils';

export default function NavButton({
  direction,
}: {
  direction: 'previous' | 'next';
}) {
  const {
    isDisabled,
    shouldRender,
    buttonRef,
    Icon,
    handleClick,
    tooltipText,
  } = useNavButton(direction);

  if (!shouldRender) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            disabled={isDisabled}
            className={cn(
              'border-primary-gf/30 bg-transparent shadow-none hover:bg-primary-gf/10'
            )}
            variant='outline'
            aria-label={direction === 'next' ? 'Next clip' : 'Previous clip'}
            size={'icon'}
            ref={buttonRef}
            onClick={handleClick}
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

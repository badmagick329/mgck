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
              'text-bold bg-primary-gf/90 text-primary-gf-foreground hover:bg-primary-gf'
            )}
            variant='secondary'
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

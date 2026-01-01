import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const appVariants = {
  milestonesPrimary:
    'bg-primary-ml hover:bg-primary-ml hover:font-bold hover:scale-105',
  milestonesSecondary:
    'bg-primary-ml/70 hover:bg-primary-ml hover:text-primary-ml-foreground hover:text-primary-foreground-ml text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2',
} as const;

interface AppButtonProps extends ButtonProps {
  appVariant?: keyof typeof appVariants;
}

export function MilestonesButton({
  appVariant,
  className,
  ...props
}: AppButtonProps) {
  return (
    <Button
      className={cn(appVariant && appVariants[appVariant], className)}
      {...props}
    />
  );
}

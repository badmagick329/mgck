import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const appVariants = {
  milestonesPrimary:
    'bg-primary-ml hover:bg-primary-ml hover:font-bold hover:scale-105',
  milestonesSecondary:
    'bg-secondary-ml hover:bg-secondary-ml-hover hover:text-secondary-ml-foreground hover:text-sceondary-foreground-ml',
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

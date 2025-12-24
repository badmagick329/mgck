import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const appVariants = {
  milestonesPrimary: 'bg-primary-ml hover:opacity-90',
  milestonesSecondary: 'bg-secondary-ml hover:bg-emerald-700',
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

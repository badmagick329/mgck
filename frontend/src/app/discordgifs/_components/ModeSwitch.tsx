import clsx from 'clsx';

export type ConverterMode = 'simple' | 'advanced';

const modes: ReadonlyArray<{ mode: ConverterMode; label: string }> = [
  { mode: 'simple', label: 'Simple' },
  { mode: 'advanced', label: 'Advanced' },
];

export default function ModeSwitch({
  mode,
  disabled,
  onChange,
}: {
  mode: ConverterMode;
  disabled: boolean;
  onChange: (mode: ConverterMode) => void;
}) {
  return (
    <div
      role='group'
      aria-label='Converter mode'
      className='flex rounded-md border border-foreground-dg/25 bg-secondary-dg p-1'
    >
      {modes.map(({ mode: option, label }) => (
        <button
          key={option}
          type='button'
          aria-pressed={mode === option}
          disabled={disabled}
          onClick={() => onChange(option)}
          className={clsx(
            'h-8 rounded px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            mode === option
              ? 'bg-primary-dg font-semibold'
              : 'text-foreground-dg/80 hover:bg-foreground-dg/10'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

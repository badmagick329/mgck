import {
  ConversionPresetId,
  conversionPresetOrder,
  orderConversionPresetIds,
} from '@/lib/discordgifs/conversion-target';
import clsx from 'clsx';

const presetContent: Record<
  ConversionPresetId,
  { title: string; specification: string }
> = {
  emote: {
    title: '😄 Emoji',
    specification: 'Animated GIF · under 256 KiB',
  },
  sticker: {
    title: '🏷️ Sticker',
    specification: 'Animated PNG · under 512 KiB',
  },
  avatar: {
    title: '👤 Avatar',
    specification: 'Animated GIF · under 8 MiB',
  },
};

export default function PresetSelector({
  selectedPresetIds,
  onChange,
  disabled = false,
}: {
  selectedPresetIds: readonly ConversionPresetId[];
  onChange: (presetIds: ConversionPresetId[]) => void;
  disabled?: boolean;
}) {
  const togglePreset = (presetId: ConversionPresetId) => {
    const nextPresetIds = selectedPresetIds.includes(presetId)
      ? selectedPresetIds.filter((selectedId) => selectedId !== presetId)
      : [...selectedPresetIds, presetId];
    onChange(orderConversionPresetIds(nextPresetIds));
  };

  return (
    <section
      aria-labelledby='discord-output-heading'
      className='flex w-full max-w-4xl flex-col items-center gap-2'
    >
      <h2
        id='discord-output-heading'
        className='text-center text-lg font-semibold'
      >
        What are we making?
      </h2>
      <div
        role='group'
        aria-label='Discord output presets'
        className='grid w-full auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-3'
      >
        {conversionPresetOrder.map((presetId) => {
          const content = presetContent[presetId];
          const selected = selectedPresetIds.includes(presetId);
          return (
            <button
              key={presetId}
              type='button'
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => togglePreset(presetId)}
              className={clsx(
                'flex h-full min-w-0 flex-col items-start gap-1 rounded-md border-2 bg-secondary-dg p-3 text-left',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-dg',
                'disabled:cursor-not-allowed disabled:opacity-60',
                selected
                  ? 'border-primary-dg shadow-glow-primary-dg'
                  : 'border-foreground-dg/25 hover:border-primary-dg/70'
              )}
            >
              <span className='flex w-full items-center justify-between gap-2 font-semibold'>
                <span>{content.title}</span>
                {selected && (
                  <span className='shrink-0 text-sm'>
                    <span aria-hidden='true'>✓</span>
                    <span className='sr-only'>Selected</span>
                  </span>
                )}
              </span>
              <span className='text-sm text-foreground-dg/80'>
                {content.specification}
              </span>
            </button>
          );
        })}
      </div>
      {selectedPresetIds.length === 0 && (
        <p className='text-sm font-semibold text-red-600' role='status'>
          Select at least one output to convert.
        </p>
      )}
    </section>
  );
}

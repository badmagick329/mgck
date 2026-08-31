'use client';

import { useEmojifyContext } from '@/app/emojify/_context/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  EMOJI_INTENSITIES,
  EMOJI_PACKS,
  EmojiIntensity,
  EmojiPackId,
} from '@/lib/consts/emojify';
import { cn } from '@/lib/utils';

const packIds = Object.keys(EMOJI_PACKS) as (keyof typeof EMOJI_PACKS)[];
const intensityIds = Object.keys(EMOJI_INTENSITIES) as EmojiIntensity[];

export default function EmojisField() {
  const {
    emojisInput,
    setEmojisInput,
    selectedPack,
    setSelectedPack,
    intensity,
    setIntensity,
  } = useEmojifyContext();

  return (
    <section className='space-y-5 rounded-lg border border-primary-em/20 bg-background-em-dark/5 p-4 dark:bg-background-em-dark/40 sm:p-5'>
      <fieldset className='space-y-3'>
        <legend className='text-base font-semibold'>Emoji set</legend>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {packIds.map((packId) => {
            const pack = EMOJI_PACKS[packId];
            return (
              <PackButton
                key={packId}
                packId={packId}
                label={pack.label}
                preview={pack.emojis.slice(0, 4).join(' ')}
                selected={selectedPack === packId}
                onSelect={setSelectedPack}
              />
            );
          })}
          <PackButton
            packId='custom'
            label='Custom'
            preview='✏️ 🙂 💫'
            selected={selectedPack === 'custom'}
            onSelect={setSelectedPack}
          />
        </div>
        {selectedPack === 'custom' ? (
          <div className='space-y-2 pt-1'>
            <Label htmlFor='custom-emojis'>Custom emojis or words</Label>
            <Input
              id='custom-emojis'
              className='border-primary-em/25 bg-background focus-visible:ring-primary-em'
              onChange={(event) =>
                setEmojisInput(event.target.value.slice(0, 1000))
              }
              value={emojisInput}
              placeholder='Separate each option with a space'
            />
            <p className='text-xs text-muted-foreground'>
              Saved in this browser.
            </p>
          </div>
        ) : (
          <p className='break-words text-sm text-muted-foreground'>
            {EMOJI_PACKS[selectedPack].description}{' '}
            <span aria-label='Selected emojis'>{emojisInput}</span>
          </p>
        )}
      </fieldset>

      <fieldset className='space-y-3'>
        <legend className='text-base font-semibold'>How chaotic?</legend>
        <div className='grid grid-cols-3 gap-2'>
          {intensityIds.map((intensityId) => {
            const option = EMOJI_INTENSITIES[intensityId];
            const selected = intensity === intensityId;
            return (
              <button
                key={intensityId}
                type='button'
                className={cn(
                  'rounded-md border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-em',
                  selected
                    ? 'border-primary-em bg-primary-em/20 text-foreground'
                    : 'border-primary-em/20 bg-background/40 hover:bg-primary-em/10'
                )}
                aria-pressed={selected}
                onClick={() => setIntensity(intensityId)}
              >
                <span className='block font-semibold'>{option.label}</span>
                <span className='mt-1 hidden text-xs text-muted-foreground sm:block'>
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}

function PackButton({
  packId,
  label,
  preview,
  selected,
  onSelect,
}: {
  packId: EmojiPackId;
  label: string;
  preview: string;
  selected: boolean;
  onSelect: (pack: EmojiPackId) => void;
}) {
  return (
    <button
      type='button'
      className={cn(
        'min-w-0 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-em',
        selected
          ? 'border-primary-em bg-primary-em/20'
          : 'border-primary-em/20 bg-background/40 hover:bg-primary-em/10'
      )}
      aria-pressed={selected}
      onClick={() => onSelect(packId)}
    >
      <span className='block text-sm font-semibold'>{label}</span>
      <span className='mt-1 block truncate text-sm' aria-hidden='true'>
        {preview}
      </span>
    </button>
  );
}

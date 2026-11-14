'use client';

import { ReactNode } from 'react';
import { ClipCrop } from '@/lib/types/discordgifs';
import {
  ConversionPresetId,
  conversionPresetLabels,
  conversionTargetPresets,
} from '@/lib/discordgifs/conversion-target';
import { approximateWidthLabel } from '@/lib/discordgifs/output-preview';
import { discordDisplayPx } from '@/lib/consts/discordgifs';
import OutputPreview from './OutputPreview';

/**
 * The two small views share a row even on a 390 px phone, while the 160 px
 * sticker needs one of its own there; card order would split them into three.
 */
const displayOrder: readonly ConversionPresetId[] = [
  'emote',
  'avatar',
  'sticker',
];

/**
 * Simple mode's view of each selected preset before converting, at the sizes
 * `DiscordPreview` later shows the real file. Widths are approximate because
 * the scale search settles the final width only while converting.
 */
export default function PresetPreview({
  video,
  crop,
  presetIds,
}: {
  video: HTMLVideoElement | null;
  crop?: ClipCrop;
  presetIds: readonly ConversionPresetId[];
}) {
  if (presetIds.length === 0) return null;
  const drawing = (
    presetId: ConversionPresetId,
    box: number,
    label: string,
    round = false
  ) => (
    <OutputPreview
      video={video}
      crop={crop}
      box={box}
      fit={round ? 'cover' : 'contain'}
      outputWidth={conversionTargetPresets[presetId].startingWidth}
      label={label}
      className={round ? 'rounded-full' : undefined}
    />
  );
  const views: Record<ConversionPresetId, ReactNode> = {
    sticker: drawing('sticker', discordDisplayPx.sticker, 'Sticker preview'),
    emote: (
      <>
        <span className='flex items-center gap-1 text-sm'>
          gg{' '}
          {drawing(
            'emote',
            discordDisplayPx.inlineEmoji,
            'Emoji preview, inline'
          )}
        </span>
        {drawing('emote', discordDisplayPx.jumboEmoji, 'Emoji preview, jumbo')}
      </>
    ),
    avatar: (
      <>
        {drawing(
          'avatar',
          discordDisplayPx.chatAvatar,
          'Avatar preview, chat',
          true
        )}
        {drawing(
          'avatar',
          discordDisplayPx.profileAvatar,
          'Avatar preview, profile',
          true
        )}
      </>
    ),
  };

  return (
    <figure
      aria-label='Preview before converting'
      className='flex w-full flex-col gap-2 rounded-md bg-[#313338] p-3 text-left text-[#dbdee1]'
    >
      <figcaption className='text-xs text-[#949ba4]'>
        Preview at Discord size
      </figcaption>
      <div className='flex flex-wrap items-end gap-x-6 gap-y-3'>
        {displayOrder
          .filter((presetId) => presetIds.includes(presetId))
          .map((presetId) => (
            <div key={presetId} className='flex flex-col gap-1.5'>
              <div className='flex items-end gap-3'>{views[presetId]}</div>
              <p className='text-xs text-[#949ba4]'>
                <span className='font-semibold text-[#dbdee1]'>
                  {conversionPresetLabels[presetId]}
                </span>{' '}
                {approximateWidthLabel(presetId)}
              </p>
            </div>
          ))}
      </div>
    </figure>
  );
}

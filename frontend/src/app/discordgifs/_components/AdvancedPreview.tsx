'use client';

import { ClipCrop } from '@/lib/types/discordgifs';
import { Size } from '@/lib/discordgifs/output-preview';
import { AdvancedSettings, formatSpeed } from '@/lib/discordgifs/advanced';
import OutputPreview from './OutputPreview';

/** Fits the 390 px phone's settings column, the narrowest it gets. */
const previewBox = 300;

const pill =
  'rounded-full border border-foreground-dg/20 px-2 py-0.5 text-xs tabular-nums';

/**
 * Gif Studio's *Output preview*: the selection as it will encode, with the
 * file's exact size, length and frame count. It draws rotation and flips,
 * and moves at the chosen speed because the editor's video plays at it.
 * Reverse and Boomerang are labelled rather than played, as in Gif Studio:
 * playing them would need every frame decoded and held, which is the cost
 * the frame-memory limit (`frameMemoryLimitSeconds`) exists to bound.
 */
export default function AdvancedPreview({
  video,
  crop,
  settings,
  size,
  seconds,
  frames,
  largeGif,
}: {
  video: HTMLVideoElement | null;
  crop?: ClipCrop;
  settings: Pick<
    AdvancedSettings,
    'rotation' | 'flipHorizontal' | 'flipVertical' | 'speed' | 'direction'
  >;
  size: Size | null;
  seconds: number | null;
  frames: number | null;
  largeGif: boolean;
}) {
  return (
    <figure
      aria-label='Output preview'
      className='flex flex-col gap-2 rounded-md bg-background-dg/60 p-3'
    >
      <figcaption className='flex items-center justify-between text-sm font-semibold'>
        Output preview
        <span className='text-xs font-normal text-foreground-dg/60'>
          live{settings.speed !== 1 && ` · ${formatSpeed(settings.speed)}`}
        </span>
      </figcaption>
      <div
        className='grid place-items-center rounded bg-black/60'
        style={{ minHeight: previewBox / 2 }}
      >
        {size && (
          <OutputPreview
            video={video}
            crop={crop}
            box={previewBox}
            fit='contain'
            outputWidth={size.width}
            orientation={settings}
            label='Output preview drawing'
          />
        )}
      </div>
      {settings.direction !== 'forward' && (
        <p className='text-xs text-foreground-dg/70'>
          The preview plays forward.{' '}
          {settings.direction === 'reverse' ? 'Reverse' : 'Boomerang'} is
          applied when you convert.
        </p>
      )}
      {size && (
        <div className='flex flex-wrap gap-1.5' aria-label='Output details'>
          <span className={pill}>
            <b>
              {size.width} × {size.height}
            </b>
          </span>
          {seconds !== null && (
            <span className={pill}>
              <b>{seconds.toFixed(1)} s</b>
            </span>
          )}
          {frames !== null && <span className={pill}>{frames} frames</span>}
          {largeGif && (
            <span
              role='status'
              className={`${pill} border-amber-600/70 bg-amber-950/40 text-amber-200`}
            >
              Big GIF. Try fewer frames or a smaller width.
            </span>
          )}
        </div>
      )}
    </figure>
  );
}

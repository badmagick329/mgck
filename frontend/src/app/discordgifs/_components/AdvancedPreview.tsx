'use client';

import { ClipCrop } from '@/lib/types/discordgifs';
import { Size } from '@/lib/discordgifs/output-preview';
import OutputPreview from './OutputPreview';

/** Fits the 390 px phone's settings column, the narrowest it gets. */
const previewBox = 300;

const pill =
  'rounded-full border border-foreground-dg/20 px-2 py-0.5 text-xs tabular-nums';

/**
 * Gif Studio's *Output preview*: the selection as it will encode, with the
 * file's exact size, length and frame count.
 */
export default function AdvancedPreview({
  video,
  crop,
  size,
  seconds,
  frames,
  largeGif,
}: {
  video: HTMLVideoElement | null;
  crop?: ClipCrop;
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
        <span className='text-xs font-normal text-foreground-dg/60'>live</span>
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
            label='Output preview drawing'
          />
        )}
      </div>
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

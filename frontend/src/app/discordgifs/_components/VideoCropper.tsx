'use client';

import {
  ReactNode,
  PointerEvent,
  KeyboardEvent,
  useRef,
  useState,
  useId,
} from 'react';
import clsx from 'clsx';
import { ClipCrop } from '@/lib/types/discordgifs';
import {
  CropHandle,
  cropPixels,
  cropRatios,
  fitRatio,
  fullFrame,
  isFullFrame,
  moveCrop,
  resizeCrop,
} from '@/lib/discordgifs/crop';
import { passesShortcuts } from '@/lib/discordgifs/shortcuts';

const ratioChoices = [{ label: 'Free', ratio: null }, ...cropRatios];

const handleLabels: Record<CropHandle, string> = {
  nw: 'top left',
  n: 'top',
  ne: 'top right',
  e: 'right',
  se: 'bottom right',
  s: 'bottom',
  sw: 'bottom left',
  w: 'left',
};

/**
 * Handles sit inside the box rather than straddling its edges: the stage clips
 * to the frame, so a full-frame box keeps every handle visible and grabbable.
 */
const handlePlacement: Record<CropHandle, string> = {
  nw: 'left-0 top-0 h-7 w-7 cursor-nwse-resize',
  ne: 'right-0 top-0 h-7 w-7 cursor-nesw-resize',
  sw: 'bottom-0 left-0 h-7 w-7 cursor-nesw-resize',
  se: 'bottom-0 right-0 h-7 w-7 cursor-nwse-resize',
  n: 'left-1/2 top-0 h-6 w-10 -translate-x-1/2 cursor-ns-resize',
  s: 'bottom-0 left-1/2 h-6 w-10 -translate-x-1/2 cursor-ns-resize',
  w: 'left-0 top-1/2 h-10 w-6 -translate-y-1/2 cursor-ew-resize',
  e: 'right-0 top-1/2 h-10 w-6 -translate-y-1/2 cursor-ew-resize',
};

const handleMark: Record<CropHandle, string> = {
  nw: 'left-0 top-0 h-2.5 w-2.5',
  ne: 'right-0 top-0 h-2.5 w-2.5',
  sw: 'bottom-0 left-0 h-2.5 w-2.5',
  se: 'bottom-0 right-0 h-2.5 w-2.5',
  n: 'left-2.5 top-0 h-1 w-5',
  s: 'bottom-0 left-2.5 h-1 w-5',
  w: 'left-0 top-2.5 h-5 w-1',
  e: 'right-0 top-2.5 h-5 w-1',
};

/** Corners cover every keyboard resize, so edges stay pointer-only to keep the tab order short. */
const corners = new Set<CropHandle>(['nw', 'ne', 'sw', 'se']);

const chip =
  'h-8 rounded-md px-2.5 text-sm text-foreground-dg/80 hover:bg-foreground-dg/10 hover:text-foreground-dg aria-pressed:bg-primary-dg aria-pressed:font-semibold aria-pressed:text-foreground-dg disabled:cursor-not-allowed disabled:opacity-50';

/** An overlay edits source coordinates without decoding or encoding extra frames. */
export default function VideoCropper({
  children,
  dimensions,
  crop,
  disabled,
  onChange,
  maxHeight = 256,
}: {
  children: ReactNode;
  dimensions: { width: number; height: number } | null;
  crop?: ClipCrop;
  disabled: boolean;
  onChange: (crop: ClipCrop | undefined) => void;
  /** Tallest the video may draw, in CSS pixels; it matches the video's own cap. */
  maxHeight?: number;
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    width: number;
    height: number;
    crop: ClipCrop;
    handle: CropHandle | 'move';
  }>();
  const helpId = useId();
  const selection = crop ?? fullFrame;
  const aspect = dimensions ? dimensions.width / dimensions.height : 1;
  const commit = (next: ClipCrop) =>
    onChange(dimensions && isFullFrame(next, dimensions) ? undefined : next);
  const update = (
    handle: CropHandle | 'move',
    original: ClipCrop,
    dx: number,
    dy: number
  ) =>
    commit(
      handle === 'move'
        ? moveCrop(original, dx, dy)
        : resizeCrop(original, handle, dx, dy, aspect, ratio)
    );
  const endDrag = () => {
    drag.current = undefined;
    setDragging(false);
  };
  const startDrag = (
    event: PointerEvent<HTMLButtonElement>,
    handle: CropHandle | 'move'
  ) => {
    if (disabled || !event.isPrimary || event.button !== 0) return;
    const rect = stage.current!.getBoundingClientRect();
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height,
      crop: selection,
      handle,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
  };
  const keyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    handle: CropHandle | 'move'
  ) => {
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 0.05 : 0.01;
    update(handle, selection, direction[0] * step, direction[1] * step);
  };
  const size = dimensions && cropPixels(selection, dimensions);

  return (
    <div className='flex min-w-0 flex-col gap-2'>
      {dimensions && size && (
        <>
          <div className='flex flex-wrap items-center gap-1'>
            <span className='mr-1 text-sm font-semibold'>Crop</span>
            {ratioChoices.map((choice) => (
              <button
                key={choice.label}
                type='button'
                className={chip}
                disabled={disabled}
                aria-pressed={ratio === choice.ratio}
                onClick={() => {
                  setRatio(choice.ratio);
                  if (choice.ratio !== null)
                    commit(fitRatio(selection, choice.ratio, aspect));
                }}
              >
                {choice.label}
              </button>
            ))}
            <button
              type='button'
              className='h-8 rounded-md border border-foreground-dg/25 px-2.5 text-sm hover:bg-foreground-dg/10 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={disabled || !crop}
              onClick={() =>
                commit(
                  ratio === null
                    ? fullFrame
                    : fitRatio(fullFrame, ratio, aspect)
                )
              }
            >
              Reset crop
            </button>
          </div>
          <p className='text-sm text-foreground-dg/70'>
            {crop
              ? `Crop ${size.width} × ${size.height} px`
              : 'Full frame. Drag a corner to crop.'}
          </p>
        </>
      )}
      <div
        ref={stage}
        className='relative mx-auto w-full overflow-hidden rounded-md bg-black'
        style={
          dimensions
            ? { aspectRatio: aspect, maxWidth: maxHeight * aspect }
            : undefined
        }
      >
        {children}
        {dimensions && size && (
          <div className='pointer-events-none absolute inset-0'>
            <div
              className='group absolute'
              style={{
                left: `${selection.x * 100}%`,
                top: `${selection.y * 100}%`,
                width: `${selection.width * 100}%`,
                height: `${selection.height * 100}%`,
                // The outer spread darkens everything outside the box; the
                // inset ring draws its border without leaving the clipped stage.
                boxShadow:
                  '0 0 0 9999px rgb(0 0 0 / 58%), inset 0 0 0 1.5px #fff',
              }}
            >
              <div
                aria-hidden
                className={clsx(
                  'absolute inset-0 transition-opacity',
                  dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              >
                <div className='absolute inset-y-0 left-1/3 right-1/3 border-x border-white/35' />
                <div className='absolute inset-x-0 bottom-1/3 top-1/3 border-y border-white/35' />
              </div>
              {(
                ['move', 'n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'] as const
              ).map((handle) => (
                <button
                  key={handle}
                  type='button'
                  {...passesShortcuts}
                  disabled={disabled}
                  tabIndex={
                    handle === 'move' || corners.has(handle) ? undefined : -1
                  }
                  aria-label={
                    handle === 'move'
                      ? 'Move crop'
                      : `Resize crop ${handleLabels[handle]}`
                  }
                  aria-describedby={helpId}
                  className={clsx(
                    'group/handle pointer-events-auto absolute touch-none',
                    handle === 'move'
                      ? 'inset-0 cursor-move focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orange-500'
                      : `focus-visible:outline-none ${handlePlacement[handle]}`
                  )}
                  onPointerDown={(event) => startDrag(event, handle)}
                  onPointerMove={(event) => {
                    const active = drag.current;
                    if (
                      disabled ||
                      !active ||
                      active.pointer !== event.pointerId
                    )
                      return;
                    update(
                      active.handle,
                      active.crop,
                      (event.clientX - active.x) / active.width,
                      (event.clientY - active.y) / active.height
                    );
                  }}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onLostPointerCapture={endDrag}
                  onKeyDown={(event) => keyboard(event, handle)}
                >
                  {handle !== 'move' && (
                    <span
                      className={clsx(
                        'absolute rounded-sm bg-white shadow-[0_1px_4px_rgb(0_0_0/50%)] group-hover/handle:bg-primary-dg group-focus-visible/handle:bg-orange-500',
                        handleMark[handle]
                      )}
                    />
                  )}
                </button>
              ))}
              <span className='pointer-events-none absolute left-3.5 top-3.5 whitespace-nowrap rounded bg-black/65 px-1.5 text-xs leading-5 text-white'>
                {size.width} × {size.height}
              </span>
            </div>
          </div>
        )}
      </div>
      <p id={helpId} className='sr-only'>
        Drag the box to move it, or a corner or edge to resize it. With the box
        or a corner focused, arrow keys move or resize it; hold Shift for larger
        steps.
      </p>
    </div>
  );
}

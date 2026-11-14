'use client';

import { KeyboardEvent, PointerEvent, useRef } from 'react';
import {
  formatClipTime,
  moveSelection,
  setSelectionEnd,
  setSelectionStart,
  shortestSelection,
} from '@/lib/discordgifs/trim';
import { timelineThumbnailCount } from '@/lib/discordgifs/timeline-thumbnails';

type Selection = { start: number; end: number };
type Part = 'start' | 'end' | 'span' | 'playhead' | 'seek';

/** Pointer travel, as a share of the clip, below which a press on the span is a click. */
const moveThreshold = 0.004;

/**
 * The thumbnail strip with start and end handles, a draggable span and a
 * playhead. The handles and playhead are sliders, so keyboard users get the
 * same edits as pointer users.
 */
export default function TrimTimeline({
  total,
  selection,
  currentTime,
  frameSeconds,
  thumbnails,
  disabled,
  onSelectionChange,
  onSeek,
  onScrubChange,
}: {
  total: number;
  selection: Selection;
  currentTime: number;
  frameSeconds: number;
  thumbnails: string[];
  disabled: boolean;
  onSelectionChange: (selection: Selection) => void;
  onSeek: (seconds: number) => void;
  onScrubChange: (scrubbing: boolean) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointer: number;
    part: Part;
    left: number;
    width: number;
    origin: number;
    selection: Selection;
    moved: boolean;
  }>();
  const { start, end } = selection;
  const percent = (seconds: number) => `${(seconds / total) * 100}%`;
  const shortest = shortestSelection(total, frameSeconds);

  const applyStart = (seconds: number, from = selection) => {
    const next = setSelectionStart(from, seconds, total, frameSeconds);
    onSelectionChange(next);
    onSeek(next.start);
  };
  const applyEnd = (seconds: number, from = selection) => {
    const next = setSelectionEnd(from, seconds, total, frameSeconds);
    onSelectionChange(next);
    onSeek(next.end);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    const rect = strip.current!.getBoundingClientRect();
    if (rect.width <= 0) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-part]'
    );
    const part = (target?.dataset.part as Part | undefined) ?? 'seek';
    const origin =
      Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) *
      total;
    drag.current = {
      pointer: event.pointerId,
      part,
      left: rect.left,
      width: rect.width,
      origin,
      selection,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    target?.focus();
    if (part === 'seek') onSeek(origin);
    if (part === 'playhead') onScrubChange(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (disabled || !active || active.pointer !== event.pointerId) return;
    const seconds =
      Math.min(1, Math.max(0, (event.clientX - active.left) / active.width)) *
      total;
    if (Math.abs(seconds - active.origin) > total * moveThreshold)
      active.moved = true;
    if (active.part === 'start') applyStart(seconds, active.selection);
    else if (active.part === 'end') applyEnd(seconds, active.selection);
    else if (active.part === 'span' && active.moved) {
      const next = moveSelection(
        active.selection,
        seconds - active.origin,
        total
      );
      onSelectionChange(next);
      onSeek(next.start);
    } else if (active.part === 'seek' || active.part === 'playhead')
      onSeek(seconds);
  };

  const endDrag = () => {
    const active = drag.current;
    if (!active) return;
    drag.current = undefined;
    // A press on the span that never moved is a click, so it seeks like the rest of the strip.
    if (active.part === 'span' && !active.moved) onSeek(active.origin);
    // After placing the end, return to the start so the next play shows the whole selection.
    if (active.part === 'end') onSeek(active.selection.start);
    if (active.part === 'playhead') onScrubChange(false);
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    part: 'start' | 'end' | 'playhead'
  ) => {
    if (disabled) return;
    const step = event.shiftKey ? 1 : frameSeconds;
    const value = part === 'start' ? start : part === 'end' ? end : currentTime;
    const next = {
      ArrowLeft: value - step,
      ArrowDown: value - step,
      ArrowRight: value + step,
      ArrowUp: value + step,
      Home: 0,
      End: total,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    if (part === 'start') applyStart(next);
    else if (part === 'end') applyEnd(next);
    else onSeek(Math.min(total, Math.max(0, next)));
  };

  const slider = (part: 'start' | 'end' | 'playhead') => ({
    role: 'slider',
    tabIndex: disabled ? -1 : 0,
    'aria-disabled': disabled || undefined,
    'aria-valuemin': 0,
    'aria-valuemax': Number(total.toFixed(2)),
    'aria-valuenow': Number(
      (part === 'start' ? start : part === 'end' ? end : currentTime).toFixed(2)
    ),
    'aria-valuetext': formatClipTime(
      part === 'start' ? start : part === 'end' ? end : currentTime
    ),
    'data-part': part,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => onKeyDown(event, part),
  });

  const handle =
    'absolute -bottom-px -top-px z-20 grid w-3.5 place-items-center bg-primary-dg outline-none before:absolute before:-inset-x-2 before:inset-y-0 after:h-[18px] after:w-0.5 after:rounded-sm after:bg-black/50 focus-visible:ring-2 focus-visible:ring-foreground-dg';

  return (
    <div className='px-3.5 pt-5'>
      <div
        ref={strip}
        role='group'
        aria-label='Trim timeline'
        className={`relative h-16 touch-none select-none rounded-[10px] border border-foreground-dg/15 bg-foreground-dg/10 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {thumbnails.length > 0 && (
          <div
            aria-hidden
            data-testid='timeline-thumbnails'
            className='pointer-events-none absolute inset-0 flex overflow-hidden rounded-[9px]'
          >
            {Array.from({ length: timelineThumbnailCount }, (_, index) => (
              <div
                key={index}
                className='h-full min-w-0 flex-1 bg-cover bg-center'
                style={
                  thumbnails[index]
                    ? { backgroundImage: `url("${thumbnails[index]}")` }
                    : undefined
                }
              />
            ))}
          </div>
        )}
        <div
          className='pointer-events-none absolute inset-y-0 left-0 rounded-l-[9px] bg-black/70'
          style={{ width: percent(start) }}
        />
        <div
          className='pointer-events-none absolute inset-y-0 right-0 rounded-r-[9px] bg-black/70'
          style={{ width: percent(total - end) }}
        />
        <div
          data-part='span'
          className={`absolute -bottom-px -top-px rounded-md border-2 border-primary-dg ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
          style={{ left: percent(start), width: percent(end - start) }}
        />
        <div
          {...slider('start')}
          aria-label='Selection start'
          aria-valuemax={Number(Math.max(0, end - shortest).toFixed(2))}
          className={`${handle} -translate-x-3 rounded-l-md ${disabled ? '' : 'cursor-ew-resize'}`}
          style={{ left: percent(start) }}
        />
        <div
          {...slider('end')}
          aria-label='Selection end'
          aria-valuemin={Number(Math.min(total, start + shortest).toFixed(2))}
          className={`${handle} -translate-x-0.5 rounded-r-md ${disabled ? '' : 'cursor-ew-resize'}`}
          style={{ left: percent(end) }}
        />
        <div
          className='pointer-events-none absolute -bottom-1.5 -top-5 z-30 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/40%)]'
          style={{ left: percent(currentTime) }}
        >
          <div
            {...slider('playhead')}
            aria-label='Playhead'
            className={`pointer-events-auto absolute -left-[7px] top-0 h-3.5 w-4 rounded-t bg-white shadow outline-none after:absolute after:left-[3px] after:top-[13px] after:border-[5px] after:border-transparent after:border-t-white focus-visible:ring-2 focus-visible:ring-primary-dg ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
          />
        </div>
      </div>
    </div>
  );
}

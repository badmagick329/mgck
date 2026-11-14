'use client';

import { useId } from 'react';
import {
  IoChevronBack,
  IoChevronForward,
  IoPause,
  IoPlay,
} from 'react-icons/io5';
import { Switch } from '@/components/ui/switch';
import { formatClipTime } from '@/lib/discordgifs/trim';

const stepButton =
  'grid h-9 w-9 place-items-center rounded-md text-foreground-dg/70 hover:bg-foreground-dg/10 hover:text-foreground-dg';

/** Replaces the native controls so the video surface stays free for the crop box. */
export default function ClipTransport({
  playing,
  currentTime,
  total,
  loopSelection,
  sound,
  onTogglePlay,
  onStep,
  onLoopSelectionChange,
  onSoundChange,
}: {
  playing: boolean;
  currentTime: number;
  total: number;
  loopSelection: boolean;
  sound: boolean;
  onTogglePlay: () => void;
  onStep: (direction: -1 | 1) => void;
  onLoopSelectionChange: (loop: boolean) => void;
  onSoundChange: (sound: boolean) => void;
}) {
  const loopId = useId();
  const soundId = useId();
  return (
    <div className='flex flex-wrap items-center gap-x-2 gap-y-2'>
      <button
        type='button'
        aria-label={playing ? 'Pause' : 'Play'}
        className='grid h-10 w-10 place-items-center rounded-full bg-foreground-dg text-background-dg hover:bg-foreground-dg/90'
        onClick={onTogglePlay}
      >
        {playing ? (
          <IoPause aria-hidden className='h-4 w-4' />
        ) : (
          <IoPlay aria-hidden className='ml-0.5 h-4 w-4' />
        )}
      </button>
      <button
        type='button'
        aria-label='Previous frame'
        className={stepButton}
        onClick={() => onStep(-1)}
      >
        <IoChevronBack aria-hidden className='h-4 w-4' />
      </button>
      <button
        type='button'
        aria-label='Next frame'
        className={stepButton}
        onClick={() => onStep(1)}
      >
        <IoChevronForward aria-hidden className='h-4 w-4' />
      </button>
      <p className='font-mono text-sm tabular-nums text-foreground-dg/70'>
        <span className='text-foreground-dg'>
          {formatClipTime(currentTime)}
        </span>{' '}
        / {formatClipTime(total)}
      </p>
      <div className='ml-auto flex items-center gap-4'>
        <span className='flex items-center gap-2 text-sm'>
          <Switch
            id={loopId}
            checked={loopSelection}
            onCheckedChange={onLoopSelectionChange}
            className='data-[state=checked]:bg-primary-dg data-[state=unchecked]:bg-foreground-dg/20'
          />
          <label htmlFor={loopId} className='cursor-pointer'>
            Loop selection
          </label>
        </span>
        <span className='flex items-center gap-2 text-sm'>
          <Switch
            id={soundId}
            checked={sound}
            onCheckedChange={onSoundChange}
            className='data-[state=checked]:bg-primary-dg data-[state=unchecked]:bg-foreground-dg/20'
          />
          <label htmlFor={soundId} className='cursor-pointer'>
            Sound
          </label>
        </span>
      </div>
    </div>
  );
}

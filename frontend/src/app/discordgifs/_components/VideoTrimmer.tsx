'use client';

import { useEffect, useRef, useState } from 'react';
import { ClipTrim, FFmpegFileData } from '@/lib/types/discordgifs';

/** Native playback keeps editing responsive without generating encoded previews. */
export default function VideoTrimmer({
  fileData,
  disabled,
  onChange,
}: {
  fileData: FFmpegFileData;
  disabled: boolean;
  onChange: (trim: ClipTrim | undefined) => void;
}) {
  const { file, duration, trim } = fileData;
  const video = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const [playError, setPlayError] = useState('');
  const [loopSelection, setLoopSelection] = useState(false);
  const selectionPlayback = useRef(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setFailed(false);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (duration.status === 'checking') return <p>Checking clip duration…</p>;
  if (duration.status === 'unknown' || duration.seconds <= 0 || failed) {
    return (
      <p className='text-sm'>
        This browser cannot preview this format. You can still try converting
        the original file. To trim it here, choose a browser-playable video such
        as an H.264 MP4.
      </p>
    );
  }

  const total = duration.seconds;
  const start = trim?.start ?? 0;
  const end = trim?.end ?? total;
  const minimum = Math.min(0.1, total);
  const change = (next: ClipTrim | undefined) => {
    selectionPlayback.current = false;
    video.current?.pause();
    onChange(next);
    if (video.current) video.current.currentTime = next?.start ?? 0;
  };

  return (
    <fieldset
      disabled={disabled}
      className='flex w-full min-w-0 flex-col gap-3 text-left disabled:opacity-60'
    >
      <legend className='mb-2 font-semibold'>Choose your clip</legend>
      <video
        ref={video}
        src={url}
        controls
        playsInline
        preload='metadata'
        className='max-h-64 w-full rounded-md bg-black'
        onError={() => setFailed(true)}
        onTimeUpdate={() => {
          const player = video.current!;
          if (selectionPlayback.current && player.currentTime >= end) {
            if (loopSelection) {
              player.currentTime = start;
              void player.play().catch(() => {
                selectionPlayback.current = false;
                setPlayError('Could not loop this clip. Try playing it again.');
              });
            } else {
              player.pause();
              selectionPlayback.current = false;
              player.currentTime = end;
            }
          }
        }}
      />
      <label className='flex flex-col gap-1'>
        Start: {start.toFixed(2)} s
        <input
          aria-label='Clip start'
          type='range'
          min={0}
          max={total - minimum}
          step='0.01'
          value={start}
          onChange={(event) =>
            change({
              start: Math.min(Number(event.target.value), end - minimum),
              end,
            })
          }
        />
      </label>
      <label className='flex flex-col gap-1'>
        End: {end.toFixed(2)} s
        <input
          aria-label='Clip end'
          type='range'
          min={minimum}
          max={total}
          step='0.01'
          value={end}
          onChange={(event) =>
            change({
              start,
              end: Math.max(Number(event.target.value), start + minimum),
            })
          }
        />
      </label>
      <p aria-live='polite' className='text-sm'>
        Selected: {(end - start).toFixed(2)} seconds. Applies to all selected
        outputs.
      </p>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          className='rounded border px-3 py-2'
          onClick={async () => {
            const player = video.current!;
            player.currentTime = start;
            selectionPlayback.current = true;
            setPlayError('');
            try {
              await player.play();
            } catch {
              selectionPlayback.current = false;
              setPlayError(
                'Could not play this clip. Try the video controls or a different file.'
              );
            }
          }}
        >
          Play selection
        </button>
        <label className='flex items-center gap-2 px-2'>
          <input
            type='checkbox'
            checked={loopSelection}
            onChange={(event) => setLoopSelection(event.target.checked)}
          />
          Loop selection
        </label>
        {fileData.outputTypes.includes('sticker') && end - start > 5 && (
          <button
            type='button'
            className='rounded border px-3 py-2'
            onClick={() => change({ start, end: Math.min(start + 5, total) })}
          >
            Use 5 seconds from start
          </button>
        )}
        {trim && (
          <button
            type='button'
            className='rounded border px-3 py-2'
            onClick={() => change(undefined)}
          >
            Use whole clip
          </button>
        )}
      </div>
      {playError && <p role='alert'>{playError}</p>}
    </fieldset>
  );
}

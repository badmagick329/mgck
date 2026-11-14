'use client';

import { useEffect, useRef, useState } from 'react';
import { ClipCrop, ClipTrim, FFmpegFileData } from '@/lib/types/discordgifs';
import {
  defaultFrameSeconds,
  formatClipTime,
  parseClipTime,
  setSelectionEnd,
  setSelectionStart,
  toClipTrim,
} from '@/lib/discordgifs/trim';
import { useTimelineThumbnails } from '@/hooks/discordgifs/useTimelineThumbnails';
import ClipTransport from './ClipTransport';
import TrimTimeline from './TrimTimeline';
import VideoCropper from './VideoCropper';

type Playback = { start: number; end: number; loop: boolean };

/**
 * Selection end is treated as reached slightly early, so a loop restarts
 * before the browser paints a frame past the end.
 */
const endTolerance = 0.02;

/** Keeps preview playback inside the selection: loop back to the start, or stop at the end. */
function keepInSelection(player: HTMLVideoElement, playback: Playback) {
  const time = player.currentTime;
  const pastEnd = time >= playback.end - endTolerance;
  if (playback.loop) {
    if (pastEnd || time < playback.start - 0.3)
      player.currentTime = playback.start;
  } else if (pastEnd) {
    player.pause();
    player.currentTime = playback.end;
  }
}

const button =
  'h-9 rounded-md border border-foreground-dg/25 px-3 text-sm hover:bg-foreground-dg/10 disabled:cursor-not-allowed disabled:opacity-50';

/** Native playback keeps editing responsive without generating encoded previews. */
export default function VideoTrimmer({
  fileData,
  disabled,
  onChange,
  onCropChange,
}: {
  fileData: FFmpegFileData;
  disabled: boolean;
  onChange: (trim: ClipTrim | undefined) => void;
  onCropChange: (crop: ClipCrop | undefined) => void;
}) {
  const { file, duration, trim } = fileData;
  const video = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const [playError, setPlayError] = useState('');
  const [loopSelection, setLoopSelection] = useState(true);
  const [sound, setSound] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [measuredFrameSeconds, setMeasuredFrameSeconds] = useState<
    number | null
  >(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const resumeAfterScrub = useRef(false);

  const total = duration.status === 'known' ? duration.seconds : 0;
  const start = trim?.start ?? 0;
  const end = trim?.end ?? total;
  const frameSeconds = measuredFrameSeconds ?? defaultFrameSeconds;
  const playback = useRef<Playback>({ start, end, loop: loopSelection });
  useEffect(() => {
    playback.current = { start, end, loop: loopSelection };
  });
  const thumbnails = useTimelineThumbnails(
    failed ? '' : url,
    total > 0 ? total : null
  );

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setFailed(false);
    setMeasuredFrameSeconds(null);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // timeupdate fires only a few times a second; a frame loop keeps the
  // playhead smooth and the loop point tight while playing.
  useEffect(() => {
    const player = video.current;
    if (!playing || !player) return;
    let frame = requestAnimationFrame(function tick() {
      keepInSelection(player, playback.current);
      setCurrentTime(player.currentTime);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // Browsers report no frame rate, so measure the interval between
  // consecutively presented frames; the smallest one is the clip's frame step.
  useEffect(() => {
    const player = video.current;
    if (!playing || !player || !('requestVideoFrameCallback' in player)) return;
    let last: VideoFrameCallbackMetadata | undefined;
    let handle = player.requestVideoFrameCallback(
      function measure(_, metadata) {
        if (last && metadata.presentedFrames - last.presentedFrames === 1) {
          const interval = metadata.mediaTime - last.mediaTime;
          if (interval > 1 / 240 && interval < 0.5)
            setMeasuredFrameSeconds((current) =>
              current === null ? interval : Math.min(current, interval)
            );
        }
        last = metadata;
        handle = player.requestVideoFrameCallback(measure);
      }
    );
    return () => player.cancelVideoFrameCallback(handle);
  }, [playing]);

  if (duration.status === 'checking') return <p>Checking clip duration…</p>;
  if (duration.status === 'unknown' || duration.seconds <= 0 || failed) {
    return (
      <p className='text-sm'>
        This browser cannot preview this format. You can still try converting
        the original file. To trim or crop it here, choose a browser-playable
        video such as an H.264 MP4.
      </p>
    );
  }

  const selection = { start, end };
  const length = end - start;
  const change = (next: { start: number; end: number } | undefined) =>
    onChange(next && toClipTrim(next, total));
  const seek = (seconds: number) => {
    const clamped = Math.min(total, Math.max(0, seconds));
    if (video.current) video.current.currentTime = clamped;
    setCurrentTime(clamped);
  };
  const play = async () => {
    setPlayError('');
    try {
      await video.current!.play();
    } catch {
      setPlayError('Could not play this clip. Try a different file.');
    }
  };
  const togglePlay = () => {
    const player = video.current!;
    if (playing) {
      player.pause();
      return;
    }
    if (player.currentTime < start - 0.05 || player.currentTime >= end - 0.05)
      seek(start);
    void play();
  };
  const commitStart = (seconds: number) => {
    const next = setSelectionStart(selection, seconds, total, frameSeconds);
    change(next);
    seek(next.start);
  };
  const commitEnd = (seconds: number) => {
    const next = setSelectionEnd(selection, seconds, total, frameSeconds);
    change(next);
    seek(next.end);
  };

  return (
    <fieldset
      disabled={disabled}
      className='flex w-full min-w-0 flex-col gap-3 text-left disabled:opacity-60'
    >
      <legend className='mb-2 font-semibold'>Choose your clip</legend>
      <VideoCropper
        dimensions={dimensions}
        crop={fileData.crop}
        disabled={disabled}
        onChange={onCropChange}
      >
        <video
          ref={video}
          src={url}
          muted={!sound}
          playsInline
          preload='auto'
          className='max-h-64 w-full rounded-md bg-black'
          onLoadedMetadata={() => {
            const player = video.current!;
            if (player.videoWidth >= 2 && player.videoHeight >= 2)
              setDimensions({
                width: player.videoWidth,
                height: player.videoHeight,
              });
          }}
          onError={() => setFailed(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            // A selection ending at the clip's end stops the video before the
            // frame loop sees it, so looping restarts it here.
            if (!loopSelection) return;
            seek(start);
            void play();
          }}
          onSeeked={() => setCurrentTime(video.current!.currentTime)}
          onTimeUpdate={() => {
            const player = video.current!;
            if (playing) keepInSelection(player, playback.current);
            setCurrentTime(player.currentTime);
          }}
        />
      </VideoCropper>
      <ClipTransport
        playing={playing}
        currentTime={currentTime}
        total={total}
        loopSelection={loopSelection}
        sound={sound}
        onTogglePlay={togglePlay}
        onStep={(direction) => {
          video.current!.pause();
          seek(video.current!.currentTime + direction * frameSeconds);
        }}
        onLoopSelectionChange={setLoopSelection}
        onSoundChange={setSound}
      />
      <TrimTimeline
        total={total}
        selection={selection}
        currentTime={currentTime}
        frameSeconds={frameSeconds}
        thumbnails={thumbnails}
        disabled={disabled}
        onSelectionChange={change}
        onSeek={seek}
        onScrubChange={(scrubbing) => {
          if (scrubbing) {
            resumeAfterScrub.current = playing;
            video.current!.pause();
          } else if (resumeAfterScrub.current) {
            resumeAfterScrub.current = false;
            void play();
          }
        }}
      />
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
        <TimeField label='Start' seconds={start} onCommit={commitStart} />
        <TimeField label='End' seconds={end} onCommit={commitEnd} />
        <p>
          Length{' '}
          <span className='font-semibold tabular-nums'>
            {length.toFixed(2)} s
          </span>
        </p>
      </div>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          className={button}
          onClick={() => commitStart(currentTime)}
        >
          Set start
        </button>
        <button
          type='button'
          className={button}
          onClick={() => commitEnd(currentTime)}
        >
          Set end
        </button>
        <button
          type='button'
          className={button}
          disabled={!trim}
          onClick={() => change(undefined)}
        >
          Whole clip
        </button>
        {fileData.outputTypes.includes('sticker') && length > 5 && (
          <button
            type='button'
            className={button}
            onClick={() => change({ start, end: Math.min(start + 5, total) })}
          >
            Use 5 seconds from start
          </button>
        )}
      </div>
      <p className='text-xs text-foreground-dg/70'>
        The selection and crop apply to all selected outputs.
      </p>
      {playError && <p role='alert'>{playError}</p>}
    </fieldset>
  );
}

/** Holds a draft while typing so partial input is never clamped mid-edit. */
function TimeField({
  label,
  seconds,
  onCommit,
}: {
  label: string;
  seconds: number;
  onCommit: (seconds: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const parsed = parseClipTime(draft);
    setDraft(null);
    if (parsed !== null) onCommit(parsed);
  };
  return (
    <label className='flex items-center gap-1.5'>
      {label}
      <input
        type='text'
        inputMode='decimal'
        spellCheck={false}
        autoComplete='off'
        className='h-8 w-[5.5rem] rounded-md border border-foreground-dg/25 bg-background-dg px-2 font-mono text-[13px] focus:border-primary-dg focus:outline-none'
        value={draft ?? formatClipTime(seconds)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') setDraft(null);
        }}
      />
    </label>
  );
}

'use client';

import { MutableRefObject, useRef, useState } from 'react';
import { IoIosCloseCircle } from 'react-icons/io';
import {
  ClipCrop,
  ClipTrim,
  EditorClip,
  SessionResult,
} from '@/lib/types/discordgifs';
import {
  AdvancedSettings,
  FileType,
  croppedSourceSize,
  evenDown,
  fileTypeInfo,
  fileTypeOrder,
  frameCount,
  isLargeGif,
  isSideways,
  outputSeconds,
  outputSize,
  frameMemoryBudget,
  frameMemoryLimitSeconds,
} from '@/lib/discordgifs/advanced';
import { formatClipTime } from '@/lib/discordgifs/trim';
import {
  FFmpegManager,
  SinglePassOutput,
} from '@/lib/discordgifs/ffmpeg-manager';
import { truncateText } from '@/lib/utils';
import { useClipShortcuts } from '@/hooks/discordgifs/useClipShortcuts';
import { usePhoneMemory } from '@/hooks/discordgifs/usePhoneMemory';
import VideoTrimmer, { LoadedMedia } from './VideoTrimmer';
import AdvancedPreview from './AdvancedPreview';
import AdvancedSettingsForm from './AdvancedSettingsForm';
import SessionResults from './SessionResults';
import LargeFileWarning from './LargeFileWarning';

type Job = { fileType: FileType; index: number; total: number; done: number };

let resultId = 0;

/**
 * Advanced mode: one clip, Gif Studio's two-column editor, and a single
 * FFmpeg run per ticked file type with the user's own settings.
 */
export default function AdvancedEditor({
  clip,
  settings,
  results,
  ffmpegRef,
  onSettingsChange,
  onTrimChange,
  onCropChange,
  onRemove,
  onResult,
  onBusyChange,
}: {
  clip: EditorClip | null;
  settings: AdvancedSettings;
  results: readonly SessionResult[];
  ffmpegRef: MutableRefObject<FFmpegManager>;
  onSettingsChange: (settings: AdvancedSettings) => void;
  onTrimChange: (trim: ClipTrim | undefined) => void;
  onCropChange: (crop: ClipCrop | undefined) => void;
  onRemove: () => void;
  onResult: (result: SessionResult) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const [media, setMedia] = useState<LoadedMedia | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState('');
  const cancelled = useRef(false);
  const phone = usePhoneMemory();

  // Media belongs to the clip it was read from; a replacement starts empty.
  const loaded = clip && mediaFile === clip.file ? media : null;
  const cropped = loaded ? croppedSourceSize(clip?.crop, loaded) : null;
  const size = cropped
    ? outputSize(settings.width, cropped, settings.rotation)
    : null;
  const selectionSeconds = !clip
    ? null
    : clip.trim
      ? clip.trim.end - clip.trim.start
      : clip.duration.status === 'known'
        ? clip.duration.seconds
        : null;
  const seconds =
    selectionSeconds !== null
      ? outputSeconds(selectionSeconds, settings)
      : null;
  const frames = seconds !== null ? frameCount(seconds, settings.fps) : null;
  const largeGif =
    settings.fileTypes.includes('gif') &&
    size !== null &&
    frames !== null &&
    isLargeGif(size, frames);
  const memoryLimit = size
    ? frameMemoryLimitSeconds(
        size,
        settings,
        phone ? frameMemoryBudget.phone : frameMemoryBudget.desktop
      )
    : null;
  // An unknown length can't be checked; Cancel recovers a run that outgrows memory.
  const overMemoryLimit =
    memoryLimit !== null &&
    selectionSeconds !== null &&
    selectionSeconds > memoryLimit;
  const canConvert =
    clip !== null &&
    job === null &&
    clip.duration.status !== 'checking' &&
    settings.fileTypes.length > 0 &&
    !overMemoryLimit;

  const convert = async () => {
    if (!clip || !canConvert) return;
    const fileTypes = fileTypeOrder.filter((type) =>
      settings.fileTypes.includes(type)
    );
    const manager = ffmpegRef.current;
    cancelled.current = false;
    setMessage('');
    setJob({ fileType: fileTypes[0], index: 0, total: fileTypes.length, done: 0 });
    onBusyChange(true);
    try {
      if (!manager.loaded()) await manager.load();
      await manager.convertSinglePass(
        {
          file: clip.file,
          trim: clip.trim,
          crop: clip.crop,
          settings: { ...settings, fileTypes },
          width:
            size?.width ??
            (settings.width === 'original' ? null : evenDown(settings.width)),
          keepSound: settings.keepSound && loaded?.hasAudio !== false,
          outputSeconds: seconds ?? 0,
        },
        {
          onStart: (fileType, index) =>
            setJob((current) =>
              current && { ...current, fileType, index, done: 0 }
            ),
          onProgress: (done) =>
            setJob((current) => current && { ...current, done }),
          onOutput: (output) => onResult(toResult(output)),
        }
      );
    } catch (error) {
      if (!cancelled.current) {
        console.error('Advanced conversion failed', error);
        setMessage(
          'Conversion failed. A very large file can run out of browser memory; try a shorter or smaller clip.'
        );
        // A run that threw (rather than returning an error code) may have
        // left the core broken, so start the next one on a fresh core.
        restartCore(manager);
      }
    } finally {
      setJob(null);
      onBusyChange(false);
    }
  };

  const cancel = () => {
    cancelled.current = true;
    setMessage('Cancelled.');
    restartCore(ffmpegRef.current);
  };

  useClipShortcuts(
    { convert: () => void convert() },
    { enabled: canConvert, scope: editor }
  );

  if (!clip) {
    return results.length > 0 ? (
      <div className='w-full max-w-md rounded-md bg-secondary-dg p-4 shadow-glow-secondary-dg'>
        <SessionResults results={results} />
      </div>
    ) : null;
  }

  const busy = job !== null;
  const progress = job ? (job.index + job.done) / job.total : 0;

  return (
    <div
      ref={editor}
      className='grid w-full max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start'
    >
      <div className='flex min-w-0 flex-col gap-3 rounded-md bg-secondary-dg p-3 shadow-glow-secondary-dg'>
        <div className='flex items-center justify-between gap-2'>
          <p className='truncate' title={clip.file.name}>
            {truncateText(clip.file.name, 40)}
          </p>
          <button
            type='button'
            className='text-foreground/80 hover:text-foreground disabled:opacity-50'
            disabled={busy}
            aria-label={`Remove ${clip.file.name}`}
            onClick={onRemove}
          >
            <IoIosCloseCircle />
          </button>
        </div>
        <LargeFileWarning file={clip.file} />
        <VideoTrimmer
          fileData={clip}
          disabled={busy}
          card={editor}
          videoMaxHeight={420}
          playbackRate={settings.speed}
          sideways={isSideways(settings.rotation)}
          onChange={onTrimChange}
          onCropChange={onCropChange}
          onMediaLoaded={(next) => {
            setMedia(next);
            setMediaFile(clip.file);
          }}
        />
      </div>
      <aside
        aria-label='Output settings'
        className='flex min-w-0 flex-col gap-4 rounded-md bg-secondary-dg p-3 text-left shadow-glow-secondary-dg'
      >
        <AdvancedPreview
          video={loaded?.video ?? null}
          crop={clip.crop}
          settings={settings}
          size={size}
          seconds={seconds}
          frames={frames}
          largeGif={largeGif}
        />
        <fieldset disabled={busy} className='disabled:opacity-60'>
          <legend className='sr-only'>Output settings</legend>
          <AdvancedSettingsForm
            settings={settings}
            onChange={onSettingsChange}
            outputWidth={size?.width ?? null}
            nativeWidth={size?.native ?? null}
            hasAudio={loaded?.hasAudio ?? null}
          />
        </fieldset>
        <div className='flex flex-col gap-2'>
          {busy ? (
            <>
              <div
                role='progressbar'
                aria-label='Conversion progress'
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className='relative h-11 overflow-hidden rounded-md bg-background-dg'
              >
                <div
                  className='absolute inset-y-0 left-0 bg-primary-dg/70 transition-[width]'
                  style={{ width: `${progress * 100}%` }}
                />
                <p className='relative grid h-full place-items-center text-sm font-semibold'>
                  {progressText(job)}
                </p>
              </div>
              <button
                type='button'
                className='h-9 rounded-md border border-foreground-dg/25 text-sm hover:bg-foreground-dg/10'
                onClick={cancel}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type='button'
              className='rounded-md bg-primary-dg px-4 py-3 font-semibold hover:bg-primary-dg/80 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={!canConvert}
              onClick={() => void convert()}
            >
              {settings.fileTypes.length === 0
                ? 'Pick a file type to save as'
                : `Convert to ${fileTypeOrder
                    .filter((type) => settings.fileTypes.includes(type))
                    .map((type) => fileTypeInfo[type].label)
                    .join(' + ')}`}
            </button>
          )}
          {overMemoryLimit && memoryLimit !== null && (
            <p role='alert' className='text-sm text-amber-200'>
              {memoryHolder(settings.direction)} keeps every frame in browser
              memory, so this selection is too long to convert here. Trim it to{' '}
              {formatClipTime(Math.floor(memoryLimit * 100) / 100)} or less, or
              lower the width or frame rate.
            </p>
          )}
          {message && (
            <p role='status' className='text-sm text-foreground-dg/80'>
              {message}
            </p>
          )}
        </div>
        <SessionResults results={results} />
      </aside>
    </div>
  );
}

/** What holds the frames: the direction, or else the GIF's palette pass. */
function memoryHolder(direction: AdvancedSettings['direction']): string {
  if (direction === 'reverse') return 'Reverse';
  if (direction === 'boomerang') return 'Boomerang';
  return 'Making a GIF';
}

function progressText(job: Job | null): string {
  if (!job) return '';
  const label = fileTypeInfo[job.fileType].label;
  const count = job.total > 1 ? ` (${job.index + 1}/${job.total})` : '';
  // A GIF's palette pass reads every frame before the first is written.
  if (job.done === 0)
    return `Making ${label}${count}${job.fileType === 'gif' ? ', analysing colours' : ''}…`;
  return `Making ${label}${count} ${Math.round(job.done * 100)}%`;
}

/** Cancel and failure recovery: the old core stops mid-run, a new one loads. */
function restartCore(manager: FFmpegManager) {
  manager.terminate();
  void manager
    .load()
    .catch((error) => console.error('Failed to reload FFmpeg', error));
}

function toResult(output: SinglePassOutput): SessionResult {
  const id = `result-${++resultId}`;
  if ('failed' in output) return { id, fileType: output.fileType, failed: true };
  return {
    id,
    fileType: output.fileType,
    name: output.name,
    url: URL.createObjectURL(output.blob),
    size: output.blob.size,
  };
}

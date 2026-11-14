import { ClipCrop } from '@/lib/types/discordgifs';
import type { Size } from './output-preview';

/**
 * Advanced mode's encoded output. Called "file type" because "output format"
 * already names a simple-mode preset.
 */
export type FileType = 'gif' | 'webp' | 'mp4';

export const fileTypeOrder: readonly FileType[] = ['gif', 'webp', 'mp4'];

export const fileTypeInfo: Record<
  FileType,
  { label: string; extension: string; mimeType: string; note: string }
> = {
  gif: {
    label: 'GIF',
    extension: '.gif',
    mimeType: 'image/gif',
    note: 'Works everywhere',
  },
  webp: {
    label: 'WebP',
    extension: '.webp',
    mimeType: 'image/webp',
    note: 'Smaller, sharper',
  },
  mp4: {
    label: 'MP4',
    extension: '.mp4',
    mimeType: 'video/mp4',
    note: 'Tiny, can have sound',
  },
};

export type GifDither = 'sierra2_4a' | 'floyd_steinberg' | 'bayer' | 'none';

export const gifDitherOptions: ReadonlyArray<{
  value: GifDither;
  label: string;
}> = [
  { value: 'sierra2_4a', label: 'Smooth (recommended)' },
  { value: 'floyd_steinberg', label: 'Fine grain' },
  { value: 'bayer', label: 'Pattern (smallest files)' },
  { value: 'none', label: 'None (flat colours)' },
];

/** Times an animation plays; 0 is forever. */
export const playsOptions: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'Forever' },
  { value: 1, label: 'Play once' },
  { value: 2, label: 'Play twice' },
  { value: 3, label: 'Play 3 times' },
];

/**
 * Explicit user choices. Nothing here targets a file size, and none of it
 * feeds the simple-mode presets, whose Quality policy is scale-only.
 */
export type AdvancedSettings = {
  /** Output width before capping at the crop, or the crop's own width. */
  width: number | 'original';
  fps: number;
  fileTypes: FileType[];
  gifColors: number;
  gifDither: GifDither;
  /** Applies to GIF and WebP; MP4 players decide looping themselves. */
  plays: number;
  webpQuality: number;
  keepSound: boolean;
};

export const widthChoices = [240, 320, 400, 480, 640] as const;

export const settingLimits = {
  width: { min: 16, max: 4096 },
  fps: { min: 1, max: 60 },
  gifColors: { min: 2, max: 256 },
  webpQuality: { min: 1, max: 100 },
} as const;

export const defaultAdvancedSettings: AdvancedSettings = {
  width: 480,
  fps: 15,
  fileTypes: ['gif'],
  gifColors: 256,
  gifDither: 'sierra2_4a',
  plays: 0,
  webpQuality: 80,
  keepSound: false,
};

export function clampSetting(
  name: keyof typeof settingLimits,
  value: number
): number {
  const { min, max } = settingLimits[name];
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** H.264 needs even sides; rounding down keeps the width within the crop. */
export function evenDown(value: number): number {
  return Math.max(2, Math.floor(value / 2) * 2);
}

/**
 * Source pixels FFmpeg's crop filter keeps. It truncates `iw*fraction`, so
 * this does too, which keeps the preview's numbers equal to the file's.
 */
export function croppedSourceSize(
  crop: ClipCrop | undefined,
  frame: Size
): Size {
  const fraction = crop ?? { x: 0, y: 0, width: 1, height: 1 };
  return {
    width: Math.max(1, Math.floor(frame.width * fraction.width)),
    height: Math.max(1, Math.floor(frame.height * fraction.height)),
  };
}

/**
 * Exact encoded size. The width is even and never wider than the crop; the
 * height follows from `scale=W:-2`, which rounds to the nearest even number.
 */
export function outputSize(
  width: AdvancedSettings['width'],
  cropped: Size
): Size & { native: number } {
  const native = evenDown(cropped.width);
  const outWidth = width === 'original' ? native : Math.min(evenDown(width), native);
  const height = Math.max(
    2,
    Math.round((outWidth * cropped.height) / cropped.width / 2) * 2
  );
  return { width: outWidth, height, native };
}

export function frameCount(seconds: number, fps: number): number {
  return Math.max(1, Math.round(seconds * fps));
}

/**
 * Gif Studio's threshold: about 300 frames at 480 × 270. Past it a GIF is
 * usually tens of megabytes and slow to encode in the browser.
 */
export function isLargeGif(size: Size, frames: number): boolean {
  return size.width * size.height * frames > 480 * 270 * 300;
}

export function singlePassDownloadName(
  originalName: string,
  fileType: FileType
): string {
  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  return `${baseName}${fileTypeInfo[fileType].extension}`;
}

/**
 * Whether the clip has a sound track, or null when this browser can't tell.
 * Browsers expose this differently: Safari lists `audioTracks`, Firefox has
 * `mozHasAudio`, and Chrome adds an audio track to a captured stream only
 * when the media has one.
 */
export function clipHasAudio(video: HTMLVideoElement): boolean | null {
  const media = video as HTMLVideoElement & {
    audioTracks?: { length: number };
    mozHasAudio?: boolean;
    captureStream?: () => MediaStream;
  };
  if (media.audioTracks) return media.audioTracks.length > 0;
  if (typeof media.mozHasAudio === 'boolean') return media.mozHasAudio;
  if (typeof media.captureStream === 'function') {
    try {
      const stream = media.captureStream();
      const hasAudio = stream.getAudioTracks().length > 0;
      for (const track of stream.getTracks()) track.stop();
      return hasAudio;
    } catch {
      return null;
    }
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

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

/** Clockwise quarter turns, in degrees. */
export type Rotation = 0 | 90 | 180 | 270;

/**
 * Forward plays the selection as recorded; Boomerang plays it forward, then
 * backward, so the file is twice as long.
 */
export type Direction = 'forward' | 'reverse' | 'boomerang';

export const directionOptions: ReadonlyArray<{
  value: Direction;
  label: string;
}> = [
  { value: 'forward', label: 'Forward' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'boomerang', label: 'Boomerang' },
];

/** Gif Studio's speed slider steps. */
export const speedSteps = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.5, 3,
] as const;

/** FFmpeg's `atempo` keeps sound in step only between these speeds. */
const soundSpeedRange = { min: 0.5, max: 2 } as const;

/**
 * Explicit user choices. Nothing here targets a file size, and none of it
 * feeds the simple-mode presets, whose Quality policy is scale-only.
 */
export type AdvancedSettings = {
  /** Output width before capping at the crop, or the crop's own width. */
  width: number | 'original';
  fps: number;
  /** Playback speed; one of `speedSteps`. */
  speed: number;
  direction: Direction;
  rotation: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
  /** Caption lines; blank draws nothing (`captions.ts`). */
  topText: string;
  bottomText: string;
  /** Caption size as a percentage of the output's shorter side. */
  captionSize: number;
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
  captionSize: { min: 5, max: 30 },
} as const;

export const defaultAdvancedSettings: AdvancedSettings = {
  width: 480,
  fps: 15,
  speed: 1,
  direction: 'forward',
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  topText: '',
  bottomText: '',
  captionSize: 12,
  fileTypes: ['gif'],
  gifColors: 256,
  gifDither: 'sierra2_4a',
  plays: 0,
  webpQuality: 80,
  keepSound: false,
};

/**
 * Gif Studio starts each clip unrotated, unflipped, forward and uncaptioned,
 * since those suit one recording; width, timing, quality, speed and caption
 * size carry over.
 */
export function forNewClip(settings: AdvancedSettings): AdvancedSettings {
  return {
    ...settings,
    direction: defaultAdvancedSettings.direction,
    rotation: defaultAdvancedSettings.rotation,
    flipHorizontal: defaultAdvancedSettings.flipHorizontal,
    flipVertical: defaultAdvancedSettings.flipVertical,
    topText: defaultAdvancedSettings.topText,
    bottomText: defaultAdvancedSettings.bottomText,
  };
}

export function rotate(rotation: Rotation, turn: 'left' | 'right'): Rotation {
  return ((rotation + (turn === 'right' ? 90 : 270)) % 360) as Rotation;
}

/** A quarter turn swaps the output's width and height. */
export function isSideways(rotation: Rotation): boolean {
  return rotation % 180 !== 0;
}

/**
 * Why MP4 sound can't follow these settings, or null when it can: `atempo`
 * keeps it in step only between 0.5× and 2×, and nothing plays sound backward.
 */
export function soundDropReason(
  settings: Pick<AdvancedSettings, 'speed' | 'direction'>
): string | null {
  if (settings.direction !== 'forward')
    return `No sound in ${settings.direction === 'reverse' ? 'Reverse' : 'Boomerang'}.`;
  if (
    settings.speed < soundSpeedRange.min ||
    settings.speed > soundSpeedRange.max
  )
    return `No sound at ${formatSpeed(settings.speed)}; it keeps up from ${formatSpeed(soundSpeedRange.min)} to ${formatSpeed(soundSpeedRange.max)}.`;
  return null;
}

export function formatSpeed(speed: number): string {
  return `${speed}×`;
}

/** Seconds of output: speed changes the length and Boomerang doubles it. */
export function outputSeconds(
  selectionSeconds: number,
  settings: Pick<AdvancedSettings, 'speed' | 'direction'>
): number {
  return (
    (selectionSeconds / settings.speed) *
    (settings.direction === 'boomerang' ? 2 : 1)
  );
}

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

/** The crop as it leaves the rotate step, which runs before scaling. */
export function orientedSize(size: Size, rotation: Rotation): Size {
  return isSideways(rotation)
    ? { width: size.height, height: size.width }
    : size;
}

/**
 * Exact encoded size. The width is even and never wider than the rotated
 * crop; the height follows from `scale=W:-2`, which rounds to the nearest even
 * number.
 */
export function outputSize(
  width: AdvancedSettings['width'],
  cropped: Size,
  rotation: Rotation = 0
): Size & { native: number } {
  const turned = orientedSize(cropped, rotation);
  const native = evenDown(turned.width);
  const outWidth = width === 'original' ? native : Math.min(evenDown(width), native);
  const height = Math.max(
    2,
    Math.round((outWidth * turned.height) / turned.width / 2) * 2
  );
  return { width: outWidth, height, native };
}

export function frameCount(seconds: number, fps: number): number {
  return Math.max(1, Math.round(seconds * fps));
}

/**
 * Decoded-frame bytes a conversion may hold at once in FFmpeg's Wasm memory,
 * whose heap stops at 2 GiB in the shipped core. Past it FFmpeg stalls rather
 * than failing. Measured 2026-11-14; the product doc's *Frame-memory limit*
 * has the runs behind these numbers.
 */
export const frameMemoryBudget = {
  desktop: 1_200_000_000,
  phone: 300_000_000,
} as const;

/**
 * Frame copies held at the peak, or 0 when frames stream through. A GIF
 * queues every frame for `paletteuse`, which waits for the palette made from
 * the last one; `reverse` keeps another copy until the input ends, and
 * Boomerang adds its forward half to the GIF queue. Frames are counted at 4
 * bytes a pixel, the GIF path's RGB, which overstates the YUV that MP4 and
 * WebP hold, on the safe side.
 */
function heldCopies(direction: Direction, fileTypes: readonly FileType[]) {
  const gif = fileTypes.includes('gif');
  if (direction === 'forward') return gif ? 1 : 0;
  if (!gif) return 1;
  return direction === 'boomerang' ? 3 : 2;
}

/**
 * The longest selection, in seconds, these settings may convert within
 * `budget`, or null when no frames are held (Forward without a GIF).
 */
export function frameMemoryLimitSeconds(
  size: Size,
  settings: Pick<AdvancedSettings, 'fps' | 'speed' | 'direction' | 'fileTypes'>,
  budget: number
): number | null {
  const copies = heldCopies(settings.direction, settings.fileTypes);
  if (copies === 0) return null;
  const frameBytes = size.width * size.height * 4;
  const frames = budget / (frameBytes * copies);
  return (frames / settings.fps) * settings.speed;
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

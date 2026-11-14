import { ClipCrop, ClipTrim } from '@/lib/types/discordgifs';
import {
  AdvancedSettings,
  Direction,
  FileType,
  GifDither,
  Rotation,
  soundDropReason,
} from './advanced';
import { cropFilter, trimInput } from './ffmpeg-commands';

type SinglePassCommandOptions = {
  inputName: string;
  outputName: string;
  fileType: FileType;
  settings: AdvancedSettings;
  crop?: ClipCrop;
  trim?: ClipTrim;
  /** Even output width, or null to keep the cropped width when it is unknown. */
  width: number | null;
  /**
   * Only honoured for MP4, and only when the clip has sound to keep and the
   * speed and direction let it keep up.
   */
  keepSound: boolean;
  /**
   * FFmpeg file name of the caption image: a transparent PNG at the exact
   * output size (`renderCaptionImage`), or undefined for no captions.
   */
  captionsName?: string;
};

/**
 * One FFmpeg run per file type, ported from Gif Studio's `buildFilter` and
 * `ffArgs`, in its order: crop, rotate, flips, speed, `fps`, a lanczos scale,
 * captions, then direction. Cropping and dropping frames first leaves later filters
 * as few pixels and frames as possible, and reversing last holds the
 * smallest frames, since `reverse` keeps every one of them in memory.
 */
export function buildSinglePassCommand({
  inputName,
  outputName,
  fileType,
  settings,
  crop,
  trim,
  width,
  keepSound,
  captionsName,
}: SinglePassCommandOptions): string[] {
  const filters = [
    ...rotateFilters(settings.rotation),
    ...(settings.flipHorizontal ? ['hflip'] : []),
    ...(settings.flipVertical ? ['vflip'] : []),
    ...(settings.speed !== 1 ? [`setpts=PTS/${settings.speed}`] : []),
    `fps=${settings.fps}`,
    `scale=${width ?? 'trunc(iw/2)*2'}:-2:flags=lanczos`,
  ];
  const video = `[0:v]${cropFilter(crop)}${filters.join(',')}${captionsName ? captionOverlay(fileType) : ''}${directionFilter(settings.direction)}`;
  const input = [
    ...trimInput(inputName, trim),
    ...(captionsName ? ['-i', captionsName] : []),
  ];

  if (fileType === 'gif') {
    // stats_mode=diff and diff_mode=rectangle spend the palette and the
    // re-encoding on what moves, which keeps static backgrounds clean.
    const graph = `${video},split[a][b];[a]palettegen=max_colors=${settings.gifColors}:stats_mode=diff[p];[b][p]paletteuse=${ditherOption(settings.gifDither)}:diff_mode=rectangle[out]`;
    return [
      ...input,
      '-filter_complex',
      graph,
      '-map',
      '[out]',
      '-loop',
      String(gifLoop(settings.plays)),
      outputName,
    ];
  }

  if (fileType === 'webp') {
    // The core has no libwebp_anim; libwebp frames through the webp muxer
    // still make an animated WebP, and the muxer writes the loop count.
    return [
      ...input,
      '-filter_complex',
      `${video}[out]`,
      '-map',
      '[out]',
      '-c:v',
      'libwebp',
      '-lossless',
      '0',
      '-quality',
      String(settings.webpQuality),
      '-compression_level',
      '4',
      '-loop',
      String(settings.plays),
      outputName,
    ];
  }

  const sound = keepSound && soundDropReason(settings) === null;
  return [
    ...input,
    '-filter_complex',
    `${video},format=yuv420p[out]`,
    '-map',
    '[out]',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-movflags',
    '+faststart',
    // `?` keeps a clip without sound from failing the whole run.
    ...(sound
      ? [
          '-map',
          '0:a:0?',
          '-c:a',
          'aac',
          '-b:a',
          '160k',
          ...(settings.speed !== 1 ? ['-af', `atempo=${settings.speed}`] : []),
          '-shortest',
        ]
      : ['-an']),
    outputName,
  ];
}

/**
 * Composites the caption image (input 1) after the scale, so it lands on
 * output pixels the way the preview draws it, and after the turn and flips,
 * so it stays upright. A single image repeats over every frame (overlay's
 * default `eof_action=repeat`); centring it rather than pinning it at 0:0
 * keeps a one-row rounding difference from shifting a caption off the edge.
 * A GIF composites in RGB, which its palette needs anyway, so the outline
 * skips a 4:2:0 round trip; MP4 and WebP encode 4:2:0 regardless.
 */
function captionOverlay(fileType: FileType): string {
  const format = fileType === 'gif' ? ':format=rgb' : '';
  return `[scaled];[scaled][1:v]overlay=(W-w)/2:(H-h)/2${format}`;
}

/** `transpose=1` turns clockwise; a half turn is both flips. */
function rotateFilters(rotation: Rotation): string[] {
  if (rotation === 90) return ['transpose=1'];
  if (rotation === 270) return ['transpose=2'];
  if (rotation === 180) return ['hflip', 'vflip'];
  return [];
}

/**
 * Appended to the video chain, which later steps continue with `,`. Boomerang
 * plays the frames forward, then a reversed copy, as one stream.
 */
function directionFilter(direction: Direction): string {
  if (direction === 'reverse') return ',reverse';
  if (direction === 'boomerang')
    return ',split[f0][r0];[r0]reverse[r1];[f0][r1]concat=n=2:v=1:a=0';
  return '';
}

function ditherOption(dither: GifDither): string {
  return dither === 'bayer' ? 'dither=bayer:bayer_scale=3' : `dither=${dither}`;
}

/** The GIF muxer counts repeats, not plays: -1 plays once, 0 loops forever. */
function gifLoop(plays: number): number {
  if (plays === 0) return 0;
  return plays === 1 ? -1 : plays - 1;
}

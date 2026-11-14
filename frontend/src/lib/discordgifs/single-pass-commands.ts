import { ClipCrop, ClipTrim } from '@/lib/types/discordgifs';
import { AdvancedSettings, FileType, GifDither } from './advanced';
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
  /** Only honoured for MP4, and only when the clip has sound to keep. */
  keepSound: boolean;
};

/**
 * One FFmpeg run per file type, ported from Gif Studio's `buildFilter` and
 * `ffArgs`: crop, then `fps`, then a lanczos scale, so later filters work on
 * as few pixels and frames as possible.
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
}: SinglePassCommandOptions): string[] {
  const scale = `scale=${width ?? 'trunc(iw/2)*2'}:-2:flags=lanczos`;
  const video = `[0:v]${cropFilter(crop)}fps=${settings.fps},${scale}`;
  const input = trimInput(inputName, trim);

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
    ...(keepSound
      ? ['-map', '0:a:0?', '-c:a', 'aac', '-b:a', '160k', '-shortest']
      : ['-an']),
    outputName,
  ];
}

function ditherOption(dither: GifDither): string {
  return dither === 'bayer' ? 'dither=bayer:bayer_scale=3' : `dither=${dither}`;
}

/** The GIF muxer counts repeats, not plays: -1 plays once, 0 loops forever. */
function gifLoop(plays: number): number {
  if (plays === 0) return 0;
  return plays === 1 ? -1 : plays - 1;
}

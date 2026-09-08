import { ClipCrop, ClipTrim } from '@/lib/types/discordgifs';
import { ConversionTarget } from './conversion-target';

type OutputCommandOptions = {
  crop?: ClipCrop;
  trim?: ClipTrim;
  inputName: string;
  outputName: string;
  target: ConversionTarget;
  width: number;
};

export function buildOutputCommand({
  crop,
  trim,
  inputName,
  outputName,
  target,
  width,
}: OutputCommandOptions): string[] {
  const paletteFilter = `${cropFilter(crop)}scale=${width}:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2_4a`;

  if (target.format === 'apng') {
    return [
      ...trimInput(inputName, trim),
      '-f',
      'apng',
      '-plays',
      '0',
      '-vf',
      paletteFilter,
      '-compression_level',
      '9',
      outputName,
    ];
  }

  return [
    ...trimInput(inputName, trim),
    '-filter_complex',
    `[0:v] ${paletteFilter}`,
    outputName,
  ];
}

type OptimizedInputCommandOptions = {
  crop?: ClipCrop;
  trim?: ClipTrim;
  inputName: string;
  outputName: string;
  target: ConversionTarget;
};

export function buildOptimizedInputCommand({
  crop,
  trim,
  inputName,
  outputName,
  target,
}: OptimizedInputCommandOptions): string[] {
  return [
    ...trimInput(inputName, trim),
    '-b:v',
    '0.5M',
    '-an',
    '-vf',
    `${cropFilter(crop)}scale=${target.startingWidth}:-2`,
    '-preset',
    'veryfast',
    outputName,
  ];
}

/** Crop before scaling so retries spend their work on the retained image. */
function cropFilter(crop?: ClipCrop): string {
  return crop
    ? `crop='max(1,iw*${crop.width})':'max(1,ih*${crop.height})':iw*${crop.x}:ih*${crop.y}:exact=1,`
    : '';
}

export function buildDownloadName(
  originalName: string,
  target: ConversionTarget
): string {
  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  return `${baseName}${target.filenameSuffix}${target.extension}`;
}

/** Seek before decoding so preprocessing and size retries only encode the selection. */
function trimInput(inputName: string, trim?: ClipTrim): string[] {
  return trim
    ? [
        '-ss', String(trim.start),
        '-t', String(trim.end - trim.start),
        '-i', inputName,
      ]
    : ['-i', inputName];
}

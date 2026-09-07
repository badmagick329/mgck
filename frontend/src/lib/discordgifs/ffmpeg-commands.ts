import { ClipTrim } from '@/lib/types/discordgifs';
import { ConversionTarget } from './conversion-target';

type OutputCommandOptions = {
  trim?: ClipTrim;
  inputName: string;
  outputName: string;
  target: ConversionTarget;
  width: number;
};

export function buildOutputCommand({
  trim,
  inputName,
  outputName,
  target,
  width,
}: OutputCommandOptions): string[] {
  const paletteFilter = `scale=${width}:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2_4a`;

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
  trim?: ClipTrim;
  inputName: string;
  outputName: string;
  target: ConversionTarget;
};

export function buildOptimizedInputCommand({
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
    `scale=${target.startingWidth}:-2`,
    '-preset',
    'veryfast',
    outputName,
  ];
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

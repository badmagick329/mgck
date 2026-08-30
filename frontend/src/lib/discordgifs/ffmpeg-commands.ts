import { ConversionTarget } from './conversion-target';

type OutputCommandOptions = {
  inputName: string;
  outputName: string;
  target: ConversionTarget;
  width: number;
};

export function buildOutputCommand({
  inputName,
  outputName,
  target,
  width,
}: OutputCommandOptions): string[] {
  const paletteFilter = `scale=${width}:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2_4a`;

  if (target.format === 'apng') {
    return [
      '-i',
      inputName,
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
    '-i',
    inputName,
    '-filter_complex',
    `[0:v] ${paletteFilter}`,
    outputName,
  ];
}

type OptimizedInputCommandOptions = {
  inputName: string;
  outputName: string;
  target: ConversionTarget;
};

export function buildOptimizedInputCommand({
  inputName,
  outputName,
  target,
}: OptimizedInputCommandOptions): string[] {
  return [
    '-i',
    inputName,
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

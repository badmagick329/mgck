export type ScaleCalculationConfig = {
  changeSize: number;
  minChangeSize: number;
  sizeLimit: number;
  sizeMargin: number;
  startingWidth: number;
  minWidth: number;
};

type ConversionTargetBase = ScaleCalculationConfig & {
  id: string;
  filenameSuffix: string;
};

type GifTarget = {
  format: 'gif';
  extension: '.gif';
  mimeType: 'image/gif';
};

type ApngTarget = {
  format: 'apng';
  extension: '.png';
  mimeType: 'image/png';
};

export type ConversionTarget = ConversionTargetBase & (GifTarget | ApngTarget);

export type ConversionFormat = ConversionTarget['format'];

export const conversionTargetPresets = {
  emote: {
    id: 'emote',
    format: 'gif',
    extension: '.gif',
    mimeType: 'image/gif',
    filenameSuffix: '_emote',
    changeSize: 40,
    minChangeSize: 1,
    sizeLimit: 256 * 1024,
    sizeMargin: 0.03,
    startingWidth: 80,
    minWidth: 10,
  },
  sticker: {
    id: 'sticker',
    format: 'apng',
    extension: '.png',
    mimeType: 'image/png',
    filenameSuffix: '_sticker',
    changeSize: 40,
    minChangeSize: 1,
    sizeLimit: 512 * 1024,
    sizeMargin: 0.08,
    startingWidth: 140,
    minWidth: 30,
  },
} as const satisfies Record<string, ConversionTarget>;

export type ConversionPresetId = keyof typeof conversionTargetPresets;

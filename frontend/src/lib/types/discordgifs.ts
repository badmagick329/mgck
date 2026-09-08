import {
  ConversionFormat,
  ConversionPresetId,
  ConversionTarget,
} from '@/lib/discordgifs/conversion-target';

export type FFmpegLogEvent = {
  type: string;
  message: string;
};
export type FFmpegProgressEvent = {
  progress: number;
  time: number;
};
export type FFmpegFileDataOutput = {
  name: string;
  url: string;
  type: string;
  finalSize?: number;
  targetId?: string;
  format?: ConversionFormat;
  mimeType?: ConversionTarget['mimeType'];
  width?: number;
};
export type FFmpegConversionResult = {
  url: string;
  outputName: string;
  finalSize: number;
  targetId: string;
  format: ConversionFormat;
  mimeType: ConversionTarget['mimeType'];
  width: number;
};
export type FFmpegConversionState =
  | 'idle'
  | 'busy'
  | 'optimizing'
  | 'done'
  | 'converting';
export type FileDurationState =
  | { status: 'checking' }
  | { status: 'known'; seconds: number }
  | { status: 'unknown' };
export type ClipTrim = { start: number; end: number };
/** Fractions of the displayed source frame keep crops independent of preview size. */
export type ClipCrop = { x: number; y: number; width: number; height: number };
export type FFmpegFileData = {
  crop?: ClipCrop;
  trim?: ClipTrim;
  file: File;
  outputs: Array<FFmpegFileDataOutput>;
  outputTypes: Array<ConversionPresetId>;
  progress: number;
  size: number;
  currentTarget: ConversionTarget;
  conversionState: FFmpegConversionState;
  duration: FileDurationState;
};

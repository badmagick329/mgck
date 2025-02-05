import { SizeInfo, sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';

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
};
export type FFmpegConversionState =
  | 'idle'
  | 'busy'
  | 'optimizing'
  | 'done'
  | 'converting';
export type FFmpegFileData = {
  file: File;
  outputs: Array<FFmpegFileDataOutput>;
  outputTypes: Array<keyof typeof sizeInfo>;
  progress: number;
  size: number;
  currentTarget: SizeInfo;
  conversionState: FFmpegConversionState;
};

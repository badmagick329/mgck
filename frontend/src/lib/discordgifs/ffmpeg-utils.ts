import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import { FFmpegLogEvent, FFmpegProgressEvent } from '../types';
import {
  FrameSize,
  FrameSizeCalculator,
  SizeInfo,
  sizeInfo,
} from './frame-size-calculator';

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

export async function toEmote({
  file,
  ffmpeg,
  logMessageHandler,
  progressHandler,
  setNewSize,
  setIsConverting,
  setIsDone,
}: {
  file: File;
  ffmpeg: FFmpeg;
  logMessageHandler?: (e: FFmpegLogEvent) => void;
  progressHandler?: (e: FFmpegProgressEvent) => void;
  setNewSize?: (size: number) => void;
  setIsConverting?: (converting: boolean) => void;
  setIsDone?: (done: boolean) => void;
}) {
  await ffmpeg.writeFile(file.name, await fetchFile(file));
  const fileNameWithoutExt = file.name.includes('.')
    ? file.name.split('.')[0]
    : file.name;
  const outputName = `${fileNameWithoutExt}_out.gif`;

  registerHandlers(ffmpeg, logMessageHandler, progressHandler);
  let blob = await runConversion({
    ffmpeg,
    file,
    outputName,
    info: sizeInfo.emote,
    setIsConverting,
    setNewSize,
  });
  unregisterHandlers(ffmpeg, logMessageHandler, progressHandler);
  setIsDone && setIsDone(true);
  setIsConverting && setIsConverting(false);

  // TODO: Handle case when conversion fails
  const url = URL.createObjectURL(blob!);
  return {
    url,
    outputName,
  };
}

async function runConversion({
  ffmpeg,
  file,
  outputName,
  info,
  setNewSize,
  setIsConverting,
}: {
  ffmpeg: FFmpeg;
  file: File;
  outputName: string;
  info: SizeInfo;
  setNewSize: ((size: number) => void) | undefined;
  setIsConverting: ((converting: boolean) => void) | undefined;
}): Promise<Blob | null> {
  const calculator = new FrameSizeCalculator(info);
  let size: FrameSize | null = {
    width: calculator.info.startingWidth,
    height: calculator.info.startingHeight,
  };
  let blob = null;
  setIsConverting && setIsConverting(true);
  let iteration = 0;

  const startTime = performance.now();
  while (size !== null) {
    if (calculator.isDone) {
      break;
    }
    const ffmpegCmd = emoteCmd(file.name, size.width, size.height, outputName);
    const ret = await ffmpeg.exec(ffmpegCmd);
    // console.log('executed', ret);
    const data = await ffmpeg.readFile(outputName);
    blob = new Blob([data], { type: 'gif' });
    setNewSize && setNewSize(blob.size);
    size = calculator.getNewFrameSize(blob.size);
    // console.log(`iteration: ${++iteration}. size`, size);
    ++iteration;
  }
  console.log(
    `iteration: ${iteration}. time taken ${((performance.now() - startTime) / 1000).toFixed(2)}s`
  );

  return blob;
}

function registerHandlers(
  ffmpeg: FFmpeg,
  logMessageHandler?: (e: FFmpegLogEvent) => void,
  progressHandler?: (e: FFmpegProgressEvent) => void
) {
  if (logMessageHandler) {
    ffmpeg.on('log', logMessageHandler);
  }
  if (progressHandler) {
    ffmpeg.on('progress', progressHandler);
  }
}

function unregisterHandlers(
  ffmpeg: FFmpeg,
  logMessageHandler?: (e: FFmpegLogEvent) => void,
  progressHandler?: (e: FFmpegProgressEvent) => void
) {
  if (logMessageHandler) {
    ffmpeg.off('log', logMessageHandler);
  }
  if (progressHandler) {
    ffmpeg.off('progress', progressHandler);
  }
}

function emoteCmd(
  input: string,
  width: number,
  height: number,
  output: string
) {
  return [
    '-y',
    '-i',
    input,
    '-filter_complex',
    `[0:v] scale=${width}:${height} [a];[a] split [b][c];[b] palettegen [p];[c][p] paletteuse`,
    output,
  ];
}

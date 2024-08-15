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

export async function toSticker({
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
  let outputName = `${fileNameWithoutExt}_out`;

  registerHandlers(ffmpeg, logMessageHandler, progressHandler);
  let { blob, outputName: newName } = await runConversion({
    ffmpeg,
    file,
    outputName,
    info: sizeInfo.sticker,
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
    outputName: newName,
  };
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
  let outputName = `${fileNameWithoutExt}_out`;

  registerHandlers(ffmpeg, logMessageHandler, progressHandler);
  let { blob, outputName: newName } = await runConversion({
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
    outputName: newName,
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
}): Promise<{
  blob: Blob | null;
  outputName: string;
}> {
  const calculator = new FrameSizeCalculator(info);
  const ext =
    calculator.info.sizeLimit === sizeInfo.sticker.sizeLimit ? '.png' : '.gif';
  outputName = `${outputName}${ext}`;
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
    const ffmpegCmd =
      ext === '.png'
        ? apngCmd(file.name, size.width, size.height, outputName)
        : gifCmd(file.name, size.width, size.height, outputName);
    const ret = await ffmpeg.exec(ffmpegCmd);
    // console.log('executed', ret);
    const data = await ffmpeg.readFile(outputName);
    blob = new Blob([data], { type: ext.slice(1) });
    setNewSize && setNewSize(blob.size);
    size = calculator.getNewFrameSize(blob.size);
    // console.log(`iteration: ${++iteration}. size`, size);
    ++iteration;
  }
  console.log(
    `iteration: ${iteration}. time taken ${((performance.now() - startTime) / 1000).toFixed(2)}s`
  );

  return {
    blob,
    outputName,
  };
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

function gifCmd(input: string, width: number, height: number, output: string) {
  return [
    '-y',
    '-i',
    input,
    '-filter_complex',
    `[0:v] scale=${width}:-1 [a];[a] split [b][c];[b] palettegen [p];[c][p] paletteuse`,
    output,
  ];
}

function apngCmd(input: string, width: number, height: number, output: string) {
  return [
    '-y',
    '-i',
    input,
    '-f',
    'apng',
    '-plays',
    '0',
    '-vf',
    `scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
    output,
  ];
}

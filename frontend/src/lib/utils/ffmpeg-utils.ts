import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import { FFmpegLogEvent, FFmpegProgressEvent } from '../types';

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

export async function toMp4({
  file,
  ffmpeg,
  logMessageHandler,
  progressHandler,
}: {
  file: File;
  ffmpeg: FFmpeg;
  logMessageHandler?: (e: FFmpegLogEvent) => void;
  progressHandler?: (e: FFmpegProgressEvent) => void;
}) {
  await ffmpeg.writeFile(file.name, await fetchFile(file));
  const fileNameWithoutExt = file.name.includes('.')
    ? file.name.split('.')[0]
    : file.name;
  const outputName = `${fileNameWithoutExt}_out.mp4`;
  const ffmpegCmd = [
    '-i',
    file.name,
    '-crf',
    '18',
    '-c:v',
    'libx264',
    '-c:a',
    'aac',
    '-b:a',
    '96k',
    '-preset',
    'veryfast',
    outputName,
  ];
  console.log('executing', ffmpegCmd);
  registerHandlers(ffmpeg, logMessageHandler, progressHandler);
  const ret = await ffmpeg.exec(ffmpegCmd);
  unregisterHandlers(ffmpeg, logMessageHandler, progressHandler);
  console.log('executed', ret);
  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data], { type: file.type.split('/')[0] });
  const url = URL.createObjectURL(blob);
  return {
    url,
    outputName,
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
  const outputName = `${fileNameWithoutExt}_out.gif`;
  registerHandlers(ffmpeg, logMessageHandler, progressHandler);

  const blob = await emoteToSize(
    ffmpeg,
    file.name,
    outputName,
    'gif',
    setNewSize,
    setIsDone,
    setIsConverting
  );

  const url = URL.createObjectURL(blob);
  return {
    url,
    outputName,
  };
}

async function emoteToSize(
  ffmpeg: FFmpeg,
  filename: string,
  outputName: string,
  fileType: string,
  setNewSize?: (size: number) => void,
  setIsDone?: (done: boolean) => void,
  setIsConverting?: (converting: boolean) => void
) {
  let changeBy = 40;
  const sizeComparisons = [0, 0];
  const sizeLimit = 256 * 1024;
  const lowerBound = sizeLimit - sizeLimit * 0.025;
  let width = 128;
  let height = 128;
  let blob = null;

  setIsConverting && setIsConverting(true);
  do {
    // console.log(`running cmd with ${width} ${height}`);
    const ffmpegCmd = emoteCmd(filename, width, height, outputName);
    const ret = await ffmpeg.exec(ffmpegCmd);
    // console.log('executed', ret);
    const data = await ffmpeg.readFile(outputName);
    blob = new Blob([data], { type: fileType });
    setNewSize && setNewSize(blob.size);
    if (blob.size > lowerBound && blob.size < sizeLimit) {
      break;
    }

    updateSizeComparisons(blob.size, sizeLimit, sizeComparisons);
    if (directionChange(sizeComparisons)) {
      changeBy = Math.round(changeBy / 1.5);
    }
    if (changeBy < 2) {
      if (blob.size >= sizeLimit) {
        width -= changeBy;
        height -= changeBy;
      } else {
        break;
      }
    } else {
      if (blob.size < sizeLimit) {
        width += changeBy;
        height += changeBy;
      } else {
        width -= changeBy;
        height -= changeBy;
      }
    }
  } while (true);

  setIsDone && setIsDone(true);
  setIsConverting && setIsConverting(false);
  return blob;
}

function directionChange(comps: Array<number>) {
  if (comps[0] === 0 || comps[1] === 0) {
    return true;
  }
  return (
    (comps[0] === 1 && comps[1] === -1) || (comps[0] === -1 && comps[1] === 1)
  );
}

function updateSizeComparisons(
  size: number,
  limit: number,
  sizeComparison: Array<number>
) {
  if (size >= limit) {
    if (sizeComparison[1] == 0) {
      sizeComparison[1] = 1;
    } else if (sizeComparison[0] == 0) {
      sizeComparison[0] = 1;
    } else {
      sizeComparison[1] = sizeComparison[0];
      sizeComparison[0] = 1;
    }
  } else {
    if (sizeComparison[1] == 0) {
      sizeComparison[1] = -1;
    } else if (sizeComparison[0] == 0) {
      sizeComparison[0] = -1;
    } else {
      sizeComparison[1] = sizeComparison[0];
      sizeComparison[0] = -1;
    }
  }
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

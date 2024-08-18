import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import { FFmpegLogEvent, FFmpegProgressEvent } from '../types';
import {
  FrameSize,
  FrameSizeCalculator,
  SizeInfo,
  sizeInfo,
} from './frame-size-calculator';

type FFmpegFileConfig = {
  file: File;
  outputNameBase: string;
  info: SizeInfo;
  optimizedInput: boolean;
};

export class FFmpegManager {
  private ffmpeg: FFmpeg | null;
  private fileConfig: FFmpegFileConfig | null;
  private outputType: keyof typeof sizeInfo;
  private logMessageCallback?: (e: FFmpegLogEvent) => void;
  private progressCallback?: (e: FFmpegProgressEvent) => void;
  private newSizeCallback?: (size: number) => void;
  private isConvertingCallback?: (converting: boolean) => void;
  private isDoneCallback?: (done: boolean) => void;

  constructor() {
    this.ffmpeg = null;
    this.fileConfig = null;
    this.outputType = 'emote';
  }

  public async load(): Promise<void> {
    this.ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      ),
    });
  }

  public setFileConfig({
    file,
    info,
  }: Pick<FFmpegFileConfig, 'file' | 'info'>): FFmpegManager {
    let outputType = null;
    for (const [key, val] of Object.entries(sizeInfo)) {
      if (val === info) {
        outputType = key as keyof typeof sizeInfo;
        break;
      }
    }
    if (!outputType) {
      throw new Error('Invalid sizeInfo');
    }
    this.outputType = outputType;
    this.fileConfig = {
      file,
      outputNameBase: this.getOutputNameBase(file.name),
      info,
      optimizedInput: false,
    };
    return this;
  }

  public setLogMessageCallback(cb: (e: FFmpegLogEvent) => void): FFmpegManager {
    this.logMessageCallback = cb;
    return this;
  }

  public setProgressCallback(
    cb: (e: FFmpegProgressEvent) => void
  ): FFmpegManager {
    this.progressCallback = cb;
    return this;
  }

  public setNewSizeCallback(cb: (size: number) => void): FFmpegManager {
    this.newSizeCallback = cb;
    return this;
  }

  public setIsConvertingCallback(
    cb: (converting: boolean) => void
  ): FFmpegManager {
    this.isConvertingCallback = cb;
    return this;
  }

  public setIsDoneCallback(cb: (done: boolean) => void): FFmpegManager {
    this.isDoneCallback = cb;
    return this;
  }

  public terminate(): void {
    if (this.ffmpeg) {
      this.ffmpeg.terminate();
    }
  }

  public async deleteFile(name: string): Promise<void> {
    if (this.ffmpeg) {
      await this.ffmpeg.deleteFile(name);
    }
  }

  public loaded(): boolean {
    return this.ffmpeg !== null;
  }

  public async optimizeInput() {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }
    if (!this.fileConfig) {
      throw new Error('FFmpegContrller config not set');
    }
    const { file } = this.fileConfig;
    if (file.size < 2 * 1024 * 1024) {
      console.log('optimisation not needed');
      return;
    }
    console.log('optimising input');
    await this.ffmpeg.writeFile(file.name, await fetchFile(file));
    const newName = this.newInputName();
    const cmd = this.optimizedInputCommand();
    await this.ffmpeg.exec(cmd);
    const data = await this.ffmpeg.readFile(newName);
    const blob = new Blob([data], { type: 'video/mp4' });
    this.fileConfig.file = new File([blob], newName);
    this.fileConfig.optimizedInput = true;
  }

  private async cleanupOptimizedFile() {
    if (!this.fileConfig) {
      throw new Error('FFmpegManager config not set');
    }
    if (!this.fileConfig.optimizedInput) {
      return;
    }
    try {
      await this.deleteFile(this.fileConfig.file.name);
    } catch (e) {
      console.error('Error deleting optimized file', e);
    }
  }

  public async convert() {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }
    if (!this.fileConfig) {
      throw new Error('FFmpegContrller config not set');
    }

    const { file, info } = this.fileConfig;
    try {
      await this.ffmpeg.readFile(file.name);
    } catch (e) {
      await this.ffmpeg.writeFile(file.name, await fetchFile(file));
    }
    const calculator = new FrameSizeCalculator(info);
    const outputName = this.fullOutputName();
    const blob = await this.run(calculator, outputName);

    // TODO: Handle fail case
    const url = URL.createObjectURL(blob!);
    return {
      url,
      outputName,
      finalSize: blob!.size,
    };
  }

  private async run(calculator: FrameSizeCalculator, outputName: string) {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }
    if (!this.fileConfig) {
      throw new Error('FFmpegContrller config not set');
    }

    const { info } = this.fileConfig;
    let size: FrameSize | null = {
      width: info.startingWidth,
      height: info.startingHeight,
    };
    let blob = null;
    let iteration = 0;

    const startTime = performance.now();
    this.isConvertingCallback && this.isConvertingCallback(true);
    this.logMessageCallback && this.ffmpeg.on('log', this.logMessageCallback);
    this.progressCallback && this.ffmpeg.on('progress', this.progressCallback);
    while (size !== null) {
      if (calculator.isDone) {
        break;
      }
      const ffmpegCmd = this.outputCommand(size.width);
      const ret = await this.ffmpeg.exec(ffmpegCmd);
      // console.log('executed', ret);
      const data = await this.ffmpeg.readFile(outputName);
      blob = new Blob([data], { type: this.ext().slice(1) });
      this.newSizeCallback && this.newSizeCallback(blob.size);
      size = calculator.getNewFrameSize(blob.size);
      // console.log(`iteration: ${++iteration}. size`, size);
      ++iteration;
    }
    console.log(
      `iteration: ${iteration}. time taken ${((performance.now() - startTime) / 1000).toFixed(2)}s`
    );
    this.logMessageCallback && this.ffmpeg.off('log', this.logMessageCallback);
    this.progressCallback && this.ffmpeg.off('progress', this.progressCallback);
    this.isDoneCallback && this.isDoneCallback(true);
    this.isConvertingCallback && this.isConvertingCallback(false);
    this.cleanupOptimizedFile();
    this.fileConfig = null;

    return blob;
  }

  private ext(): string {
    if (!this.fileConfig) {
      throw new Error('FFmpegManager config not set');
    }
    return this.outputType === 'sticker' ? '.png' : '.gif';
  }

  private outputCommand(width: number): Array<string> {
    if (!this.fileConfig) {
      throw new Error('FFmpegManager config not set');
    }
    if (this.outputType === 'sticker') {
      return [
        '-y',
        '-i',
        this.fileConfig.file.name,
        '-f',
        'apng',
        '-plays',
        '0',
        '-vf',
        `scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        `${this.fullOutputName()}`,
      ];
    }
    return [
      '-y',
      '-i',
      this.fileConfig.file.name,
      '-filter_complex',
      `[0:v] scale=${width}:-1 [a];[a] split [b][c];[b] palettegen [p];[c][p] paletteuse`,
      `${this.fullOutputName()}`,
    ];
  }

  private optimizedInputCommand(): Array<string> {
    if (!this.fileConfig) {
      throw new Error('FFmpegManager config not set');
    }
    if (this.outputType === 'sticker') {
      return [
        '-y',
        '-i',
        this.fileConfig.file.name,
        '-b:v',
        '1M',
        '-an',
        '-vf',
        'scale=140:-1',
        '-preset',
        'veryfast',
        `${this.newInputName()}`,
      ];
    }
    return [
      '-y',
      '-i',
      this.fileConfig.file.name,
      '-b:v',
      '1M',
      '-an',
      '-vf',
      'scale=80:-1',
      '-preset',
      'veryfast',
      `${this.newInputName()}`,
    ];
  }

  private fullOutputName(): string {
    if (!this.fileConfig) {
      throw new Error('FFmpegManager config not set');
    }
    return `${this.fileConfig.outputNameBase}${this.ext()}`;
  }

  private newInputName(): string {
    if (!this.fileConfig) {
      throw new Error('FFmpegManager config not set');
    }
    const baseName = this.fileConfig.file.name.slice(
      0,
      this.fileConfig.file.name.lastIndexOf('.')
    );
    if (this.outputType === 'sticker') {
      return `${baseName}_sticker.mp4`;
    }
    return `${baseName}_emote.mp4`;
  }

  private getOutputNameBase(name: string): string {
    const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
    return `${nameWithoutExt}_${this.outputType}`;
  }
}

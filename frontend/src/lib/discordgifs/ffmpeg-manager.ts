import {
  FFmpegConversionState,
  FFmpegLogEvent,
  FFmpegProgressEvent,
} from '@/lib/types/discordgifs';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
  private updateFileConversionStateCallback?: (
    conversionState: FFmpegConversionState
  ) => void;

  constructor() {
    this.ffmpeg = null;
    this.fileConfig = null;
    this.outputType = 'emote';
  }

  public async load(retries = 3): Promise<void> {
    try {
      this.ffmpeg = new FFmpeg();
      const baseURL =
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          'application/wasm'
        ),
      });
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying... Attempts left: ${retries - 1}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.load(retries - 1);
      }
      throw error;
    }
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

  public setUpdateConversionStateCallback(
    cb: (conversionState: FFmpegConversionState) => void
  ): FFmpegManager {
    this.updateFileConversionStateCallback = cb;
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
    if (file.size < 0.6 * 1024 * 1024) {
      // console.log(`optimization not needed. ${file.size}bytes`);
      return;
    }
    // console.log('optimizing input');
    this.updateFileConversionStateCallback &&
      this.updateFileConversionStateCallback('optimizing');
    await this.ffmpeg.writeFile(file.name, await fetchFile(file));
    const newName = this.newInputName();
    const cmd = this.optimizedInputCommand();
    const ret = await this.ffmpeg.exec(cmd);
    if (ret === 1) {
      throw new Error('Error optimizing input');
    }
    this.updateFileConversionStateCallback &&
      this.updateFileConversionStateCallback('busy');
    const data = await this.ffmpeg.readFile(newName);
    const blob = new Blob([data], { type: 'video/mp4' });
    this.fileConfig.file = new File([blob], newName);
    this.fileConfig.optimizedInput = true;
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

    if (!blob) {
      return null;
    }

    const url = URL.createObjectURL(blob);
    return {
      url,
      outputName,
      finalSize: blob!.size,
    };
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

  private async run(calculator: FrameSizeCalculator, outputName: string) {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }
    if (!this.fileConfig) {
      throw new Error('FFmpegController config not set');
    }

    try {
      await this.optimizeInput();
    } catch {
      return null;
    }

    const { info } = this.fileConfig;
    let size: FrameSize | null = {
      width: info.startingWidth,
      height: info.startingHeight,
    };
    let blob = null;
    let iteration = 0;

    // const startTime = performance.now();
    this.logMessageCallback && this.ffmpeg.on('log', this.logMessageCallback);
    this.progressCallback && this.ffmpeg.on('progress', this.progressCallback);
    this.updateFileConversionStateCallback &&
      this.updateFileConversionStateCallback('converting');
    while (size !== null) {
      if (calculator.isDone) {
        break;
      }
      const ffmpegCmd = this.outputCommand(size.width);
      const ret = await this.ffmpeg.exec(ffmpegCmd);
      if (ret === 1) {
        return null;
      }
      // console.log('executed', ret);
      const data = await this.ffmpeg.readFile(outputName);
      blob = new Blob([data], { type: this.ext().slice(1) });
      this.newSizeCallback && this.newSizeCallback(blob.size);
      size = calculator.getNewFrameSize(blob.size);
      // console.log(`iteration: ${++iteration}. size`, size);
      ++iteration;
    }
    this.updateFileConversionStateCallback &&
      this.updateFileConversionStateCallback('busy');
    // console.log(
    //   `iteration: ${iteration}. time taken ${((performance.now() - startTime) / 1000).toFixed(2)}s`
    // );
    this.logMessageCallback && this.ffmpeg.off('log', this.logMessageCallback);
    this.progressCallback && this.ffmpeg.off('progress', this.progressCallback);
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
        '-i',
        this.fileConfig.file.name,
        '-f',
        'apng',
        '-plays',
        '0',
        '-vf',
        `scale=${width}:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2_4a`,
        '-compression_level',
        '9',
        `${this.fullOutputName()}`,
      ];
    }
    return [
      '-i',
      this.fileConfig.file.name,
      '-filter_complex',
      `[0:v] scale=${width}:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2_4a`,
      `${this.fullOutputName()}`,
    ];
  }

  private optimizedInputCommand(): Array<string> {
    if (!this.fileConfig) {
      throw new Error('FFmpegManager config not set');
    }
    if (this.outputType === 'sticker') {
      return [
        '-i',
        this.fileConfig.file.name,
        '-b:v',
        '0.5M',
        '-an',
        '-vf',
        `scale=${sizeInfo.sticker.startingWidth}:-2`,
        '-preset',
        'veryfast',
        `${this.newInputName()}`,
      ];
    }
    return [
      '-i',
      this.fileConfig.file.name,
      '-b:v',
      '0.5M',
      '-an',
      '-vf',
      `scale=${sizeInfo.emote.startingWidth}:-2`,
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
    return `${baseName}_${this.outputType}.mp4`;
  }

  private getOutputNameBase(name: string): string {
    const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
    return `${nameWithoutExt}_${this.outputType}`;
  }
}

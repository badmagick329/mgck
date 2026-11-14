import {
  ClipTrim,
  ClipCrop,
  FFmpegConversionResult,
  FFmpegConversionState,
  FFmpegLogEvent,
  FFmpegProgressEvent,
} from '@/lib/types/discordgifs';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import { ConversionTarget } from './conversion-target';
import {
  buildDownloadName,
  buildOptimizedInputCommand,
  buildOutputCommand,
} from './ffmpeg-commands';
import { FrameSizeCalculator } from './frame-size-calculator';
import {
  AdvancedSettings,
  FileType,
  fileTypeInfo,
  fileTypeOrder,
  singlePassDownloadName,
} from './advanced';
import { buildSinglePassCommand } from './single-pass-commands';

type FFmpegData = Uint8Array | string;

export type FFmpegRuntime = {
  load(options: { coreURL: string; wasmURL: string }): Promise<boolean>;
  exec(command: string[]): Promise<number>;
  writeFile(name: string, data: FFmpegData): Promise<boolean>;
  readFile(name: string): Promise<FFmpegData>;
  deleteFile(name: string): Promise<boolean>;
  on(event: 'log', callback: (event: FFmpegLogEvent) => void): void;
  on(event: 'progress', callback: (event: FFmpegProgressEvent) => void): void;
  off(event: 'log', callback: (event: FFmpegLogEvent) => void): void;
  off(event: 'progress', callback: (event: FFmpegProgressEvent) => void): void;
  terminate(): void;
};

type FFmpegManagerDependencies = {
  createFFmpeg: () => FFmpegRuntime;
  fetchFile: (file: File) => Promise<Uint8Array>;
  toBlobURL: (url: string, mimeType: string) => Promise<string>;
  createObjectURL: (blob: Blob) => string;
  createId: () => string;
  retryDelay: (milliseconds: number) => Promise<void>;
};

type FFmpegFileConfig = {
  crop?: ClipCrop;
  trim?: ClipTrim;
  file: File;
  target: ConversionTarget;
  inputName: string;
  optimizedInputName: string;
  outputFsName: string;
  outputName: string;
  activeInputName: string;
  /**
   * Names something may have written, so cleanup never deletes a file that
   * was never made (the optimized input is skipped for small files).
   */
  createdFiles: Set<string>;
};

export type SinglePassJob = {
  file: File;
  trim?: ClipTrim;
  crop?: ClipCrop;
  settings: AdvancedSettings;
  /** Even output width, or null when the source size is unknown. */
  width: number | null;
  keepSound: boolean;
  /** Caption image (PNG) at the exact output size, overlaid on every frame. */
  captions?: Uint8Array;
  /** Seconds of output, which turns FFmpeg's output time into a fraction. */
  outputSeconds: number;
};

export type SinglePassOutput =
  | { fileType: FileType; name: string; blob: Blob }
  | { fileType: FileType; failed: true };

type SinglePassCallbacks = {
  onStart?: (fileType: FileType, index: number) => void;
  /** Fraction of the current file type done, 0 to 1. */
  onProgress?: (fraction: number) => void;
  onOutput?: (output: SinglePassOutput) => void;
};

let fallbackId = 0;

// Versioned path of the same-origin core copies, inlined from next.config.js
// (set by jest.config.ts under Jest); scripts/ffmpeg-core.cjs is its one source.
const ffmpegCoreBasePath = process.env.FFMPEG_CORE_BASE_PATH;

const defaultDependencies: FFmpegManagerDependencies = {
  createFFmpeg: () => new FFmpeg() as FFmpegRuntime,
  fetchFile,
  toBlobURL,
  createObjectURL: (blob) => URL.createObjectURL(blob),
  createId: () =>
    globalThis.crypto?.randomUUID?.() ?? `conversion-${++fallbackId}`,
  retryDelay: (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
};

export class FFmpegManager {
  private ffmpeg: FFmpegRuntime | null = null;
  private activeLoadRuntime: FFmpegRuntime | null = null;
  private loadPromise: Promise<void> | null = null;
  private loadGeneration = 0;
  private fileConfig: FFmpegFileConfig | null = null;
  private readonly dependencies: FFmpegManagerDependencies;
  private logMessageCallback?: (e: FFmpegLogEvent) => void;
  private progressCallback?: (e: FFmpegProgressEvent) => void;
  private newSizeCallback?: (size: number) => void;
  private updateFileConversionStateCallback?: (
    conversionState: FFmpegConversionState
  ) => void;

  constructor(dependencies: Partial<FFmpegManagerDependencies> = {}) {
    this.dependencies = { ...defaultDependencies, ...dependencies };
  }

  public load(retries = 3): Promise<void> {
    if (this.ffmpeg) {
      return Promise.resolve();
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    if (!ffmpegCoreBasePath) {
      return Promise.reject(new Error('FFMPEG_CORE_BASE_PATH is not configured'));
    }

    const generation = ++this.loadGeneration;
    const pendingLoad = this.loadWithRetries(retries, generation).finally(
      () => {
        if (this.loadPromise === pendingLoad) {
          this.loadPromise = null;
        }
      }
    );
    this.loadPromise = pendingLoad;
    return pendingLoad;
  }

  private async loadWithRetries(
    retries: number,
    generation: number
  ): Promise<void> {
    let attemptsRemaining = retries;
    while (this.loadGeneration === generation) {
      const ffmpeg = this.dependencies.createFFmpeg();
      this.activeLoadRuntime = ffmpeg;
      try {
        // Same-origin copies staged at build by scripts/copy-ffmpeg-core.mjs:
        // this code processes local media, so a CDN must not be able to swap it.
        const baseURL = ffmpegCoreBasePath;
        const coreURL = await this.dependencies.toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          'text/javascript'
        );
        if (this.loadGeneration !== generation) {
          return;
        }
        const wasmURL = await this.dependencies.toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          'application/wasm'
        );
        if (this.loadGeneration !== generation) {
          return;
        }
        await ffmpeg.load({
          coreURL,
          wasmURL,
        });
        if (this.loadGeneration !== generation) {
          return;
        }
        if (this.activeLoadRuntime === ffmpeg) {
          this.activeLoadRuntime = null;
        }
        this.ffmpeg = ffmpeg;
        return;
      } catch (error) {
        if (this.loadGeneration !== generation) {
          return;
        }
        if (this.activeLoadRuntime === ffmpeg) {
          this.activeLoadRuntime = null;
        }
        ffmpeg.terminate();
        if (attemptsRemaining <= 0) {
          throw error;
        }
        attemptsRemaining -= 1;
        console.log(`Retrying... Attempts left: ${attemptsRemaining}`);
        await this.dependencies.retryDelay(2000);
      }
    }
  }

  public setFileConfig({
    file,
    target,
    trim,
    crop,
  }: {
    file: File;
    target: ConversionTarget;
    trim?: ClipTrim;
    crop?: ClipCrop;
  }): FFmpegManager {
    const id = this.dependencies.createId();
    const inputExtension = this.safeInputExtension(file.name);
    const inputName = `input-${id}${inputExtension}`;
    this.fileConfig = {
      file,
      trim,
      crop,
      target,
      inputName,
      optimizedInputName: `optimized-${id}.mp4`,
      outputFsName: `output-${id}${target.extension}`,
      outputName: buildDownloadName(file.name, target),
      activeInputName: inputName,
      createdFiles: new Set(),
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
    this.loadGeneration += 1;
    const loadedRuntime = this.ffmpeg;
    const loadingRuntime = this.activeLoadRuntime;
    loadingRuntime?.terminate();
    if (loadedRuntime && loadedRuntime !== loadingRuntime) {
      loadedRuntime.terminate();
    }
    this.ffmpeg = null;
    this.activeLoadRuntime = null;
    this.loadPromise = null;
    this.fileConfig = null;
  }

  public loaded(): boolean {
    return this.ffmpeg !== null;
  }

  public async convert(): Promise<FFmpegConversionResult | null> {
    const ffmpeg = this.ffmpeg;
    const config = this.fileConfig;
    if (!ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }
    if (!config) {
      throw new Error('FFmpegManager config not set');
    }

    let logListenerAttached = false;
    let progressListenerAttached = false;
    try {
      // Reading the file can fail before anything is written (Chrome reads
      // nothing past about 2 GiB), so the input counts only once it is in.
      await ffmpeg.writeFile(
        config.inputName,
        await this.dependencies.fetchFile(config.file)
      );
      config.createdFiles.add(config.inputName);

      try {
        await this.optimizeInput(config);
      } catch {
        return null;
      }

      if (this.logMessageCallback) {
        ffmpeg.on('log', this.logMessageCallback);
        logListenerAttached = true;
      }
      if (this.progressCallback) {
        ffmpeg.on('progress', this.progressCallback);
        progressListenerAttached = true;
      }
      this.updateFileConversionStateCallback?.('converting');

      const result = await this.runSizeSearch(config);
      if (!result) {
        return null;
      }

      const { blob, width } = result;
      return {
        url: this.dependencies.createObjectURL(blob),
        outputName: config.outputName,
        finalSize: blob.size,
        targetId: config.target.id,
        format: config.target.format,
        mimeType: config.target.mimeType,
        width,
      };
    } finally {
      try {
        if (logListenerAttached && this.logMessageCallback) {
          ffmpeg.off('log', this.logMessageCallback);
        }
      } catch (error) {
        console.error('Error removing FFmpeg log listener', error);
      }
      try {
        if (progressListenerAttached && this.progressCallback) {
          ffmpeg.off('progress', this.progressCallback);
        }
      } catch (error) {
        console.error('Error removing FFmpeg progress listener', error);
      }
      await this.deleteFiles(ffmpeg, config.createdFiles);
      if (this.fileConfig === config) {
        this.fileConfig = null;
      }
      this.updateFileConversionStateCallback?.('busy');
    }
  }

  private async optimizeInput(config: FFmpegFileConfig): Promise<void> {
    const ffmpeg = this.ffmpeg;
    if (!ffmpeg || config.file.size < 0.6 * 1024 * 1024) {
      return;
    }

    this.updateFileConversionStateCallback?.('optimizing');
    const command = buildOptimizedInputCommand({
      trim: config.trim,
      crop: config.crop,
      inputName: config.inputName,
      outputName: config.optimizedInputName,
      target: config.target,
    });
    config.createdFiles.add(config.optimizedInputName);
    const returnCode = await ffmpeg.exec(command);
    if (returnCode === 1) {
      throw new Error('Error optimizing input');
    }
    config.activeInputName = config.optimizedInputName;
    this.updateFileConversionStateCallback?.('busy');
  }

  private async runSizeSearch(config: FFmpegFileConfig): Promise<{
    blob: Blob;
    width: number;
  } | null> {
    const ffmpeg = this.ffmpeg;
    if (!ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }

    const calculator = new FrameSizeCalculator(config.target);
    let width: number | null = config.target.startingWidth;
    let lastWidth = width;
    let blob: Blob | null = null;

    while (width !== null && !calculator.isDone) {
      lastWidth = width;
      const command = buildOutputCommand({
        crop:
          config.activeInputName === config.inputName ? config.crop : undefined,
        trim:
          config.activeInputName === config.inputName ? config.trim : undefined,
        inputName: config.activeInputName,
        outputName: config.outputFsName,
        target: config.target,
        width,
      });
      config.createdFiles.add(config.outputFsName);
      const returnCode = await ffmpeg.exec(command);
      if (returnCode === 1) {
        return null;
      }
      const data = await ffmpeg.readFile(config.outputFsName);
      blob = new Blob(
        [data instanceof Uint8Array ? new Uint8Array(data) : data],
        { type: config.target.mimeType }
      );
      this.newSizeCallback?.(blob.size);
      width = calculator.getNewWidth(blob.size);
    }

    return blob ? { blob, width: lastWidth } : null;
  }

  /**
   * Advanced mode's path: the user's settings, one run per file type, and no
   * input optimisation or size search, which serve the presets' size caps.
   * The input is written once and shared by every file type.
   */
  public async convertSinglePass(
    job: SinglePassJob,
    { onStart, onProgress, onOutput }: SinglePassCallbacks = {}
  ): Promise<SinglePassOutput[]> {
    const ffmpeg = this.ffmpeg;
    if (!ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }
    const id = this.dependencies.createId();
    const inputName = `input-${id}${this.safeInputExtension(job.file.name)}`;
    const createdFiles = new Set<string>();
    // FFmpeg reports output time in microseconds; its own progress figure is
    // measured against the whole input, which a trim makes meaningless.
    const progressListener = ({ time }: FFmpegProgressEvent) => {
      if (job.outputSeconds > 0 && time > 0)
        onProgress?.(Math.min(1, time / 1_000_000 / job.outputSeconds));
    };
    const outputs: SinglePassOutput[] = [];
    ffmpeg.on('progress', progressListener);
    try {
      await ffmpeg.writeFile(
        inputName,
        await this.dependencies.fetchFile(job.file)
      );
      createdFiles.add(inputName);
      let captionsName: string | undefined;
      if (job.captions) {
        captionsName = `captions-${id}.png`;
        await ffmpeg.writeFile(captionsName, job.captions);
        createdFiles.add(captionsName);
      }
      const fileTypes = fileTypeOrder.filter((fileType) =>
        job.settings.fileTypes.includes(fileType)
      );
      for (const [index, fileType] of fileTypes.entries()) {
        onStart?.(fileType, index);
        onProgress?.(0);
        const outputFsName = `output-${id}${fileTypeInfo[fileType].extension}`;
        createdFiles.add(outputFsName);
        const returnCode = await ffmpeg.exec(
          buildSinglePassCommand({
            inputName,
            outputName: outputFsName,
            fileType,
            settings: job.settings,
            crop: job.crop,
            trim: job.trim,
            width: job.width,
            keepSound: job.keepSound,
            captionsName,
          })
        );
        let output: SinglePassOutput;
        if (returnCode !== 0) {
          output = { fileType, failed: true };
        } else {
          const data = await ffmpeg.readFile(outputFsName);
          output = {
            fileType,
            name: singlePassDownloadName(job.file.name, fileType),
            blob: new Blob(
              [data instanceof Uint8Array ? new Uint8Array(data) : data],
              { type: fileTypeInfo[fileType].mimeType }
            ),
          };
        }
        // Output files can be large; drop each one before the next run.
        await this.deleteFiles(ffmpeg, [outputFsName]);
        createdFiles.delete(outputFsName);
        outputs.push(output);
        onOutput?.(output);
      }
      return outputs;
    } finally {
      try {
        ffmpeg.off('progress', progressListener);
      } catch (error) {
        console.error('Error removing FFmpeg progress listener', error);
      }
      await this.deleteFiles(ffmpeg, createdFiles);
    }
  }

  /**
   * After terminate() the runtime that wrote these files is gone along with
   * its file system, so there is nothing to delete.
   */
  private async deleteFiles(
    runtime: FFmpegRuntime | null,
    names: Iterable<string>
  ): Promise<void> {
    if (!runtime || runtime !== this.ffmpeg) return;
    await Promise.all(
      [...names].map(async (name) => {
        try {
          await runtime.deleteFile(name);
        } catch (error) {
          console.error(`Error deleting temporary FFmpeg file ${name}`, error);
        }
      })
    );
  }

  private safeInputExtension(name: string): string {
    const lastDot = name.lastIndexOf('.');
    if (lastDot < 0) {
      return '.input';
    }
    const extension = name.slice(lastDot).toLowerCase();
    return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : '.input';
  }
}

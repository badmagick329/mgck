jest.mock('@ffmpeg/ffmpeg', () => ({ FFmpeg: jest.fn() }));
jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn(),
  toBlobURL: jest.fn(),
}));

import {
  ConversionTarget,
  ScaleCalculationConfig,
  conversionTargetPresets,
} from '@/lib/discordgifs/conversion-target';
import {
  buildDownloadName,
  buildOptimizedInputCommand,
  buildOutputCommand,
} from '@/lib/discordgifs/ffmpeg-commands';
import { FFmpegManager, FFmpegRuntime } from '@/lib/discordgifs/ffmpeg-manager';
import { FrameSizeCalculator } from '@/lib/discordgifs/frame-size-calculator';

const customTarget: ConversionTarget = {
  id: 'custom-preview',
  format: 'gif',
  extension: '.gif',
  mimeType: 'image/gif',
  filenameSuffix: '_preview',
  changeSize: 13,
  minChangeSize: 2,
  sizeLimit: 100_000,
  sizeMargin: 0.05,
  startingWidth: 111,
  minWidth: 17,
};

describe('conversion targets', () => {
  test('excludes contradictory format metadata at the type level', () => {
    type GifWithPngExtension = Extract<
      ConversionTarget,
      { format: 'gif'; extension: '.png' }
    >;
    type ApngWithGifMime = Extract<
      ConversionTarget,
      { format: 'apng'; mimeType: 'image/gif' }
    >;
    const assertNever = <T extends never>() => true;

    expect(assertNever<GifWithPngExtension>()).toBe(true);
    expect(assertNever<ApngWithGifMime>()).toBe(true);
  });

  test('preserves all Discord preset values exactly', () => {
    expect(conversionTargetPresets).toEqual({
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
      avatar: {
        id: 'avatar',
        format: 'gif',
        extension: '.gif',
        mimeType: 'image/gif',
        filenameSuffix: '_avatar',
        changeSize: 128,
        minChangeSize: 1,
        sizeLimit: 8 * 1024 * 1024,
        sizeMargin: 0.05,
        startingWidth: 512,
        minWidth: 64,
      },
    });
  });

  test('maps target suffixes and extensions to recognizable download names', () => {
    expect(
      buildDownloadName('dance.clip.mp4', conversionTargetPresets.emote)
    ).toBe('dance.clip_emote.gif');
    expect(
      buildDownloadName('dance.clip.mp4', conversionTargetPresets.sticker)
    ).toBe('dance.clip_sticker.png');
    expect(
      buildDownloadName('dance.clip.mp4', conversionTargetPresets.avatar)
    ).toBe('dance.clip_avatar.gif');
    expect(buildDownloadName('no-extension', customTarget)).toBe(
      'no-extension_preview.gif'
    );
  });
});

describe('FFmpeg command construction', () => {
  test('builds the existing GIF palette and dithering pipeline', () => {
    expect(
      buildOutputCommand({
        inputName: 'input-a.mp4',
        outputName: 'output-a.gif',
        target: conversionTargetPresets.emote,
        width: 80,
      })
    ).toEqual([
      '-i',
      'input-a.mp4',
      '-filter_complex',
      '[0:v] scale=80:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2_4a',
      'output-a.gif',
    ]);
  });

  test('builds the existing looping APNG pipeline and PNG filename', () => {
    expect(
      buildOutputCommand({
        inputName: 'input-b.webm',
        outputName: 'output-b.png',
        target: conversionTargetPresets.sticker,
        width: 140,
      })
    ).toEqual([
      '-i',
      'input-b.webm',
      '-f',
      'apng',
      '-plays',
      '0',
      '-vf',
      'scale=140:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2_4a',
      '-compression_level',
      '9',
      'output-b.png',
    ]);
  });

  test('uses an unregistered target for optimized-input scaling', () => {
    expect(
      buildOptimizedInputCommand({
        inputName: 'source.mov',
        outputName: 'optimized.mp4',
        target: customTarget,
      })
    ).toContain('scale=111:-2');
  });

  test('builds Avatar as a GIF using its 512-pixel optimized-input scale', () => {
    const outputCommand = buildOutputCommand({
      inputName: 'avatar-source.mp4',
      outputName: 'avatar-output.gif',
      target: conversionTargetPresets.avatar,
      width: 512,
    });
    const optimizedInputCommand = buildOptimizedInputCommand({
      inputName: 'avatar-source.mp4',
      outputName: 'avatar-optimized.mp4',
      target: conversionTargetPresets.avatar,
    });

    expect(outputCommand).toEqual([
      '-i',
      'avatar-source.mp4',
      '-filter_complex',
      '[0:v] scale=512:-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2_4a',
      'avatar-output.gif',
    ]);
    expect(optimizedInputCommand).toContain('scale=512:-2');
  });

  test('Avatar attempts change width only and add no media-reduction controls', () => {
    const first = buildOutputCommand({
      inputName: 'input.mp4',
      outputName: 'output.gif',
      target: conversionTargetPresets.avatar,
      width: 512,
    });
    const second = buildOutputCommand({
      inputName: 'input.mp4',
      outputName: 'output.gif',
      target: conversionTargetPresets.avatar,
      width: 384,
    });
    const optimized = buildOptimizedInputCommand({
      inputName: 'input.mp4',
      outputName: 'optimized.mp4',
      target: conversionTargetPresets.avatar,
    });

    expect(first.join(' ').replace('scale=512:', 'scale=<width>:')).toBe(
      second.join(' ').replace('scale=384:', 'scale=<width>:')
    );
    for (const command of [first, second, optimized]) {
      const text = command.join(' ');
      expect(command).not.toEqual(
        expect.arrayContaining(['-r', '-t', '-vsync'])
      );
      expect(text).not.toMatch(/fps=|max_colors|frame_drop|select=/);
    }
  });

  test('does not add frame-rate, frame-dropping, duration, or colour-count controls', () => {
    const commands = [
      buildOutputCommand({
        inputName: 'input.mp4',
        outputName: 'output.gif',
        target: customTarget,
        width: 111,
      }),
      buildOptimizedInputCommand({
        inputName: 'input.mp4',
        outputName: 'optimized.mp4',
        target: customTarget,
      }),
    ];

    for (const command of commands) {
      const text = command.join(' ');
      expect(command).not.toEqual(
        expect.arrayContaining(['-r', '-t', '-vsync'])
      );
      expect(text).not.toMatch(/fps=|max_colors|frame_drop|select=/);
    }
  });

  test('changes only scale width between size-search commands', () => {
    const first = buildOutputCommand({
      inputName: 'input.mp4',
      outputName: 'output.gif',
      target: customTarget,
      width: 111,
    });
    const second = buildOutputCommand({
      inputName: 'input.mp4',
      outputName: 'output.gif',
      target: customTarget,
      width: 84,
    });

    expect(first.join(' ').replace('scale=111:', 'scale=<width>:')).toBe(
      second.join(' ').replace('scale=84:', 'scale=<width>:')
    );
  });
});

describe('Frame size calculator', () => {
  test.each([
    ['emote', conversionTargetPresets.emote, [80, 40, 10]],
    ['sticker', conversionTargetPresets.sticker, [140, 100, 60, 30]],
    ['avatar', conversionTargetPresets.avatar, [512, 384, 256, 128, 64]],
  ] as const)(
    'preserves the %s width sequence when reducing to the minimum',
    (_, target, expected) => {
      const calculator = new FrameSizeCalculator(target);
      const widths: number[] = [];

      while (!calculator.isDone) {
        widths.push(calculator.width);
        calculator.getNewWidth(target.sizeLimit * 10 + calculator.width);
      }

      expect(widths).toEqual(expected);
      expect(calculator.isSuccessful).toBe(false);
    }
  );

  test.each(Object.values(conversionTargetPresets))(
    'succeeds immediately when the starting scale is under %s limit',
    (target) => {
      const calculator = new FrameSizeCalculator(target);
      expect(calculator.getNewWidth(target.sizeLimit - 1)).toBeNull();
      expect(calculator.width).toBe(target.startingWidth);
      expect(calculator.isSuccessful).toBe(true);
    }
  );

  test('accepts scale configuration from a dynamically constructed target', () => {
    const calculator = new FrameSizeCalculator(customTarget);
    expect(calculator.getNewWidth(customTarget.sizeLimit * 2)).toBe(98);
  });

  test.each(Object.values(conversionTargetPresets))(
    'terminates unsuccessfully at the minimum scale when output cannot fit',
    (target) => {
      const calculator = runCalculator(
        target,
        (width) => target.sizeLimit * 10 + width
      );
      expect(calculator.isDone).toBe(true);
      expect(calculator.isSuccessful).toBe(false);
      expect(calculator.width).toBe(target.minWidth);
    }
  );

  test('terminates successfully after crossing the safety-margin window', () => {
    const calculator = runCalculator(customTarget, (width) => width * 900);
    expect(calculator.isDone).toBe(true);
    expect(calculator.isSuccessful).toBe(true);
  });

  test('terminates when an encoder reports the same byte size twice', () => {
    const calculator = new FrameSizeCalculator(customTarget);
    calculator.getNewWidth(customTarget.sizeLimit * 2);
    expect(calculator.getNewWidth(customTarget.sizeLimit * 2)).toBeNull();
  });
});

describe('FFmpeg manager lifecycle', () => {
  test('shares one in-flight load across concurrent callers', async () => {
    let finishLoad: ((loaded: boolean) => void) | undefined;
    const runtime = createRuntime({
      load: jest.fn(
        () =>
          new Promise<boolean>((resolve) => {
            finishLoad = resolve;
          })
      ),
    });
    const createFFmpeg = jest.fn(() => runtime);
    const manager = createManager(runtime, { createFFmpeg });

    const first = manager.load();
    const second = manager.load();
    expect(createFFmpeg).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);

    while (!finishLoad) {
      await Promise.resolve();
    }
    finishLoad?.(true);
    await Promise.all([first, second]);
    expect(manager.loaded()).toBe(true);
  });

  test('termination invalidates an in-flight load without retries or resurrection', async () => {
    let finishOldLoad: ((loaded: boolean) => void) | undefined;
    const pendingRuntime = createRuntime({
      load: jest.fn(
        () =>
          new Promise<boolean>((resolve) => {
            finishOldLoad = resolve;
          })
      ),
    });
    const freshRuntime = createRuntime();
    const createFFmpeg = jest
      .fn<FFmpegRuntime, []>()
      .mockReturnValueOnce(pendingRuntime)
      .mockReturnValueOnce(freshRuntime);
    const retryDelay = jest.fn(async () => undefined);
    const manager = createManager(pendingRuntime, {
      createFFmpeg,
      retryDelay,
    });

    const oldLoad = manager.load();
    while (!finishOldLoad) {
      await Promise.resolve();
    }

    manager.terminate();
    expect(pendingRuntime.terminate).toHaveBeenCalledTimes(1);
    expect(manager.loaded()).toBe(false);

    finishOldLoad?.(true);
    await oldLoad;
    expect(manager.loaded()).toBe(false);
    expect(createFFmpeg).toHaveBeenCalledTimes(1);
    expect(retryDelay).not.toHaveBeenCalled();

    await manager.load();
    expect(createFFmpeg).toHaveBeenCalledTimes(2);
    expect(freshRuntime.load).toHaveBeenCalledTimes(1);
    expect(manager.loaded()).toBe(true);
  });

  test('accepts an unregistered target and returns its MIME metadata', async () => {
    const runtime = createRuntime({
      readFile: jest.fn(async () => new Uint8Array([1, 2, 3])),
    });
    let outputBlob: Blob | undefined;
    const manager = createManager(runtime, {
      createObjectURL: (blob) => {
        outputBlob = blob;
        return 'blob:test';
      },
    });
    await manager.load();
    manager.setFileConfig({
      file: new File(['source'], 'odd name [copy].mov'),
      target: customTarget,
    });

    const result = await manager.convert();

    expect(result).toMatchObject({
      outputName: 'odd name [copy]_preview.gif',
      finalSize: 3,
      targetId: 'custom-preview',
      format: 'gif',
      mimeType: 'image/gif',
      width: 111,
    });
    expect(outputBlob?.type).toBe('image/gif');
    const internalInput = (runtime.writeFile as jest.Mock).mock.calls[0][0];
    expect(internalInput).toBe('input-test-id.mov');
    expect(internalInput).not.toContain('odd name');
  });

  test('creates APNG output with PNG metadata', async () => {
    const runtime = createRuntime({
      readFile: jest.fn(async () => new Uint8Array([1, 2])),
    });
    let outputBlob: Blob | undefined;
    const manager = createManager(runtime, {
      createObjectURL: (blob) => {
        outputBlob = blob;
        return 'blob:sticker';
      },
    });
    await manager.load();
    manager.setFileConfig({
      file: new File(['source'], 'dance.webm'),
      target: conversionTargetPresets.sticker,
    });

    const result = await manager.convert();

    expect(result).toMatchObject({
      outputName: 'dance_sticker.png',
      targetId: 'sticker',
      format: 'apng',
      mimeType: 'image/png',
      width: 140,
    });
    expect(outputBlob?.type).toBe('image/png');
  });

  test('removes listeners, temporary files, and config when encoding fails', async () => {
    const runtime = createRuntime({
      exec: jest.fn(async () => {
        throw new Error('encoding failed');
      }),
    });
    const manager = createManager(runtime);
    const logCallback = jest.fn();
    const progressCallback = jest.fn();
    manager
      .setLogMessageCallback(logCallback)
      .setProgressCallback(progressCallback);
    await manager.load();
    manager.setFileConfig({
      file: new File(['source'], 'duplicate.gif'),
      target: conversionTargetPresets.emote,
    });

    await expect(manager.convert()).rejects.toThrow('encoding failed');
    expect(runtime.off).toHaveBeenCalledWith('log', logCallback);
    expect(runtime.off).toHaveBeenCalledWith('progress', progressCallback);
    expect(runtime.deleteFile).toHaveBeenCalledWith('input-test-id.gif');
    expect(runtime.deleteFile).toHaveBeenCalledWith('optimized-test-id.mp4');
    expect(runtime.deleteFile).toHaveBeenCalledWith('output-test-id.gif');
    await expect(manager.convert()).rejects.toThrow(
      'FFmpegManager config not set'
    );
  });
});

function runCalculator(
  config: ScaleCalculationConfig,
  fileSizeFor: (width: number) => number
): FrameSizeCalculator {
  const calculator = new FrameSizeCalculator(config);
  for (let iteration = 0; iteration < 100 && !calculator.isDone; iteration++) {
    const next = calculator.getNewWidth(fileSizeFor(calculator.width));
    if (next === null && !calculator.isDone) {
      break;
    }
  }
  return calculator;
}

function createRuntime(overrides: Partial<FFmpegRuntime> = {}): FFmpegRuntime {
  return {
    load: jest.fn(async () => true),
    exec: jest.fn(async () => 0),
    writeFile: jest.fn(async () => true),
    readFile: jest.fn(async () => new Uint8Array([1])),
    deleteFile: jest.fn(async () => true),
    on: jest.fn(),
    off: jest.fn(),
    terminate: jest.fn(),
    ...overrides,
  } as FFmpegRuntime;
}

function createManager(
  runtime: FFmpegRuntime,
  overrides: ConstructorParameters<typeof FFmpegManager>[0] = {}
): FFmpegManager {
  return new FFmpegManager({
    createFFmpeg: () => runtime,
    fetchFile: async () => new Uint8Array([1]),
    toBlobURL: async (url) => url,
    createObjectURL: () => 'blob:test',
    createId: () => 'test-id',
    retryDelay: async () => undefined,
    ...overrides,
  });
}

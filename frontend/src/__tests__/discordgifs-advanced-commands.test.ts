jest.mock('@ffmpeg/ffmpeg', () => ({ FFmpeg: jest.fn() }));
jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn(),
  toBlobURL: jest.fn(),
}));

import {
  AdvancedSettings,
  croppedSourceSize,
  defaultAdvancedSettings,
  frameCount,
  isLargeGif,
  outputSize,
  singlePassDownloadName,
} from '@/lib/discordgifs/advanced';
import { buildSinglePassCommand } from '@/lib/discordgifs/single-pass-commands';
import {
  FFmpegManager,
  FFmpegRuntime,
  SinglePassOutput,
} from '@/lib/discordgifs/ffmpeg-manager';
import { FFmpegProgressEvent } from '@/lib/types/discordgifs';

const settings = (patch: Partial<AdvancedSettings> = {}): AdvancedSettings => ({
  ...defaultAdvancedSettings,
  ...patch,
});

const command = (
  fileType: 'gif' | 'webp' | 'mp4',
  patch: Partial<AdvancedSettings> = {},
  extra: Partial<Parameters<typeof buildSinglePassCommand>[0]> = {}
) =>
  buildSinglePassCommand({
    inputName: 'input.mp4',
    outputName: `output.${fileType}`,
    fileType,
    settings: settings(patch),
    width: 480,
    keepSound: false,
    ...extra,
  });

const graph = (args: string[]) => args[args.indexOf('-filter_complex') + 1];
const option = (args: string[], name: string) => args[args.indexOf(name) + 1];

describe('single-pass commands', () => {
  test('GIF: fps, lanczos scale, diff palette and rectangle paletteuse', () => {
    const args = command('gif');
    expect(args).toEqual([
      '-i',
      'input.mp4',
      '-filter_complex',
      '[0:v]fps=15,scale=480:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=256:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle[out]',
      '-map',
      '[out]',
      '-loop',
      '0',
      'output.gif',
    ]);
  });

  test('GIF colours and every dithering choice reach the palette filters', () => {
    expect(graph(command('gif', { gifColors: 64 }))).toContain(
      'palettegen=max_colors=64:stats_mode=diff'
    );
    expect(graph(command('gif', { gifDither: 'floyd_steinberg' }))).toContain(
      'paletteuse=dither=floyd_steinberg:diff_mode=rectangle'
    );
    expect(graph(command('gif', { gifDither: 'bayer' }))).toContain(
      'paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle'
    );
    expect(graph(command('gif', { gifDither: 'none' }))).toContain(
      'paletteuse=dither=none:diff_mode=rectangle'
    );
  });

  test.each([
    [0, '0', '0'],
    [1, '-1', '1'],
    [2, '1', '2'],
    [3, '2', '3'],
  ])(
    'plays %i times: GIF -loop %s, WebP -loop %s',
    (plays, gifLoop, webpLoop) => {
      expect(option(command('gif', { plays }), '-loop')).toBe(gifLoop);
      expect(option(command('webp', { plays }), '-loop')).toBe(webpLoop);
    }
  );

  test('WebP: libwebp at the chosen quality through the animated muxer', () => {
    expect(command('webp', { webpQuality: 63 })).toEqual([
      '-i',
      'input.mp4',
      '-filter_complex',
      '[0:v]fps=15,scale=480:-2:flags=lanczos[out]',
      '-map',
      '[out]',
      '-c:v',
      'libwebp',
      '-lossless',
      '0',
      '-quality',
      '63',
      '-compression_level',
      '4',
      '-loop',
      '0',
      'output.webp',
    ]);
  });

  test('MP4: libx264 CRF 20, yuv420p and faststart, silent by default', () => {
    expect(command('mp4')).toEqual([
      '-i',
      'input.mp4',
      '-filter_complex',
      '[0:v]fps=15,scale=480:-2:flags=lanczos,format=yuv420p[out]',
      '-map',
      '[out]',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-movflags',
      '+faststart',
      '-an',
      'output.mp4',
    ]);
  });

  test('MP4 keeps the first sound track only when asked', () => {
    const args = command('mp4', {}, { keepSound: true });
    expect(args).not.toContain('-an');
    expect(args.slice(-8)).toEqual([
      '-map',
      '0:a:0?',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-shortest',
      'output.mp4',
    ]);
    // Sound never reaches the image file types.
    expect(command('gif', {}, { keepSound: true })).not.toContain('0:a:0?');
    expect(command('webp', {}, { keepSound: true })).not.toContain('0:a:0?');
  });

  test.each(['gif', 'webp', 'mp4'] as const)(
    '%s trims before the input and crops before fps and scale',
    (fileType) => {
      const args = command(
        fileType,
        { fps: 24 },
        {
          width: 320,
          trim: { start: 1.5, end: 4 },
          crop: { x: 0.25, y: 0.1, width: 0.5, height: 0.8 },
        }
      );
      expect(args.slice(0, 6)).toEqual([
        '-ss',
        '1.5',
        '-t',
        '2.5',
        '-i',
        'input.mp4',
      ]);
      expect(graph(args)).toMatch(
        /^\[0:v\]crop='max\(1,iw\*0\.5\)':'max\(1,ih\*0\.8\)':iw\*0\.25:ih\*0\.1:exact=1,fps=24,scale=320:-2:flags=lanczos/
      );
    }
  );

  test('an unknown source width keeps the cropped width, made even', () => {
    expect(graph(command('mp4', {}, { width: null }))).toContain(
      'scale=trunc(iw/2)*2:-2:flags=lanczos'
    );
  });
});

describe('Advanced mode output numbers', () => {
  const frame = { width: 1920, height: 1080 };

  test('defaults: 480 px wide, 15 fps, GIF only, 256 colours, forever', () => {
    expect(defaultAdvancedSettings).toEqual({
      width: 480,
      fps: 15,
      fileTypes: ['gif'],
      gifColors: 256,
      gifDither: 'sierra2_4a',
      plays: 0,
      webpQuality: 80,
      keepSound: false,
    });
  });

  test('width is even, capped at the crop, and the height follows scale=-2', () => {
    const full = croppedSourceSize(undefined, frame);
    expect(outputSize(480, full)).toEqual({ width: 480, height: 270, native: 1920 });
    expect(outputSize(481, full).width).toBe(480);
    expect(outputSize('original', full)).toMatchObject({ width: 1920, height: 1080 });

    // A 301-pixel crop truncates like FFmpeg's crop filter and caps at 300.
    const narrow = croppedSourceSize(
      { x: 0, y: 0, width: 301 / 1920, height: 0.5 },
      frame
    );
    expect(narrow).toEqual({ width: 301, height: 540 });
    expect(outputSize(640, narrow)).toEqual({ width: 300, height: 538, native: 300 });
  });

  test('frame count and the big-GIF warning follow Gif Studio', () => {
    expect(frameCount(5, 15)).toBe(75);
    expect(frameCount(2.2, 15)).toBe(33);
    expect(isLargeGif({ width: 480, height: 270 }, 300)).toBe(false);
    expect(isLargeGif({ width: 480, height: 270 }, 301)).toBe(true);
  });

  test('download names swap the extension for the file type', () => {
    expect(singlePassDownloadName('dance.clip.mov', 'gif')).toBe('dance.clip.gif');
    expect(singlePassDownloadName('dance', 'webp')).toBe('dance.webp');
    expect(singlePassDownloadName('dance.mp4', 'mp4')).toBe('dance.mp4');
  });
});

describe('single-pass conversion', () => {
  function setup(exec: FFmpegRuntime['exec'] = jest.fn(async () => 0)) {
    let emitProgress: (event: FFmpegProgressEvent) => void = () => {};
    const runtime = {
      load: jest.fn(async () => true),
      exec,
      writeFile: jest.fn(async () => true),
      readFile: jest.fn(async () => new Uint8Array([1, 2, 3])),
      deleteFile: jest.fn(async () => true),
      on: jest.fn((event: string, callback: typeof emitProgress) => {
        if (event === 'progress') emitProgress = callback;
      }),
      off: jest.fn(),
      terminate: jest.fn(),
    } as unknown as FFmpegRuntime;
    const manager = new FFmpegManager({
      createFFmpeg: () => runtime,
      fetchFile: async () => new Uint8Array([1]),
      toBlobURL: async (url) => url,
      createObjectURL: () => 'blob:test',
      createId: () => 'id',
      retryDelay: async () => undefined,
    });
    return { runtime, manager, progress: (event: FFmpegProgressEvent) => emitProgress(event) };
  }

  const job = {
    file: new File(['clip'], 'clip.mov'),
    settings: settings({ fileTypes: ['mp4', 'gif', 'webp'] }),
    width: 480,
    keepSound: true,
    outputSeconds: 4,
  };

  test('writes the input once and makes each ticked file type in order', async () => {
    const { runtime, manager } = setup();
    await manager.load();
    const outputs = await manager.convertSinglePass(job);

    expect(runtime.writeFile).toHaveBeenCalledTimes(1);
    expect(runtime.writeFile).toHaveBeenCalledWith('input-id.mov', expect.any(Uint8Array));
    const outputNames = (runtime.exec as jest.Mock).mock.calls.map(
      ([args]: [string[]]) => args[args.length - 1]
    );
    expect(outputNames).toEqual(['output-id.gif', 'output-id.webp', 'output-id.mp4']);
    expect(
      outputs.map((output) =>
        'blob' in output ? [output.name, output.blob.type] : output
      )
    ).toEqual([
      ['clip.gif', 'image/gif'],
      ['clip.webp', 'image/webp'],
      ['clip.mp4', 'video/mp4'],
    ]);
    // Only the MP4 run asks for sound.
    const mp4Args = (runtime.exec as jest.Mock).mock.calls[2][0] as string[];
    expect(mp4Args).toContain('0:a:0?');
    // Each output and the input are removed; nothing else is deleted.
    expect((runtime.deleteFile as jest.Mock).mock.calls.map(([name]) => name).sort()).toEqual([
      'input-id.mov',
      'output-id.gif',
      'output-id.mp4',
      'output-id.webp',
    ]);
    expect(runtime.off).toHaveBeenCalledWith('progress', expect.any(Function));
  });

  test('reports a failed file type and carries on with the rest', async () => {
    const exec = jest.fn(async (args: string[]) =>
      args[args.length - 1].endsWith('.webp') ? 1 : 0
    );
    const { manager } = setup(exec);
    await manager.load();
    const seen: SinglePassOutput[] = [];
    await manager.convertSinglePass(job, { onOutput: (o) => seen.push(o) });
    expect(seen.map((o) => ['failed' in o, o.fileType])).toEqual([
      [false, 'gif'],
      [true, 'webp'],
      [false, 'mp4'],
    ]);
  });

  test('turns output time in microseconds into a fraction of the selection', async () => {
    let finish: (code: number) => void = () => {};
    const { manager, progress } = setup(
      jest.fn(() => new Promise<number>((resolve) => (finish = resolve)))
    );
    await manager.load();
    const fractions: number[] = [];
    const started: string[] = [];
    const run = manager.convertSinglePass(
      { ...job, settings: settings({ fileTypes: ['mp4'] }) },
      {
        onStart: (fileType) => started.push(fileType),
        onProgress: (fraction) => fractions.push(fraction),
      }
    );
    while (started.length === 0) await Promise.resolve();
    await Promise.resolve();
    progress({ progress: 0.01, time: 1_000_000 });
    progress({ progress: 0.02, time: 9_000_000 });
    finish(0);
    await run;
    expect(fractions).toEqual([0, 0.25, 1]);
  });

  test('a cancelled run leaves the replacement core alone', async () => {
    let fail: (error: Error) => void = () => {};
    const { runtime, manager } = setup(
      jest.fn(() => new Promise<number>((_, reject) => (fail = reject)))
    );
    await manager.load();
    const run = manager.convertSinglePass(job);
    while ((runtime.exec as jest.Mock).mock.calls.length === 0)
      await Promise.resolve();
    manager.terminate();
    fail(new Error('called FFmpeg.terminate()'));
    await expect(run).rejects.toThrow('called FFmpeg.terminate()');
    expect(runtime.deleteFile).not.toHaveBeenCalled();
  });
});

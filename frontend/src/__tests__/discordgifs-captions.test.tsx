// Thumbnail drawing needs real media decoding, which jsdom lacks.
jest.mock('../hooks/discordgifs/useTimelineThumbnails', () => ({
  useTimelineThumbnails: () => [],
}));
jest.mock('@ffmpeg/ffmpeg', () => ({ FFmpeg: jest.fn() }));
jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn(),
  toBlobURL: jest.fn(),
}));
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    acceptedFiles: mockDropzone.files,
    fileRejections: [],
    getRootProps: () => ({}),
    getInputProps: () => ({}),
  }),
}));
jest.mock('../hooks/discordgifs/useFFmpeg', () => ({
  useFFmpeg: () => ({ ffmpegRef: mockFFmpegRef, isLoaded: true }),
}));
jest.mock('../hooks/discordgifs/useFilePaste', () => ({
  useFilePaste: jest.fn(),
}));
jest.mock('../lib/discordgifs/file-duration', () => ({
  readFileDuration: jest.fn(async () => 4),
}));

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import FileDropzone from '@/app/discordgifs/_components/FileDropzone';
import {
  Captions,
  captionBasePixels,
  captionFont,
  drawCaptions,
  fitCaptionPixels,
} from '@/lib/discordgifs/captions';

const mockDropzone: { files: File[] } = { files: [] };
const mockFFmpegRef = {
  current: {
    loaded: jest.fn(() => true),
    load: jest.fn(async () => undefined),
    terminate: jest.fn(),
    convertSinglePass: jest.fn(),
  },
};

type Stroke = {
  text: string;
  x: number;
  y: number;
  font: string;
  lineWidth: number;
  baseline: string;
};

/**
 * A 2D context that records the captions it is asked to draw and measures
 * text as half the font size per character, so fitting is predictable.
 */
function recordingContext() {
  const strokes: Stroke[] = [];
  const context = {
    font: '',
    lineWidth: 1,
    textBaseline: 'alphabetic',
    textAlign: 'start',
    lineJoin: 'miter',
    strokeStyle: '',
    fillStyle: '',
    save: jest.fn(),
    restore: jest.fn(),
    setTransform: jest.fn(),
    // Each frame starts with a clear, so the record holds the latest frame.
    clearRect: () => {
      strokes.length = 0;
    },
    drawImage: jest.fn(),
    fillText: jest.fn(),
    measureText(text: string) {
      return { width: text.length * fontPixels(this.font) * 0.5 };
    },
    strokeText(text: string, x: number, y: number) {
      strokes.push({
        text,
        x,
        y,
        font: this.font,
        lineWidth: this.lineWidth,
        baseline: this.textBaseline,
      });
    },
  };
  return { context, strokes };
}

const fontPixels = (font: string) => Number(font.match(/([\d.]+)px/)![1]);

const captions = (patch: Partial<Captions> = {}): Captions => ({
  topText: '',
  bottomText: '',
  captionSize: 12,
  ...patch,
});

describe('caption fitting', () => {
  test('the size is a share of the shorter side, never under 8 px', () => {
    expect(captionBasePixels({ width: 480, height: 270 }, 12)).toBe(32);
    expect(captionBasePixels({ width: 270, height: 480 }, 12)).toBe(32);
    expect(captionBasePixels({ width: 480, height: 270 }, 30)).toBe(81);
    expect(captionBasePixels({ width: 40, height: 40 }, 5)).toBe(8);
  });

  test('a line that fits keeps its size; a wider one shrinks to 94% of the width', () => {
    // 80 px of text plus a sixth of 32 for the outline fits in 451.2 px.
    expect(fitCaptionPixels(80, 32, 480)).toBe(32);
    expect(fitCaptionPixels(451.2 - 32 / 6, 32, 480)).toBe(32);
    // 640 + 5.33 px shrinks by 451.2 / 645.33.
    expect(fitCaptionPixels(640, 32, 480)).toBe(22);
    expect(fitCaptionPixels(100_000, 32, 480)).toBe(8);
  });

  test('Latin text uses the display face; Korean and emoji switch the line to bold system faces', () => {
    // next/jest stands the bundled face in as "fontFamily".
    expect(captionFont('WHEN THE BASS DROPS', 32)).toMatch(
      /^32px fontFamily, "Malgun Gothic"/
    );
    expect(captionFont('“Ça va” — déjà', 32)).toMatch(/^32px fontFamily,/);
    expect(captionFont('안녕하세요', 32)).toMatch(/^bold 32px "Malgun Gothic"/);
    expect(captionFont('LOL 😂', 32)).toMatch(/^bold 32px /);
  });
});

describe('caption drawing', () => {
  test('lines are centred white on black, top from the top and bottom from the bottom', () => {
    const { context, strokes } = recordingContext();
    const output = { width: 480, height: 270 };
    drawCaptions(
      context as unknown as CanvasRenderingContext2D,
      captions({ topText: '  TOP  ', bottomText: 'BOTTOM' }),
      output,
      output
    );
    expect(strokes).toEqual([
      // 32 px: a margin of round(9.6) and an outline of round(32 / 12) a side.
      {
        text: 'TOP',
        x: 240,
        y: 10,
        font: expect.stringMatching(/^32px /),
        lineWidth: 6,
        baseline: 'top',
      },
      {
        text: 'BOTTOM',
        x: 240,
        y: 260,
        font: expect.stringMatching(/^32px /),
        lineWidth: 6,
        baseline: 'bottom',
      },
    ]);
    expect(context.fillText).toHaveBeenCalledTimes(2);
    expect(context.fillStyle).toBe('#fff');
    expect(context.strokeStyle).toBe('#000');
  });

  test('a long caption shrinks to fit the width', () => {
    const { context, strokes } = recordingContext();
    const output = { width: 480, height: 270 };
    drawCaptions(
      context as unknown as CanvasRenderingContext2D,
      captions({ topText: 'X'.repeat(40) }),
      output,
      output
    );
    expect(fontPixels(strokes[0].font)).toBe(22);
    // At its fitted size the line takes 440 of the 451 px allowed.
    expect(strokes[0].text.length * 22 * 0.5).toBeLessThanOrEqual(480 * 0.94);
  });

  test('a smaller canvas scales the same layout, so the preview matches the file', () => {
    const output = { width: 480, height: 270 };
    const preview = { width: 300, height: 168.75 };
    const full = recordingContext();
    const small = recordingContext();
    const text = captions({ topText: 'X'.repeat(40), bottomText: 'END' });
    drawCaptions(
      full.context as unknown as CanvasRenderingContext2D,
      text,
      output,
      output
    );
    drawCaptions(
      small.context as unknown as CanvasRenderingContext2D,
      text,
      output,
      preview
    );
    const k = preview.width / output.width;
    small.strokes.forEach((stroke, i) => {
      const fileStroke = full.strokes[i];
      expect(stroke.x).toBeCloseTo(fileStroke.x * k);
      expect(stroke.y).toBeCloseTo(fileStroke.y * k);
      expect(stroke.lineWidth).toBeCloseTo(fileStroke.lineWidth * k);
      expect(fontPixels(stroke.font)).toBeCloseTo(
        fontPixels(fileStroke.font) * k
      );
    });
  });

  test('blank captions draw nothing', () => {
    const { context, strokes } = recordingContext();
    drawCaptions(
      context as unknown as CanvasRenderingContext2D,
      captions({ topText: '   ' }),
      { width: 480, height: 270 },
      { width: 480, height: 270 }
    );
    expect(strokes).toEqual([]);
    expect(context.save).not.toHaveBeenCalled();
  });
});

describe('Advanced mode captions', () => {
  let recorders: WeakMap<
    HTMLCanvasElement,
    ReturnType<typeof recordingContext>
  >;
  /** Captions on the preview's latest frame. */
  const previewStrokes = () =>
    recorders.get(
      screen.getByRole('img', {
        name: 'Output preview drawing',
      }) as HTMLCanvasElement
    )?.strokes ?? [];

  beforeEach(() => {
    mockDropzone.files = [];
    window.history.replaceState(null, '', '/discordgifs?mode=advanced');
    window.matchMedia = jest.fn(() => ({ matches: false }) as MediaQueryList);
    URL.createObjectURL = jest.fn(() => 'blob:clip');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    mockFFmpegRef.current.convertSinglePass.mockReset();
    mockFFmpegRef.current.convertSinglePass.mockResolvedValue([]);
    recorders = new WeakMap();
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(function (this: HTMLCanvasElement) {
        if (!recorders.has(this)) recorders.set(this, recordingContext());
        return recorders.get(this)!.context as unknown as RenderingContext;
      });
    // The encoded image stands in as its own size, which is what matters here.
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function (
        this: HTMLCanvasElement,
        callback: BlobCallback
      ) {
        const bytes = Uint8Array.from(`png ${this.width}x${this.height}`, (c) =>
          c.charCodeAt(0)
        );
        const blob = new Blob([bytes], { type: 'image/png' });
        Object.defineProperty(blob, 'arrayBuffer', {
          value: async () => bytes.buffer,
        });
        callback(blob);
      });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    delete (document as { fonts?: unknown }).fonts;
  });

  /** Opens a clip with a decoded 1280 × 720 frame. */
  async function openClip(name = 'one.mp4') {
    const view = render(<FileDropzone />);
    mockDropzone.files = [new File([name], name)];
    view.rerender(<FileDropzone />);
    await screen.findByRole('button', { name: `Remove ${name}` });
    const video = view.container.querySelector('video')!;
    Object.defineProperties(video, {
      videoWidth: { value: 1280, configurable: true },
      videoHeight: { value: 720, configurable: true },
      readyState: { value: 4, configurable: true },
    });
    fireEvent.loadedMetadata(video);
    fireEvent.loadedData(video);
    return view;
  }
  const type = (name: 'Top text' | 'Bottom text', value: string) =>
    fireEvent.change(screen.getByRole('textbox', { name }), {
      target: { value },
    });
  const convert = () =>
    act(async () =>
      fireEvent.click(screen.getByRole('button', { name: /^Convert to/ }))
    );

  test('the preview draws both captions and follows the text size', async () => {
    await openClip();
    type('Top text', 'TOP');
    type('Bottom text', '안녕');
    expect(
      previewStrokes().map(({ text, baseline }) => [text, baseline])
    ).toEqual([
      ['TOP', 'top'],
      ['안녕', 'bottom'],
    ]);
    // 12% of the 270 px side is 32 output pixels, drawn at the 300 px
    // preview's 0.625 scale.
    expect(fontPixels(previewStrokes()[0].font)).toBe(20);

    fireEvent.change(screen.getByRole('slider', { name: 'Text size' }), {
      target: { value: '24' },
    });
    expect(screen.getByText('24%')).toBeInTheDocument();
    expect(fontPixels(previewStrokes()[0].font)).toBe(65 * 0.625);
  });

  test('the preview waits for the caption font before drawing captions', async () => {
    let finishLoading: () => void = () => {};
    let loaded = false;
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        check: () => loaded,
        load: () =>
          new Promise<void>((resolve) => {
            finishLoading = () => {
              loaded = true;
              resolve();
            };
          }),
      },
    });
    await openClip();
    type('Top text', 'TOP');
    expect(previewStrokes()).toEqual([]);
    await act(async () => finishLoading());
    expect(previewStrokes().map(({ text }) => text)).toEqual(['TOP']);
  });

  test('converting sends a caption image at the exact output size', async () => {
    await openClip();
    type('Bottom text', 'BOTTOM');
    fireEvent.click(screen.getByRole('button', { name: 'Rotate right' }));
    await convert();
    const job = mockFFmpegRef.current.convertSinglePass.mock.calls[0][0];
    expect(job.width).toBe(480);
    expect(String.fromCharCode(...job.captions)).toBe('png 480x854');
    expect(job.settings).toMatchObject({ bottomText: 'BOTTOM', rotation: 90 });
  });

  test('without captions no image is sent', async () => {
    await openClip();
    type('Top text', '   ');
    await convert();
    expect(
      mockFFmpegRef.current.convertSinglePass.mock.calls[0][0].captions
    ).toBeUndefined();
  });

  test('a new clip clears the captions but keeps the text size', async () => {
    const view = await openClip();
    type('Top text', 'TOP');
    fireEvent.change(screen.getByRole('slider', { name: 'Text size' }), {
      target: { value: '20' },
    });
    mockDropzone.files = [new File(['two'], 'two.mp4')];
    view.rerender(<FileDropzone />);
    await screen.findByRole('button', { name: 'Remove two.mp4' });
    expect(screen.getByRole('textbox', { name: 'Top text' })).toHaveValue('');
    expect(screen.getByText('20%')).toBeInTheDocument();
  });
});

jest.mock('../lib/discordgifs/timeline-thumbnails', () => ({
  ...jest.requireActual('../lib/discordgifs/timeline-thumbnails'),
  generateTimelineThumbnails: jest.fn(() => new Promise(() => {})),
}));

import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import VideoTrimmer from '@/app/discordgifs/_components/VideoTrimmer';
import { conversionTargetPresets } from '@/lib/discordgifs/conversion-target';
import {
  approximateWidthLabel,
  canvasResolution,
  cropSourceRect,
  drawOutputFrame,
  fitToBox,
} from '@/lib/discordgifs/output-preview';
import type { Orientation } from '@/lib/discordgifs/output-preview';
import { ClipCrop, FFmpegFileData } from '@/lib/types/discordgifs';

const frame = { width: 1280, height: 720 };

describe('preview maths', () => {
  test('the kept source is the crop in source pixels, or the whole frame', () => {
    expect(cropSourceRect(undefined, frame)).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    });
    expect(
      cropSourceRect({ x: 0.25, y: 0.5, width: 0.5, height: 0.25 }, frame)
    ).toEqual({ x: 320, y: 360, width: 640, height: 180 });
  });

  test('labels promise only an approximate width', () => {
    expect(approximateWidthLabel('emote')).toBe('≈ 80 px wide');
    expect(approximateWidthLabel('sticker')).toBe('≈ 140 px wide');
    expect(approximateWidthLabel('avatar')).toBe('≈ 512 px wide');
  });

  test('contain fits the long side to the box', () => {
    const wide = cropSourceRect(undefined, frame);
    expect(fitToBox(wide, 160, 'contain')).toEqual({
      source: wide,
      display: { width: 160, height: 90 },
    });
    const tall = cropSourceRect(undefined, { width: 720, height: 1280 });
    expect(fitToBox(tall, 160, 'contain').display).toEqual({
      width: 90,
      height: 160,
    });
  });

  test('cover fills the box from the centre of the source, as a round avatar', () => {
    const kept = cropSourceRect({ x: 0.1, y: 0, width: 0.8, height: 1 }, frame);
    expect(fitToBox(kept, 80, 'cover')).toEqual({
      source: { x: 128 + (1024 - 720) / 2, y: 0, width: 720, height: 720 },
      display: { width: 80, height: 80 },
    });
  });

  test('canvas pixels follow the screen but never exceed the output', () => {
    const kept = cropSourceRect(undefined, frame);
    // A 140 px sticker in Discord's 160 px box stays 140 pixels across.
    const sticker = fitToBox(kept, 160, 'contain');
    expect(
      canvasResolution(sticker.display, sticker.source, kept, 140, 2)
    ).toEqual({ width: 140, height: 79 });
    // A 512 px avatar shown at 80 px has pixels to spare for a 2x screen.
    const avatar = fitToBox(kept, 80, 'cover');
    expect(
      canvasResolution(avatar.display, avatar.source, kept, 512, 2)
    ).toEqual({ width: 160, height: 160 });
  });
});

describe('rotated and flipped preview frames', () => {
  /**
   * Where each corner of the source lands on the canvas, read off the
   * transform the frame was drawn with, as FFmpeg's transpose and flips
   * would place it.
   */
  function corners(
    orientation: Orientation,
    canvas: { width: number; height: number }
  ) {
    const transforms: number[][] = [];
    const draws: number[][] = [];
    const context = {
      clearRect: jest.fn(),
      setTransform: (...m: number[]) => transforms.push(m),
      drawImage: (_: unknown, ...args: number[]) => draws.push(args),
    } as unknown as CanvasRenderingContext2D;
    drawOutputFrame(
      context,
      {} as CanvasImageSource,
      { x: 0, y: 0, width: 1280, height: 720 },
      canvas,
      orientation
    );
    // Reset, clear, draw transform, reset.
    const [a, b, c, d, e, f] = transforms[1];
    const [, , , , , , width, height] = draws[0];
    const place = (x: number, y: number) => [
      Math.round(a * x + c * y + e),
      Math.round(b * x + d * y + f),
    ];
    expect(transforms[transforms.length - 1]).toEqual([1, 0, 0, 1, 0, 0]);
    return {
      topLeft: place(0, 0),
      topRight: place(width, 0),
      bottomLeft: place(0, height),
    };
  }
  const flat = {
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  } as const;
  const wide = { width: 160, height: 90 };
  const tall = { width: 90, height: 160 };

  test('upright draws the source as it is', () => {
    expect(corners(flat, wide)).toEqual({
      topLeft: [0, 0],
      topRight: [160, 0],
      bottomLeft: [0, 90],
    });
  });

  test('a right turn puts the top left corner at the top right', () => {
    expect(corners({ ...flat, rotation: 90 }, tall)).toEqual({
      topLeft: [90, 0],
      topRight: [90, 160],
      bottomLeft: [0, 0],
    });
  });

  test('a left turn puts the top left corner at the bottom left', () => {
    expect(corners({ ...flat, rotation: 270 }, tall)).toEqual({
      topLeft: [0, 160],
      topRight: [0, 0],
      bottomLeft: [90, 160],
    });
  });

  test('a half turn and both flips land the same way', () => {
    const half = corners({ ...flat, rotation: 180 }, wide);
    expect(half.topLeft).toEqual([160, 90]);
    expect(
      corners({ ...flat, flipHorizontal: true, flipVertical: true }, wide)
    ).toEqual(half);
  });

  test('flips mirror after the turn, as hflip follows transpose', () => {
    expect(corners({ ...flat, flipHorizontal: true }, wide).topLeft).toEqual([
      160, 0,
    ]);
    expect(corners({ ...flat, flipVertical: true }, wide).topLeft).toEqual([
      0, 90,
    ]);
    // transpose=1 then hflip: the source top left ends at the canvas top left.
    expect(
      corners({ ...flat, rotation: 90, flipHorizontal: true }, tall)
    ).toEqual({ topLeft: [0, 0], topRight: [0, 160], bottomLeft: [90, 0] });
  });
});

describe('preview before converting', () => {
  const drawImage = jest.fn();
  beforeEach(() => {
    drawImage.mockReset();
    URL.createObjectURL = jest.fn(() => 'blob:preview');
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(
        () =>
          ({
            clearRect: jest.fn(),
            setTransform: jest.fn(),
            drawImage,
          }) as unknown as RenderingContext
      );
  });
  afterEach(() => jest.restoreAllMocks());

  const clip = (overrides: Partial<FFmpegFileData>): FFmpegFileData => ({
    file: new File(['video'], 'clip.mp4'),
    duration: { status: 'known', seconds: 4 },
    outputs: [],
    outputTypes: ['sticker'],
    currentTarget: conversionTargetPresets.sticker,
    progress: 0,
    size: 0,
    conversionState: 'idle',
    ...overrides,
  });
  const trimmer = (data: FFmpegFileData) => (
    <VideoTrimmer
      fileData={data}
      disabled={false}
      onChange={jest.fn()}
      onCropChange={jest.fn()}
    />
  );
  /** jsdom never decodes video, so give the element a loaded 1280 × 720 frame. */
  const loadFrame = (container: HTMLElement) => {
    const video = container.querySelector('video')!;
    Object.defineProperties(video, {
      videoWidth: { value: 1280 },
      videoHeight: { value: 720 },
      readyState: { value: 4 },
    });
    fireEvent.loadedMetadata(video);
    fireEvent.loadedData(video);
    return video;
  };
  const preview = () =>
    screen.getByRole('figure', { name: 'Preview before converting' });

  test('shows each selected preset at Discord size with approximate widths', () => {
    const { container } = render(
      trimmer(clip({ outputTypes: ['avatar', 'emote', 'sticker'] }))
    );
    loadFrame(container);

    const figure = preview();
    expect(figure).toHaveTextContent('Preview at Discord size');
    expect(figure).toHaveTextContent(
      'Emoji ≈ 80 px wideAvatar ≈ 512 px wideSticker ≈ 140 px wide'
    );
    const size = (name: string) => {
      const canvas = within(figure).getByRole('img', { name });
      return [canvas.style.width, canvas.style.height];
    };
    expect(size('Sticker preview')).toEqual(['160px', '90px']);
    expect(size('Emoji preview, inline')).toEqual(['22px', '12px']);
    expect(size('Emoji preview, jumbo')).toEqual(['48px', '27px']);
    expect(size('Avatar preview, chat')).toEqual(['40px', '40px']);
    expect(size('Avatar preview, profile')).toEqual(['80px', '80px']);
  });

  test('draws the crop and redraws when it changes', () => {
    const crop: ClipCrop = { x: 0.25, y: 0, width: 0.5, height: 1 };
    const { container, rerender } = render(trimmer(clip({ crop })));
    const video = loadFrame(container);
    expect(drawImage).toHaveBeenLastCalledWith(
      video,
      320,
      0,
      640,
      720,
      0,
      0,
      expect.any(Number),
      expect.any(Number)
    );
    expect(
      within(preview()).getByRole('img', { name: 'Sticker preview' }).style
        .width
    ).toBe('142px');

    rerender(
      trimmer(clip({ crop: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 } }))
    );
    expect(drawImage).toHaveBeenLastCalledWith(
      video,
      640,
      360,
      640,
      360,
      0,
      0,
      expect.any(Number),
      expect.any(Number)
    );
  });

  test('a new frame redraws the preview', () => {
    const { container } = render(trimmer(clip({})));
    const video = loadFrame(container);
    drawImage.mockClear();
    fireEvent.seeked(video);
    expect(drawImage).toHaveBeenCalledTimes(1);
  });

  test('previews only the presets the selection can convert', () => {
    const { container, rerender } = render(
      trimmer(
        clip({
          duration: { status: 'known', seconds: 60 },
          outputTypes: ['sticker', 'emote'],
        })
      )
    );
    loadFrame(container);
    expect(preview()).not.toHaveTextContent('Sticker');
    expect(preview()).toHaveTextContent('Emoji');

    rerender(
      trimmer(
        clip({
          duration: { status: 'known', seconds: 60 },
          outputTypes: ['sticker'],
        })
      )
    );
    expect(
      screen.queryByRole('figure', { name: 'Preview before converting' })
    ).not.toBeInTheDocument();
  });
});

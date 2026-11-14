jest.mock('@ffmpeg/ffmpeg', () => ({ FFmpeg: jest.fn() }));
jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn(),
  toBlobURL: jest.fn(),
}));
jest.mock('../lib/discordgifs/timeline-thumbnails', () => ({
  ...jest.requireActual('../lib/discordgifs/timeline-thumbnails'),
  generateTimelineThumbnails: jest.fn(),
}));

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import VideoTrimmer from '@/app/discordgifs/_components/VideoTrimmer';
import { FFmpegManager, FFmpegRuntime } from '@/lib/discordgifs/ffmpeg-manager';
import { conversionTargetPresets } from '@/lib/discordgifs/conversion-target';
import {
  getFileOutputEligibility,
  hasEligibleIdleFile,
} from '@/lib/discordgifs/eligibility';
import { generateTimelineThumbnails } from '@/lib/discordgifs/timeline-thumbnails';
import { ClipTrim, FFmpegFileData } from '@/lib/types/discordgifs';

const actualThumbnails = jest.requireActual<
  typeof import('@/lib/discordgifs/timeline-thumbnails')
>('../lib/discordgifs/timeline-thumbnails');
const mockedThumbnails = generateTimelineThumbnails as jest.MockedFunction<
  typeof generateTimelineThumbnails
>;
const frame = 1 / 30;

const fileData: FFmpegFileData = {
  file: new File(['video'], 'clip.mp4'),
  duration: { status: 'known', seconds: 60 },
  outputs: [],
  outputTypes: ['sticker'],
  currentTarget: conversionTargetPresets.sticker,
  progress: 0,
  size: 0,
  conversionState: 'idle',
};

// jsdom has no PointerEvent, so pointer events would lose their coordinates.
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
  }
}
beforeAll(() => {
  window.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent;
  Element.prototype.setPointerCapture = () => {};
});

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  // The playback frame loop is exercised through timeupdate instead.
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
  // Generation stays pending unless a test resolves it, as it would mid-decode.
  mockedThumbnails.mockImplementation(() => new Promise(() => {}));
});
afterEach(() => jest.restoreAllMocks());

/** Renders the trimmer with real trim state, as the files reducer would hold it. */
function Harness({
  initialTrim,
  disabled = false,
}: {
  initialTrim?: ClipTrim;
  disabled?: boolean;
}) {
  const [trim, setTrim] = useState<ClipTrim | undefined>(initialTrim);
  const data = { ...fileData, trim };
  return (
    <>
      <VideoTrimmer
        onCropChange={jest.fn()}
        fileData={data}
        disabled={disabled}
        onChange={setTrim}
      />
      <output data-testid='trim'>
        {trim ? `${trim.start}-${trim.end}` : 'whole'}
      </output>
      <button
        disabled={!getFileOutputEligibility(data).eligibleOutputTypes.length}
      >
        Convert
      </button>
    </>
  );
}

const trimText = () => screen.getByTestId('trim').textContent!;
const trimValues = () => trimText().split('-').map(Number);
const player = (container: HTMLElement) => container.querySelector('video')!;
const type = (label: 'Start' | 'End', value: string) => {
  const field = screen.getByLabelText(label);
  fireEvent.change(field, { target: { value } });
  fireEvent.keyDown(field, { key: 'Enter' });
  return field;
};
/** The strip measures 600 px, so 10 px is one second of the 60-second clip. */
const strip = () => {
  const element = screen.getByRole('group', { name: 'Trim timeline' });
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    width: 600,
  } as DOMRect);
  return element;
};
const drag = (target: Element, fromX: number, toX: number) => {
  fireEvent.pointerDown(target, { clientX: fromX, button: 0, pointerId: 1 });
  fireEvent.pointerMove(target, { clientX: toX, pointerId: 1 });
  fireEvent.pointerUp(target, { clientX: toX, pointerId: 1 });
};

test('waits for metadata before allowing a potentially overlong sticker conversion', () => {
  expect(
    hasEligibleIdleFile({
      clip: { ...fileData, duration: { status: 'checking' } },
    })
  ).toBe(false);
});

test('a short selection enables stickers from a long source and Whole clip restores exclusion', () => {
  const { unmount } = render(<Harness />);
  expect(screen.getByText('Convert')).toBeDisabled();
  expect(screen.getByText('Whole clip')).toBeDisabled();
  type('Start', '0:20');
  fireEvent.click(screen.getByText('Use 5 seconds from start'));
  expect(trimText()).toBe('20-25');
  expect(screen.getByText('Convert')).toBeEnabled();
  expect(screen.getByText('5.00 s')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Whole clip'));
  expect(trimText()).toBe('whole');
  expect(screen.getByText('Convert')).toBeDisabled();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
});

test('typed times accept m:ss.cc or seconds, ignore invalid input and seek to the edge', () => {
  const { container } = render(<Harness />);
  expect(screen.getByLabelText('Start')).toHaveValue('0:00.00');
  expect(screen.getByLabelText('End')).toHaveValue('1:00.00');
  type('Start', '0:12.50');
  type('End', '15.25');
  expect(trimText()).toBe('12.5-15.25');
  expect(player(container).currentTime).toBe(15.25);
  expect(screen.getByLabelText('End')).toHaveValue('0:15.25');
  expect(screen.getByText('2.75 s')).toBeInTheDocument();
  const start = type('Start', 'soon');
  expect(start).toHaveValue('0:12.50');
  expect(trimText()).toBe('12.5-15.25');
  fireEvent.change(start, { target: { value: '0:14' } });
  fireEvent.keyDown(start, { key: 'Escape' });
  fireEvent.blur(start);
  expect(start).toHaveValue('0:12.50');
});

test('typed times are clamped inside the clip with the start at least one frame before the end', () => {
  render(<Harness initialTrim={{ start: 10, end: 20 }} />);
  type('Start', '0:30');
  let [start, end] = trimValues();
  expect(end).toBe(20);
  expect(start).toBeCloseTo(20 - frame);
  type('End', '0:05');
  [start, end] = trimValues();
  expect(end - start).toBeCloseTo(frame);
  type('End', '2:00');
  expect(trimValues()[1]).toBe(60);
  type('Start', '0');
  expect(trimText()).toBe('whole');
});

test('Set start and Set end use the playhead, clamped the same way', () => {
  const { container } = render(<Harness />);
  const timeline = strip();
  fireEvent.pointerDown(timeline, { clientX: 300, button: 0 });
  fireEvent.pointerUp(timeline, { clientX: 300 });
  expect(player(container).currentTime).toBe(30);
  fireEvent.click(screen.getByText('Set end'));
  expect(trimText()).toBe('0-30');
  fireEvent.click(screen.getByText('Set start'));
  const [start, end] = trimValues();
  expect(end).toBe(30);
  expect(start).toBeCloseTo(30 - frame);
});

test('handles nudge by a frame, or a second with Shift, and never cross', () => {
  render(<Harness initialTrim={{ start: 10, end: 20 }} />);
  const start = screen.getByRole('slider', { name: 'Selection start' });
  const end = screen.getByRole('slider', { name: 'Selection end' });
  expect(start).toHaveAttribute('tabindex', '0');
  fireEvent.keyDown(start, { key: 'ArrowRight' });
  expect(trimValues()[0]).toBeCloseTo(10 + frame);
  fireEvent.keyDown(start, { key: 'ArrowLeft', shiftKey: true });
  expect(trimValues()[0]).toBeCloseTo(9 + frame);
  fireEvent.keyDown(start, { key: 'End' });
  expect(trimValues()[0]).toBeCloseTo(20 - frame);
  fireEvent.keyDown(end, { key: 'Home' });
  const [s, e] = trimValues();
  expect(e).toBeGreaterThan(s);
  expect(e - s).toBeCloseTo(frame);
  fireEvent.keyDown(end, { key: 'End' });
  expect(trimValues()[1]).toBe(60);
  expect(end).toHaveAttribute('aria-valuetext', '1:00.00');
});

test('dragging the handles and the span edits the selection inside the clip', () => {
  const { container } = render(
    <Harness initialTrim={{ start: 10, end: 20 }} />
  );
  strip();
  const start = screen.getByRole('slider', { name: 'Selection start' });
  const end = screen.getByRole('slider', { name: 'Selection end' });
  const span = container.querySelector('[data-part="span"]')!;
  drag(start, 100, 50);
  expect(trimText()).toBe('5-20');
  expect(player(container).currentTime).toBe(5);
  drag(end, 200, 0);
  expect(trimValues()[1]).toBeCloseTo(5 + frame);
  drag(end, 0, 400);
  expect(trimText()).toBe('5-40');
  // Releasing the end handle returns the playhead to the start.
  expect(player(container).currentTime).toBe(5);
  drag(span, 200, 450);
  expect(trimText()).toBe('25-60');
  drag(span, 500, 100);
  expect(trimText()).toBe('0-35');
  // A press on the span that does not move it only seeks.
  drag(span, 300, 300);
  expect(trimText()).toBe('0-35');
  expect(player(container).currentTime).toBe(30);
});

test('the playhead seeks on click or drag and pauses playback while scrubbing', () => {
  const { container } = render(<Harness />);
  const video = player(container);
  const timeline = strip();
  fireEvent.play(video);
  const grip = screen.getByRole('slider', { name: 'Playhead' });
  fireEvent.pointerDown(grip, { clientX: 0, button: 0 });
  expect(video.pause).toHaveBeenCalled();
  fireEvent.pointerMove(timeline, { clientX: 420 });
  expect(video.currentTime).toBe(42);
  fireEvent.pause(video);
  fireEvent.pointerUp(timeline, { clientX: 420 });
  expect(video.play).toHaveBeenCalledTimes(1);
  expect(trimText()).toBe('whole');
  fireEvent.keyDown(grip, { key: 'ArrowRight', shiftKey: true });
  expect(video.currentTime).toBe(43);
});

test('loop selection is on by default and keeps playback inside the selection', () => {
  const { container } = render(<Harness initialTrim={{ start: 2, end: 5 }} />);
  const video = player(container);
  expect(screen.getByLabelText('Loop selection')).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Play' }));
  expect(video.currentTime).toBe(2);
  expect(video.play).toHaveBeenCalled();
  fireEvent.play(video);
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  video.currentTime = 5;
  fireEvent.timeUpdate(video);
  expect(video.currentTime).toBe(2);
  expect(video.pause).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText('Loop selection'));
  video.currentTime = 5.1;
  fireEvent.timeUpdate(video);
  expect(video.pause).toHaveBeenCalled();
  expect(video.currentTime).toBe(5);
});

test('transport steps frames, shows the time and plays sound only when asked', () => {
  const { container } = render(<Harness />);
  const video = player(container);
  expect(video.muted).toBe(true);
  expect(screen.getByLabelText('Sound')).not.toBeChecked();
  video.currentTime = 1;
  fireEvent.click(screen.getByLabelText('Next frame'));
  expect(video.pause).toHaveBeenCalled();
  expect(video.currentTime).toBeCloseTo(1 + frame);
  fireEvent.click(screen.getByLabelText('Previous frame'));
  fireEvent.click(screen.getByLabelText('Previous frame'));
  expect(video.currentTime).toBeCloseTo(1 - frame);
  expect(screen.getByText('0:00.97')).toBeInTheDocument();
  expect(screen.getByText(/\/ 1:00\.00/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Sound'));
  expect(video.muted).toBe(false);
});

test('unsupported previews explain the limitation without running FFmpeg', () => {
  const { container } = render(<Harness />);
  fireEvent.error(player(container));
  expect(screen.getByText(/cannot preview this format/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Start')).not.toBeInTheDocument();
});

test('trim controls cannot change a queued conversion', () => {
  render(<Harness initialTrim={{ start: 10, end: 20 }} disabled />);
  expect(screen.getByLabelText('Start')).toBeDisabled();
  expect(screen.getByLabelText('End')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
  expect(screen.getByText('Set start')).toBeDisabled();
  const start = screen.getByRole('slider', { name: 'Selection start' });
  expect(start).toHaveAttribute('tabindex', '-1');
  fireEvent.keyDown(start, { key: 'ArrowRight' });
  drag(start, 100, 300);
  expect(trimText()).toBe('10-20');
});

test('the timeline shows browser-drawn thumbnails, or a plain bar when decoding fails', async () => {
  mockedThumbnails.mockImplementation(async (_url, _duration, { onFrame }) => {
    onFrame(0, 'data:image/jpeg;base64,first');
    return true;
  });
  const { unmount } = render(<Harness />);
  expect(mockedThumbnails).toHaveBeenCalledWith(
    'blob:preview',
    60,
    expect.anything()
  );
  const thumbnails = await screen.findByTestId('timeline-thumbnails');
  expect(thumbnails.firstElementChild).toHaveStyle(
    'background-image: url("data:image/jpeg;base64,first")'
  );
  unmount();

  mockedThumbnails.mockImplementation(async (_url, _duration, { onFrame }) => {
    onFrame(0, 'data:image/jpeg;base64,first');
    return false;
  });
  render(<Harness />);
  await waitFor(() =>
    expect(screen.queryByTestId('timeline-thumbnails')).not.toBeInTheDocument()
  );
  expect(screen.getByLabelText('Start')).toBeEnabled();
});

/** A media element stand-in that decodes instantly, or fails when told to. */
function fakeVideo({ failAt }: { failAt?: number } = {}) {
  const element = new EventTarget() as HTMLVideoElement & EventTarget;
  const seeks: number[] = [];
  Object.assign(element, {
    videoWidth: 640,
    videoHeight: 360,
    removeAttribute: jest.fn(),
    load: jest.fn(),
  });
  Object.defineProperty(element, 'src', {
    set: () =>
      queueMicrotask(() => element.dispatchEvent(new Event('loadeddata'))),
  });
  Object.defineProperty(element, 'currentTime', {
    set: (seconds: number) => {
      seeks.push(seconds);
      queueMicrotask(() =>
        element.dispatchEvent(
          new Event(seeks.length === failAt ? 'error' : 'seeked')
        )
      );
    },
  });
  return { element, seeks };
}

test('thumbnails are drawn from evenly spaced seeks and report decode failures', async () => {
  const drawImage = jest.fn();
  let drawn = 0;
  const createCanvas = () =>
    ({
      getContext: () => ({ drawImage }),
      toDataURL: () => `frame-${drawn++}`,
    }) as unknown as HTMLCanvasElement;
  const video = fakeVideo();
  const frames: string[] = [];
  await expect(
    actualThumbnails.generateTimelineThumbnails('blob:clip', 48, {
      onFrame: (index, image) => (frames[index] = image),
      dependencies: { createVideoElement: () => video.element, createCanvas },
    })
  ).resolves.toBe(true);
  expect(video.seeks).toHaveLength(24);
  expect(video.seeks[0]).toBe(1);
  expect(video.seeks[23]).toBe(47);
  expect(frames).toHaveLength(24);
  expect(frames[23]).toBe('frame-23');
  expect(drawImage).toHaveBeenCalledWith(video.element, 0, 0, 128, 72);
  expect(video.element.removeAttribute).toHaveBeenCalledWith('src');

  const broken = fakeVideo({ failAt: 3 });
  await expect(
    actualThumbnails.generateTimelineThumbnails('blob:clip', 48, {
      onFrame: jest.fn(),
      dependencies: { createVideoElement: () => broken.element, createCanvas },
    })
  ).resolves.toBe(false);
  expect(broken.seeks).toHaveLength(3);
});

test.each([100, 700_000])(
  'trims once, before expensive encoding for a %i-byte file',
  async (size) => {
    const exec = jest.fn(async () => 0);
    const runtime: FFmpegRuntime = {
      exec,
      load: jest.fn(async () => true),
      writeFile: jest.fn(async () => true),
      readFile: jest.fn(async () => new Uint8Array(100)),
      deleteFile: jest.fn(async () => true),
      on: jest.fn(),
      off: jest.fn(),
      terminate: jest.fn(),
    };
    const manager = new FFmpegManager({
      createFFmpeg: () => runtime,
      toBlobURL: async (url) => url,
      fetchFile: async () => new Uint8Array(size),
      createObjectURL: () => 'blob:result',
      createId: () => 'test',
    });
    await manager.load();
    manager.setFileConfig({
      file: new File([new Uint8Array(size)], 'long.mp4'),
      target: conversionTargetPresets.sticker,
      trim: { start: 20, end: 23 },
      crop: { x: 0.25, y: 0, width: 0.5, height: 1 },
    });
    await manager.convert();
    const commands = exec.mock.calls as unknown as string[][][];
    expect(commands[0][0].join(' ')).toContain(
      "crop='max(1,iw*0.5)':'max(1,ih*1)':iw*0.25:ih*0:exact=1,scale="
    );
    expect(commands[0][0].slice(0, 6)).toEqual([
      '-ss',
      '20',
      '-t',
      '3',
      '-i',
      'input-test.mp4',
    ]);
    if (size > 600_000) {
      expect(commands.length).toBeGreaterThan(1);
      for (const [command] of commands.slice(1)) {
        expect(command).not.toContain('-ss');
        expect(command.join(' ')).not.toContain('crop=');
        expect(command).toContain('optimized-test.mp4');
      }
    } else {
      for (const [command] of commands) expect(command).toContain('-ss');
    }
  }
);

test('removing a clip stops its thumbnail generation', () => {
  const { unmount } = render(<Harness />);
  unmount();
  expect(mockedThumbnails.mock.calls[0][2].signal?.aborted).toBe(true);
});

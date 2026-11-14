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
    acceptedFiles: mockAcceptedFiles,
    fileRejections: [],
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    open: mockOpen,
  }),
}));
jest.mock('../hooks/discordgifs/useFFmpeg', () => ({
  useFFmpeg: () => ({ ffmpegRef: { current: {} }, isLoaded: true }),
}));
jest.mock('../hooks/discordgifs/useFilePaste', () => ({
  useFilePaste: jest.fn(),
}));
jest.mock('../lib/discordgifs/index', () => ({
  convert: jest.fn(async () => undefined),
}));
jest.mock('../lib/discordgifs/file-duration', () => ({
  readFileDuration: jest.fn(async () => 60),
}));

import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import FileDropzone from '@/app/discordgifs/_components/FileDropzone';
import { convert } from '@/lib/discordgifs';

const mockAcceptedFiles: File[] = [];
const mockOpen = jest.fn();
const frame = 1 / 30;
let played: HTMLMediaElement[];
let paused: HTMLMediaElement[];

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
  mockAcceptedFiles.splice(0, mockAcceptedFiles.length);
  mockOpen.mockClear();
  jest.mocked(convert).mockClear();
  played = [];
  paused = [];
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    played.push(this);
    return Promise.resolve();
  });
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    paused.push(this);
  });
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
});
afterEach(() => jest.restoreAllMocks());

/** Loads clips through the dropzone and waits until every card can be edited. */
async function loadClips(...names: string[]) {
  mockAcceptedFiles.push(...names.map((name) => new File([name], name)));
  const { container } = render(<FileDropzone />);
  await waitFor(() =>
    expect(screen.getAllByRole('slider', { name: 'Playhead' })).toHaveLength(
      names.length
    )
  );
  return Array.from(container.querySelectorAll('video'));
}

const press = (
  key: string,
  options: KeyboardEventInit = {},
  target: Element = document.body
) => fireEvent.keyDown(target, { key, ...options });
const startField = (index = 0) =>
  screen.getAllByLabelText('Start')[index] as HTMLInputElement;
const endField = (index = 0) =>
  screen.getAllByLabelText('End')[index] as HTMLInputElement;

test('each shortcut drives the clip editor', async () => {
  const [video] = await loadClips('clip.mp4');

  press(' ');
  expect(played).toEqual([video]);
  fireEvent.play(video);
  press(' ');
  expect(paused).toContain(video);
  fireEvent.pause(video);

  video.currentTime = 10;
  press('ArrowRight');
  expect(video.currentTime).toBeCloseTo(10 + frame);
  press('ArrowLeft');
  press('ArrowLeft');
  expect(video.currentTime).toBeCloseTo(10 - frame);
  press('ArrowRight', { shiftKey: true });
  expect(video.currentTime).toBeCloseTo(11 - frame);
  press('ArrowLeft', { shiftKey: true });
  press('ArrowLeft', { shiftKey: true });
  expect(video.currentTime).toBeCloseTo(9 - frame);

  video.currentTime = 10;
  press('i');
  expect(startField().value).toBe('0:10.00');
  video.currentTime = 14;
  press('O');
  expect(endField().value).toBe('0:14.00');

  press('Home');
  expect(video.currentTime).toBe(10);
  press('End');
  expect(video.currentTime).toBe(14);

  press('Enter', { ctrlKey: true });
  expect(Object.keys(jest.mocked(convert).mock.calls[0][1])).toEqual([
    'clip.mp4',
  ]);
  await waitFor(() => expect(screen.getByText('Convert All')).toBeEnabled());

  press('o', { ctrlKey: true });
  expect(mockOpen).toHaveBeenCalledTimes(1);
});

test('nothing fires while typing in a field, and focused sliders keep their keys', async () => {
  const [video] = await loadClips('clip.mp4');
  video.currentTime = 10;
  const field = startField();
  act(() => field.focus());
  for (const [key, options] of [
    [' ', {}],
    ['i', {}],
    ['ArrowRight', {}],
    ['End', {}],
    ['Enter', { ctrlKey: true }],
    ['o', { ctrlKey: true }],
  ] as const)
    press(key, options, field);
  expect(played).toEqual([]);
  expect(video.currentTime).toBe(10);
  expect(field.value).toBe('0:00.00');
  expect(convert).not.toHaveBeenCalled();
  expect(mockOpen).not.toHaveBeenCalled();

  // Home on the playhead slider goes to the clip's start, not the selection's.
  fireEvent.change(field, { target: { value: '0:05' } });
  fireEvent.keyDown(field, { key: 'Enter' });
  const playhead = screen.getByRole('slider', { name: 'Playhead' });
  act(() => playhead.focus());
  press('Home', {}, playhead);
  expect(video.currentTime).toBe(0);
  press('ArrowRight', { shiftKey: true }, playhead);
  expect(video.currentTime).toBe(1);
});

test('Space activates a focused button but plays from a focused crop handle', async () => {
  const [video] = await loadClips('clip.mp4');
  const loop = screen.getByRole('switch', { name: 'Loop selection' });
  act(() => loop.focus());
  // Not cancelled, so the browser goes on to toggle the switch itself.
  expect(press(' ', {}, loop)).toBe(true);
  expect(played).toEqual([]);

  Object.defineProperty(video, 'videoWidth', { value: 640 });
  Object.defineProperty(video, 'videoHeight', { value: 360 });
  fireEvent.loadedMetadata(video);
  const crop = screen.getByRole('button', { name: 'Move crop' });
  act(() => crop.focus());
  expect(press(' ', {}, crop)).toBe(false);
  expect(played).toEqual([video]);
});

test('only the active card reacts when two clips are loaded', async () => {
  const [first, second] = await loadClips('one.mp4', 'two.mp4');

  // The newest clip is active until the user works on another one.
  press(' ');
  expect(played).toEqual([second]);

  fireEvent.pointerDown(screen.getByText('one.mp4'));
  first.currentTime = 4;
  second.currentTime = 8;
  press(' ');
  press('i');
  press('ArrowRight', { shiftKey: true });
  expect(played).toEqual([second, first]);
  expect(startField(0).value).toBe('0:04.00');
  expect(startField(1).value).toBe('0:00.00');
  expect(first.currentTime).toBe(5);
  expect(second.currentTime).toBe(8);

  // Focusing a control in the other card makes that card active.
  act(() => screen.getAllByRole('button', { name: 'Set start' })[1].focus());
  second.currentTime = 4;
  press('o', {}, document.activeElement!);
  expect(endField(1).value).toBe('0:04.00');
  expect(endField(0).value).toBe('1:00.00');

  press('Enter', { ctrlKey: true });
  expect(Object.keys(jest.mocked(convert).mock.calls[0][1])).toEqual([
    'two.mp4',
  ]);
  await waitFor(() => expect(screen.getByText('Convert All')).toBeEnabled());
});

test('keys pressed outside every clip card leave the clips alone', async () => {
  const [video] = await loadClips('clip.mp4');
  const preset = screen.getByRole('button', { name: /Emoji/ });
  act(() => preset.focus());
  video.currentTime = 10;
  press(' ', {}, preset);
  press('i', {}, preset);
  press('Enter', { ctrlKey: true }, preset);
  expect(played).toEqual([]);
  expect(startField().value).toBe('0:00.00');
  expect(convert).not.toHaveBeenCalled();

  // Opening a file is page-wide.
  press('O', { ctrlKey: true }, preset);
  expect(mockOpen).toHaveBeenCalledTimes(1);
});

test('the hint row lists the shortcuts under the timeline', async () => {
  await loadClips('clip.mp4');
  const hints = screen.getByRole('list', { name: 'Keyboard shortcuts' });
  expect(hints).toHaveTextContent('Space play');
  expect(hints).toHaveTextContent('I/O start/end');
  expect(hints).toHaveTextContent('Ctrl+Enter convert');
  expect(hints).toHaveTextContent('Ctrl+O open');
});

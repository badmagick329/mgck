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
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import FileDropzone from '@/app/discordgifs/_components/FileDropzone';
import LargeFileWarning from '@/app/discordgifs/_components/LargeFileWarning';
import { readFileDuration } from '@/lib/discordgifs/file-duration';

const mockDropzone: { files: File[] } = { files: [] };
const mockFFmpegRef = {
  current: {
    loaded: jest.fn(() => true),
    load: jest.fn(async () => undefined),
    terminate: jest.fn(),
    convertSinglePass: jest.fn(),
  },
};

const modeButton = (name: 'Simple' | 'Advanced') =>
  within(screen.getByRole('group', { name: 'Converter mode' })).getByRole(
    'button',
    { name }
  );
const startField = () => screen.getByRole('textbox', { name: 'Start' });

beforeEach(() => {
  mockDropzone.files = [];
  window.history.replaceState(null, '', '/discordgifs');
  URL.createObjectURL = jest.fn(() => 'blob:clip');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
  mockFFmpegRef.current.convertSinglePass.mockReset();
});
afterEach(() => jest.restoreAllMocks());

describe('large input warning', () => {
  const sized = (bytes: number) => {
    const file = new File(['x'], 'big.mp4');
    Object.defineProperty(file, 'size', { value: bytes });
    return file;
  };
  const coarsePointer = (coarse: boolean) => {
    window.matchMedia = jest.fn(() => ({ matches: coarse }) as MediaQueryList);
  };

  test('desktop warns past 2 GB only', () => {
    coarsePointer(false);
    const { rerender } = render(<LargeFileWarning file={sized(1.9e9)} />);
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<LargeFileWarning file={sized(2.1e9)} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      "browsers can't load files much over 2 GB"
    );
  });

  test('a touch device warns past 250 MB', () => {
    coarsePointer(true);
    const { rerender } = render(<LargeFileWarning file={sized(2.4e8)} />);
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<LargeFileWarning file={sized(2.6e8)} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'files over 250 MB often fail on phones'
    );
  });
});

describe('Advanced mode', () => {
  test('the switch changes mode and keeps the URL linkable', () => {
    render(<FileDropzone />);
    expect(modeButton('Simple')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Output format' })).toBeInTheDocument();

    fireEvent.click(modeButton('Advanced'));
    expect(modeButton('Advanced')).toHaveAttribute('aria-pressed', 'true');
    expect(window.location.search).toBe('?mode=advanced');
    expect(screen.queryByRole('heading', { name: 'Output format' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Convert All' })).toBeNull();

    fireEvent.click(modeButton('Simple'));
    expect(window.location.search).toBe('');
    expect(screen.getByRole('button', { name: 'Convert All' })).toBeInTheDocument();
  });

  test('?mode=advanced opens Advanced mode', () => {
    window.history.replaceState(null, '', '/discordgifs?mode=advanced');
    render(<FileDropzone />);
    expect(modeButton('Advanced')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('heading', { name: 'Output format' })).toBeNull();
  });

  test('holds one clip: opening another replaces it', async () => {
    window.history.replaceState(null, '', '/discordgifs?mode=advanced');
    const { rerender } = render(<FileDropzone />);
    // Files arrive after mount, once the mode has been read from the URL.
    mockDropzone.files = [new File(['one'], 'one.mp4')];
    rerender(<FileDropzone />);
    expect(
      await screen.findByRole('button', { name: 'Remove one.mp4' })
    ).toBeInTheDocument();

    mockDropzone.files = [new File(['two'], 'two.mp4')];
    rerender(<FileDropzone />);
    expect(
      await screen.findByRole('button', { name: 'Remove two.mp4' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove one.mp4' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(1);
  });

  test('switching modes keeps the clip and its trim', async () => {
    mockDropzone.files = [new File(['one'], 'one.mp4')];
    render(<FileDropzone />);
    const start = await screen.findByRole('textbox', { name: 'Start' });
    fireEvent.change(start, { target: { value: '0:01.50' } });
    fireEvent.blur(start);
    expect(startField()).toHaveValue('0:01.50');

    fireEvent.click(modeButton('Advanced'));
    expect(screen.getByRole('button', { name: 'Remove one.mp4' })).toBeInTheDocument();
    expect(startField()).toHaveValue('0:01.50');

    fireEvent.change(startField(), { target: { value: '0:02.00' } });
    fireEvent.blur(startField());
    fireEvent.click(modeButton('Simple'));
    // The simple card for the same file takes Advanced mode's edit back.
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(1);
    expect(startField()).toHaveValue('0:02.00');
  });

  test('converts the ticked file types and lists them in Made this session', async () => {
    window.history.replaceState(null, '', '/discordgifs?mode=advanced');
    const big = new Blob([new Uint8Array(21 * 1000 * 1000)], { type: 'video/mp4' });
    mockFFmpegRef.current.convertSinglePass.mockImplementation(
      async (_job, { onOutput }) => {
        onOutput({ fileType: 'gif', name: 'one.gif', blob: new Blob(['gif'], { type: 'image/gif' }) });
        onOutput({ fileType: 'mp4', name: 'one.mp4', blob: big });
        return [];
      }
    );
    const { rerender } = render(<FileDropzone />);
    mockDropzone.files = [new File(['one'], 'one.mp4')];
    rerender(<FileDropzone />);
    const results = await screen.findByRole('region', { name: 'Made this session' });
    expect(within(results).getByText(/Nothing yet/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /MP4/ }));
    const convert = screen.getByRole('button', { name: 'Convert to GIF + MP4' });
    await act(async () => fireEvent.click(convert));

    const job = mockFFmpegRef.current.convertSinglePass.mock.calls[0][0];
    expect(job).toMatchObject({
      settings: { fileTypes: ['gif', 'mp4'], fps: 15 },
      outputSeconds: 4,
    });
    expect(within(results).getByRole('link', { name: 'Download one.gif' })).toHaveAttribute(
      'download',
      'one.gif'
    );
    expect(within(results).getByText(/over Discord's 20 MB free upload limit/)).toBeInTheDocument();
    expect(within(results).getAllByText(/over Discord's/)).toHaveLength(1);
  });
});

describe('Advanced mode rotate, flip, speed and direction', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn(() => ({ matches: false }) as MediaQueryList);
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(
        () =>
          ({
            clearRect: jest.fn(),
            setTransform: jest.fn(),
            drawImage: jest.fn(),
          }) as unknown as RenderingContext
      );
  });

  /** Opens a clip in Advanced mode with a decoded 1280 × 720 frame and sound. */
  async function openClip(name = 'one.mp4') {
    window.history.replaceState(null, '', '/discordgifs?mode=advanced');
    mockDropzone.files = [];
    const view = render(<FileDropzone />);
    mockDropzone.files = [new File([name], name)];
    view.rerender(<FileDropzone />);
    await screen.findByRole('button', { name: `Remove ${name}` });
    loadFrame(view.container);
    return view;
  }
  function loadFrame(container: HTMLElement) {
    const video = container.querySelector('video')!;
    Object.defineProperties(video, {
      videoWidth: { value: 1280, configurable: true },
      videoHeight: { value: 720, configurable: true },
      readyState: { value: 4, configurable: true },
      audioTracks: { value: { length: 1 }, configurable: true },
    });
    fireEvent.loadedMetadata(video);
    fireEvent.loadedData(video);
    return video;
  }
  const details = () => screen.getByLabelText('Output details');
  const press = (name: string) =>
    fireEvent.click(screen.getByRole('button', { name }));
  const convertButton = () => screen.getByRole('button', { name: /^Convert to/ });

  test('a quarter turn swaps the output size, the preview and the crop readout', async () => {
    await openClip();
    expect(details()).toHaveTextContent('480 × 270');
    const drawing = screen.getByRole('img', { name: 'Output preview drawing' });
    expect([drawing.style.width, drawing.style.height]).toEqual(['300px', '169px']);

    press('Rotate right');
    expect(details()).toHaveTextContent('480 × 854');
    expect(screen.getByText('Turned 90°')).toBeInTheDocument();
    expect([drawing.style.width, drawing.style.height]).toEqual(['169px', '300px']);

    // 16:9 is picked in output pixels, so on the turned clip the box is a
    // 405 × 720 strip of the source and reads as 720 × 405.
    press('16:9');
    expect(screen.getByText('Crop 720 × 405 px')).toBeInTheDocument();
    expect(details()).toHaveTextContent('480 × 270');

    press('Rotate right');
    expect(screen.getByText('Turned 180°')).toBeInTheDocument();
    expect(details()).toHaveTextContent('480 × 270');
  });

  test('a locked ratio is re-fitted when a turn swaps it', async () => {
    await openClip();
    press('16:9');
    // The whole 16:9 frame is no crop at all.
    expect(screen.getByText('Full frame. Drag a corner to crop.')).toBeInTheDocument();

    press('Rotate left');
    expect(screen.getByText('Crop 720 × 405 px')).toBeInTheDocument();
    expect(details()).toHaveTextContent('480 × 270');

    press('Rotate right');
    expect(screen.getByText('Full frame. Drag a corner to crop.')).toBeInTheDocument();
  });

  test('the job carries every edit, and the preview labels what it cannot play', async () => {
    mockFFmpegRef.current.convertSinglePass.mockResolvedValue([]);
    const { container } = await openClip();
    press('Rotate right');
    press('Flip ↔');
    fireEvent.change(screen.getByRole('slider', { name: 'Speed' }), {
      target: { value: '10' },
    });
    press('Boomerang');

    expect(screen.getByRole('button', { name: 'Flip ↔' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Boomerang' })).toHaveAttribute('aria-pressed', 'true');
    // The editor plays at the chosen speed, so the live preview does too.
    expect(container.querySelector('video')!.playbackRate).toBe(2);
    const preview = screen.getByRole('figure', { name: 'Output preview' });
    expect(preview).toHaveTextContent('live · 2×');
    expect(preview).toHaveTextContent(
      'The preview plays forward. Boomerang is applied when you convert.'
    );
    // A 4 s selection at 2× is 2 s, played there and back.
    expect(details()).toHaveTextContent('4.0 s');
    expect(details()).toHaveTextContent('60 frames');

    await act(async () => fireEvent.click(convertButton()));
    expect(mockFFmpegRef.current.convertSinglePass.mock.calls[0][0]).toMatchObject({
      settings: {
        rotation: 90,
        flipHorizontal: true,
        flipVertical: false,
        speed: 2,
        direction: 'boomerang',
      },
      width: 480,
      outputSeconds: 4,
    });
  });

  test('Keep sound says when the speed or direction drops the sound', async () => {
    await openClip();
    fireEvent.click(screen.getByText('Quality & looping'));
    fireEvent.click(screen.getByRole('switch', { name: 'Keep sound in MP4' }));
    expect(screen.queryByText(/^No sound/)).toBeNull();

    press('Reverse');
    expect(screen.getByText('No sound in Reverse.')).toBeInTheDocument();

    press('Forward');
    fireEvent.change(screen.getByRole('slider', { name: 'Speed' }), {
      target: { value: '12' },
    });
    expect(
      screen.getByText('No sound at 3×; it keeps up from 0.5× to 2×.')
    ).toBeInTheDocument();
  });

  test('a selection past the frame-memory limit is blocked until trimmed', async () => {
    // Short enough for a forward GIF, too long to reverse.
    jest.mocked(readFileDuration).mockResolvedValueOnce(100);
    await openClip();
    expect(convertButton()).toBeEnabled();

    press('Reverse');
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Reverse keeps every frame in browser memory, so this selection is too long to convert here\. Trim it to \d+:\d\d\.\d\d or less/
    );
    expect(convertButton()).toBeDisabled();

    press('Boomerang');
    expect(screen.getByRole('alert')).toHaveTextContent(/^Boomerang keeps every frame/);

    const end = screen.getByRole('textbox', { name: 'End' });
    fireEvent.change(end, { target: { value: '0:10.00' } });
    fireEvent.blur(end);
    expect(screen.queryByText(/keeps every frame/)).toBeNull();
    expect(convertButton()).toBeEnabled();
  });

  test('a long forward GIF is blocked; the same selection as MP4 is not', async () => {
    jest.mocked(readFileDuration).mockResolvedValueOnce(600);
    await openClip();
    expect(screen.getByRole('alert')).toHaveTextContent(
      /^Making a GIF keeps every frame in browser memory, so this selection is too long to convert here\. Trim it to \d+:\d\d\.\d\d or less/
    );
    expect(convertButton()).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /MP4/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /GIF/ }));
    expect(screen.queryByText(/keeps every frame/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Convert to MP4' })).toBeEnabled();
  });

  test('a phone gets a lower frame-memory limit than a desktop', async () => {
    const limitText = async (phone: boolean) => {
      window.matchMedia = jest.fn(() => ({ matches: phone }) as MediaQueryList);
      jest.mocked(readFileDuration).mockResolvedValueOnce(600);
      const view = await openClip();
      press('Reverse');
      const text = screen.getByRole('alert').textContent!;
      view.unmount();
      const [minutes, seconds] = text.match(/Trim it to (\d+):(\d\d\.\d\d)/)!.slice(1);
      return Number(minutes) * 60 + Number(seconds);
    };
    const desktop = await limitText(false);
    const phone = await limitText(true);
    expect(phone).toBeGreaterThan(0);
    expect(phone).toBeLessThan(desktop);
  });

  test('a new clip starts upright and forward, keeping the speed', async () => {
    const view = await openClip();
    press('Rotate right');
    press('Flip ↕');
    press('Reverse');
    fireEvent.change(screen.getByRole('slider', { name: 'Speed' }), {
      target: { value: '8' },
    });

    mockDropzone.files = [new File(['two'], 'two.mp4')];
    view.rerender(<FileDropzone />);
    await screen.findByRole('button', { name: 'Remove two.mp4' });
    expect(screen.queryByText(/^Turned/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Flip ↕' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Forward' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('slider', { name: 'Speed' })).toHaveAttribute('aria-valuetext', '1.5×');
  });
});

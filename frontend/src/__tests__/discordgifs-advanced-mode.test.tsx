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

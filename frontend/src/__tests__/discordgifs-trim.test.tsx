jest.mock('@ffmpeg/ffmpeg', () => ({ FFmpeg: jest.fn() }));
jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn(),
  toBlobURL: jest.fn(),
}));

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import VideoTrimmer from '@/app/discordgifs/_components/VideoTrimmer';
import { FFmpegManager, FFmpegRuntime } from '@/lib/discordgifs/ffmpeg-manager';
import { conversionTargetPresets } from '@/lib/discordgifs/conversion-target';
import {
  getFileOutputEligibility,
  hasEligibleIdleFile,
} from '@/lib/discordgifs/eligibility';
import { ClipTrim, FFmpegFileData } from '@/lib/types/discordgifs';

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

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
});
afterEach(() => jest.restoreAllMocks());

test('waits for metadata before allowing a potentially overlong sticker conversion', () => {
  expect(
    hasEligibleIdleFile({
      clip: { ...fileData, duration: { status: 'checking' } },
    })
  ).toBe(false);
});

test('a short selection enables stickers from a long source and reset restores exclusion', () => {
  function Harness() {
    const [trim, setTrim] = useState<ClipTrim>();
    const data = { ...fileData, trim };
    return (
      <>
        <VideoTrimmer fileData={data} disabled={false} onChange={setTrim} />
        <button
          disabled={!getFileOutputEligibility(data).eligibleOutputTypes.length}
        >
          Convert
        </button>
      </>
    );
  }
  const { container, unmount } = render(<Harness />);
  expect(screen.getByText('Convert')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Clip start'), {
    target: { value: '20' },
  });
  fireEvent.click(screen.getByText('Use 5 seconds from start'));
  expect(screen.getByText('Convert')).toBeEnabled();
  expect(screen.getByText(/Selected: 5.00 seconds/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Play selection'));
  const player = container.querySelector('video')!;
  expect(player.currentTime).toBe(20);
  player.currentTime = 25.1;
  fireEvent.timeUpdate(player);
  expect(player.pause).toHaveBeenCalled();
  expect(player.currentTime).toBe(25);
  fireEvent.click(screen.getByText('Use whole clip'));
  expect(screen.getByText('Convert')).toBeDisabled();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
});

test('unsupported previews explain the limitation without running FFmpeg', () => {
  const { container } = render(
    <VideoTrimmer fileData={fileData} disabled={false} onChange={jest.fn()} />
  );
  fireEvent.error(container.querySelector('video')!);
  expect(screen.getByText(/cannot preview this format/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Clip start')).not.toBeInTheDocument();
});

test('trim controls cannot change a queued conversion', () => {
  render(<VideoTrimmer fileData={fileData} disabled onChange={jest.fn()} />);
  expect(screen.getByLabelText('Clip start')).toBeDisabled();
  expect(screen.getByLabelText('Clip end')).toBeDisabled();
  expect(screen.getByText('Play selection')).toBeDisabled();
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
    });
    await manager.convert();
    const commands = exec.mock.calls as unknown as string[][][];
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
        expect(command).toContain('optimized-test.mp4');
      }
    } else {
      for (const [command] of commands) expect(command).toContain('-ss');
    }
  }
);

test('looping returns to the selection start, and disabling it stops at the end', () => {
  const { container } = render(
    <VideoTrimmer
      fileData={{ ...fileData, trim: { start: 2, end: 5 } }}
      disabled={false}
      onChange={jest.fn()}
    />
  );
  const player = container.querySelector('video')!;
  fireEvent.click(screen.getByLabelText('Loop selection'));
  fireEvent.click(screen.getByText('Play selection'));
  player.currentTime = 5;
  fireEvent.timeUpdate(player);
  expect(player.currentTime).toBe(2);
  expect(player.play).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByLabelText('Loop selection'));
  player.currentTime = 5;
  fireEvent.timeUpdate(player);
  expect(player.currentTime).toBe(5);
  expect(player.pause).toHaveBeenCalled();
});

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
  }),
}));

jest.mock('../hooks/discordgifs/useFFmpeg', () => ({
  useFFmpeg: () => ({
    ffmpegRef: { current: {} },
    isLoaded: true,
  }),
}));

jest.mock('../hooks/discordgifs/useFilePaste', () => ({
  useFilePaste: jest.fn(),
}));

jest.mock('../lib/discordgifs/index', () => ({
  convert: jest.fn(async () => undefined),
}));
jest.mock('../lib/discordgifs/file-duration', () => ({
  readFileDuration: jest.fn(async () => null),
}));

import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';

import { convert } from '@/lib/discordgifs';
import FileDropzone from '@/app/discordgifs/_components/FileDropzone';
import PresetSelector from '@/app/discordgifs/_components/PresetSelector';
import {
  ConversionPresetId,
  conversionPresetOrder,
  conversionTargetPresets,
  defaultConversionPresetSelection,
  orderConversionPresetIds,
} from '@/lib/discordgifs/conversion-target';
import { FilesState, filesStateReducer } from '@/lib/discordgifs/files-state';
import { FFmpegFileData } from '@/lib/types/discordgifs';
import { readFileDuration } from '@/lib/discordgifs/file-duration';

const mockAcceptedFiles: File[] = [];

describe('Discord preset selection', () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => 'blob:preview');
    URL.revokeObjectURL = jest.fn();
    mockAcceptedFiles.splice(0, mockAcceptedFiles.length);
    jest.mocked(readFileDuration).mockResolvedValue(null);
  });

  test('displays all presets in conversion order with accessible pressed states', () => {
    render(<PresetSelectorHarness />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons.map((button) => button.textContent)).toEqual([
      expect.stringContaining('😄 Emoji'),
      expect.stringContaining('🏷️ Sticker'),
      expect.stringContaining('👤 Avatar'),
    ]);
    expect(conversionPresetOrder).toEqual(['emote', 'sticker', 'avatar']);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('Animated GIF · under 256 KiB')).toBeTruthy();
    expect(screen.getByText('Animated PNG · under 512 KiB')).toBeTruthy();
    expect(screen.getByText('Animated GIF · under 8 MiB')).toBeTruthy();
    expect(screen.queryByText('Best for server emoji')).toBeNull();
    expect(screen.queryByText('Keep clips to 5 seconds or less')).toBeNull();
    expect(screen.queryByText('Requires Discord Nitro')).toBeNull();
    expect(
      screen.queryByText('Select one or more formats for every file.')
    ).toBeNull();

    const selectedLabel = screen.getByText('Selected');
    expect(selectedLabel).toHaveClass('sr-only');
    expect(screen.getByRole('button', { name: /😄 Emoji.*Selected/i })).toBe(
      buttons[0]
    );
    expect(screen.getByText('✓').getAttribute('aria-hidden')).toBe('true');
  });

  test('selects and deselects Sticker and Avatar while preserving preset order', () => {
    render(<PresetSelectorHarness />);

    const sticker = screen.getByRole('button', { name: /🏷️ Sticker/i });
    const avatar = screen.getByRole('button', { name: /👤 Avatar/i });
    fireEvent.click(avatar);
    fireEvent.click(sticker);
    expect(sticker.getAttribute('aria-pressed')).toBe('true');
    expect(avatar.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(sticker);
    fireEvent.click(avatar);
    expect(sticker.getAttribute('aria-pressed')).toBe('false');
    expect(avatar.getAttribute('aria-pressed')).toBe('false');
  });

  test('card conversion selects only that clip while Convert All selects the batch', async () => {
    jest.mocked(convert).mockClear();
    mockAcceptedFiles.push(
      new File(['one'], 'one.mp4'),
      new File(['two'], 'two.mp4')
    );
    render(<FileDropzone />);
    const buttons = screen.getAllByRole('button', { name: 'Convert clip' });
    await waitFor(() => expect(buttons[0]).toBeEnabled());
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    fireEvent.click(buttons[0]);
    expect(Object.keys(jest.mocked(convert).mock.calls[0][1])).toEqual([
      'one.mp4',
    ]);
    await waitFor(() => expect(screen.getByText('Convert All')).toBeEnabled());
    fireEvent.click(screen.getByText('Convert All'));
    expect(Object.keys(jest.mocked(convert).mock.calls[1][1])).toEqual([
      'one.mp4',
      'two.mp4',
    ]);
    await waitFor(() => expect(screen.getByText('Convert All')).toBeEnabled());
  });

  test('allows an empty selection and disables conversion', async () => {
    mockAcceptedFiles.push(new File(['clip'], 'clip.mp4'));
    render(<FileDropzone />);

    const convertButton = screen.getByRole('button', { name: 'Convert All' });
    await waitFor(() => expect(convertButton).not.toBeDisabled());
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    expect(
      screen.queryByText(
        '🔒 Everything happens in your browser. Your files never leave your device.'
      )
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /😄 Emoji/i }));

    expect(convertButton).toBeDisabled();
    expect(screen.getByRole('status').textContent).toBe(
      'Select at least one output to convert.'
    );
  });

  test('disables every preset control while processing', () => {
    render(
      <PresetSelector
        selectedPresetIds={['emote']}
        onChange={jest.fn()}
        disabled
      />
    );

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });

  test('disables conversion when an overlong file has only Sticker selected', async () => {
    jest.mocked(readFileDuration).mockResolvedValueOnce(7);
    mockAcceptedFiles.push(new File(['clip'], 'long.mp4'));
    render(<FileDropzone />);

    fireEvent.click(screen.getByRole('button', { name: /🏷️ Sticker/i }));
    fireEvent.click(screen.getByRole('button', { name: /😄 Emoji/i }));

    const warning = await screen.findByRole('alert');
    expect(warning).toHaveTextContent('Choose a shorter segment above');
    expect(warning).toHaveTextContent('nothing eligible to convert');
    expect(screen.getByRole('button', { name: 'Convert All' })).toBeDisabled();
  });
});

describe('Discord preset state', () => {
  test('new files receive the active global selection', () => {
    const first = new File(['one'], 'one.mp4');
    const second = new File(['two'], 'two.gif');
    let state = filesStateReducer(
      {},
      {
        type: 'addFile',
        payload: { file: first, outputTypes: ['sticker', 'avatar'] },
      }
    );
    state = filesStateReducer(state, {
      type: 'addFiles',
      payload: { files: [second], outputTypes: ['avatar'] },
    });

    expect(state[first.name].outputTypes).toEqual(['sticker', 'avatar']);
    expect(state[second.name].outputTypes).toEqual(['avatar']);
    expect(state[second.name].currentTarget).toBe(
      conversionTargetPresets.avatar
    );
  });

  test('global changes update idle files without modifying other states', () => {
    const idle = fileData('idle', 'idle');
    const busy = fileData('busy', 'busy');
    const optimizing = fileData('optimizing', 'optimizing');
    const converting = fileData('converting', 'converting');
    const done = fileData('done', 'done');
    const state: FilesState = { idle, busy, optimizing, converting, done };

    const result = filesStateReducer(state, {
      type: 'updateIdleOutputTypes',
      payload: { outputTypes: ['sticker', 'avatar'] },
    });

    expect(result.idle.outputTypes).toEqual(['sticker', 'avatar']);
    expect(result.idle.outputTypes).not.toBe(idle.outputTypes);
    expect(result.idle.outputs).toBe(idle.outputs);
    expect(result.idle.progress).toBe(idle.progress);
    expect(result.idle.size).toBe(idle.size);
    expect(result.idle.currentTarget).toBe(idle.currentTarget);
    expect(result.busy).toBe(busy);
    expect(result.optimizing).toBe(optimizing);
    expect(result.converting).toBe(converting);
    expect(result.done).toBe(done);
  });

  test('normalizes target processing independently of click order', () => {
    expect(orderConversionPresetIds(['avatar', 'emote', 'sticker'])).toEqual([
      'emote',
      'sticker',
      'avatar',
    ]);
  });
});

function PresetSelectorHarness() {
  const [selectedPresetIds, setSelectedPresetIds] = useState<
    ConversionPresetId[]
  >([...defaultConversionPresetSelection]);
  return (
    <PresetSelector
      selectedPresetIds={selectedPresetIds}
      onChange={setSelectedPresetIds}
    />
  );
}

function fileData(
  name: string,
  conversionState: FFmpegFileData['conversionState']
): FFmpegFileData {
  return {
    file: new File([name], `${name}.mp4`),
    outputs: [{ name: 'existing', url: 'blob:existing', type: 'emote' }],
    outputTypes: ['emote'],
    progress: 0.4,
    size: 1234,
    currentTarget: conversionTargetPresets.emote,
    conversionState,
    duration: { status: 'unknown' },
  };
}

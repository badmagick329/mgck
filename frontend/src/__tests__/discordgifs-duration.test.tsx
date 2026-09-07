import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import ConvertedFile from '@/app/discordgifs/_components/ConvertedFile';
import { convert } from '@/lib/discordgifs';
import { conversionTargetPresets } from '@/lib/discordgifs/conversion-target';
import {
  getFileOutputEligibility,
  hasEligibleIdleFile,
} from '@/lib/discordgifs/eligibility';
import { readFileDuration } from '@/lib/discordgifs/file-duration';
import { FilesState, filesStateReducer } from '@/lib/discordgifs/files-state';
import type { FFmpegManager } from '@/lib/discordgifs/ffmpeg-manager';
import type { FFmpegFileData } from '@/lib/types/discordgifs';

describe('per-file output eligibility', () => {
  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => 'blob:preview');
    URL.revokeObjectURL = jest.fn();
  });
  test.each([
    [4.9, ['sticker']],
    [5, ['sticker']],
  ])('keeps Sticker eligible at %s seconds', (seconds, expected) => {
    expect(
      getFileOutputEligibility(fileData('clip', ['sticker'], seconds))
        .eligibleOutputTypes
    ).toEqual(expected);
  });

  test('excludes only Sticker above five seconds', () => {
    const eligibility = getFileOutputEligibility(
      fileData('clip', ['avatar', 'sticker', 'emote'], 7)
    );
    expect(eligibility.eligibleOutputTypes).toEqual(['emote', 'avatar']);
    expect(eligibility.excludedOutputTypes).toEqual(['sticker']);
  });

  test('does not exclude Sticker when duration is unknown or still checking', () => {
    const unknown = fileData('unknown', ['sticker'], null);
    const checking = fileData('checking', ['sticker'], null);
    checking.duration = { status: 'checking' };
    expect(getFileOutputEligibility(unknown).eligibleOutputTypes).toEqual([
      'sticker',
    ]);
    expect(getFileOutputEligibility(checking).eligibleOutputTypes).toEqual([
      'sticker',
    ]);
  });

  test('global preset changes do not restore Sticker for an overlong file', () => {
    const initial = fileData('long', ['sticker'], 7);
    const state = filesStateReducer(
      { long: initial },
      {
        type: 'updateIdleOutputTypes',
        payload: { outputTypes: ['emote', 'sticker', 'avatar'] },
      }
    );
    expect(getFileOutputEligibility(state.long)).toEqual({
      eligibleOutputTypes: ['emote', 'avatar'],
      excludedOutputTypes: ['sticker'],
    });
  });

  test('does not recreate a file removed before metadata settles', () => {
    const file = new File(['clip'], 'late.mp4');
    let state = filesStateReducer(
      {},
      {
        type: 'addFile',
        payload: { file, outputTypes: ['sticker'] },
      }
    );
    state = filesStateReducer(state, {
      type: 'removeFile',
      payload: { name: file.name },
    });
    const afterLateResult = filesStateReducer(state, {
      type: 'updateDuration',
      payload: { name: file.name, seconds: 8 },
    });
    expect(afterLateResult).toBe(state);
    expect(afterLateResult).not.toHaveProperty(file.name);
  });

  test('disables conversion when no idle file has an eligible output', () => {
    const state = { long: fileData('long', ['sticker'], 7) };
    expect(hasEligibleIdleFile(state)).toBe(false);
    expect(
      hasEligibleIdleFile({
        ...state,
        short: fileData('short', ['sticker'], 4),
      })
    ).toBe(true);
  });

  test('marks a file done after its eligible outputs complete', () => {
    const long = fileData('long', ['emote', 'sticker'], 7);
    const result = filesStateReducer(
      { long },
      {
        type: 'addOutput',
        payload: {
          name: 'long',
          output: { name: 'long_emote.gif', url: 'blob:emote', type: 'emote' },
        },
      }
    );
    expect(result.long.outputs).toHaveLength(1);
    expect(result.long.conversionState).toBe('done');
  });

  test('shows a clear warning while leaving Emoji and Avatar available', () => {
    render(
      <ConvertedFile
        fileData={fileData('long', ['emote', 'sticker', 'avatar'], 7.24)}
        removeFile={jest.fn()}
        onTrimChange={jest.fn()}
        onConvert={jest.fn()}
      />
    );
    const warning = screen.getByRole('alert');
    expect(warning).toHaveTextContent('7.2 seconds');
    expect(warning).toHaveTextContent('limited to 5 seconds');
    expect(warning).toHaveTextContent('Choose a shorter segment above');
    expect(warning).toHaveTextContent(
      'Selected Emoji and Avatar outputs can still be converted.'
    );
  });
});

describe('duration metadata cleanup', () => {
  test.each([
    ['success', 'loadedmetadata', 4.25, 4.25],
    ['failure', 'error', Number.NaN, null],
  ] as const)(
    'revokes the object URL after metadata %s',
    async (_, eventName, duration, expected) => {
      const listeners = new Map<string, EventListener>();
      const video = {
        duration,
        preload: '',
        src: '',
        addEventListener: jest.fn((name: string, listener: EventListener) => {
          listeners.set(name, listener);
        }),
        removeEventListener: jest.fn(
          (name: string, listener: EventListener) => {
            if (listeners.get(name) === listener) listeners.delete(name);
          }
        ),
        removeAttribute: jest.fn(),
        load: jest.fn(),
      } as unknown as HTMLVideoElement;
      const revokeObjectURL = jest.fn();
      const clearTimer = jest.fn();
      const result = readFileDuration(new File(['clip'], 'clip.mp4'), {
        createObjectURL: () => 'blob:duration',
        revokeObjectURL,
        createVideoElement: () => video,
        setTimer: () => 1,
        clearTimer,
      });

      listeners.get(eventName)?.(new Event(eventName));

      await expect(result).resolves.toBe(expected);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:duration');
      expect(clearTimer).toHaveBeenCalledWith(1);
      expect(video.removeEventListener).toHaveBeenCalledTimes(2);
      expect(video.removeAttribute).toHaveBeenCalledWith('src');
    }
  );
});

describe('conversion with mixed eligibility', () => {
  test('converts eligible files and skips an ineligible Sticker without placeholders', async () => {
    const manager = createManagerStub();
    const dispatch = jest.fn();
    const filesState: FilesState = {
      long: fileData('long', ['sticker'], 7),
      usable: fileData('usable', ['emote', 'sticker'], 7),
    };

    await convert(
      { current: manager as unknown as FFmpegManager },
      filesState,
      dispatch
    );

    expect(manager.setFileConfig).toHaveBeenCalledTimes(1);
    expect(manager.setFileConfig).toHaveBeenCalledWith({
      file: filesState.usable.file,
      target: conversionTargetPresets.emote,
    });
    expect(
      dispatch.mock.calls.some(
        ([action]) =>
          action.type === 'addOutput' && action.payload.name === 'long'
      )
    ).toBe(false);
    expect(
      dispatch.mock.calls.some(
        ([action]) =>
          action.type === 'addOutput' &&
          action.payload.output.type === 'sticker'
      )
    ).toBe(false);
  });
});

function fileData(
  name: string,
  outputTypes: FFmpegFileData['outputTypes'],
  durationSeconds: number | null
): FFmpegFileData {
  return {
    file: new File([name], `${name}.mp4`),
    outputs: [],
    outputTypes,
    progress: 0,
    size: 0,
    currentTarget: conversionTargetPresets[outputTypes[0] ?? 'emote'],
    conversionState: 'idle',
    duration:
      durationSeconds === null
        ? { status: 'unknown' }
        : { status: 'known', seconds: durationSeconds },
  };
}

function createManagerStub() {
  const manager = {
    loaded: jest.fn(() => true),
    load: jest.fn(async () => undefined),
    setProgressCallback: jest.fn(),
    setNewSizeCallback: jest.fn(),
    setUpdateConversionStateCallback: jest.fn(),
    setFileConfig: jest.fn(),
    convert: jest.fn(async () => ({
      url: 'blob:result',
      outputName: 'usable_emote.gif',
      finalSize: 100,
      targetId: 'emote',
      format: 'gif' as const,
      mimeType: 'image/gif' as const,
      width: 80,
    })),
  };
  manager.setProgressCallback.mockReturnValue(manager);
  manager.setNewSizeCallback.mockReturnValue(manager);
  manager.setUpdateConversionStateCallback.mockReturnValue(manager);
  manager.setFileConfig.mockReturnValue(manager);
  return manager;
}

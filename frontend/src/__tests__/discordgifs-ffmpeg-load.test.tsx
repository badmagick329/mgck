import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';

const load = jest.fn();
const terminate = jest.fn();
const loaded = jest.fn();
jest.mock('../lib/discordgifs/ffmpeg-manager', () => ({
  FFmpegManager: jest.fn().mockImplementation(() => ({
    load,
    terminate,
    loaded,
  })),
}));

import { useFFmpeg } from '@/hooks/discordgifs/useFFmpeg';
import { FFmpegManager } from '@/lib/discordgifs/ffmpeg-manager';

describe('useFFmpeg', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    load.mockReset();
    terminate.mockReset();
    loaded.mockReset();
  });

  // MGK-24: a rejected load once escaped the hook and left isLoaded null, so the
  // GIF Maker's "error occurred loading ffmpeg" screen could never render.
  test('reports a failed load as not loaded', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    load.mockRejectedValue(new Error('core unavailable'));
    loaded.mockReturnValue(false);

    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => expect(result.current.isLoaded).toBe(false));
  });

  test('reports a successful load as loaded', async () => {
    load.mockResolvedValue(undefined);
    loaded.mockReturnValue(true);

    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
  });

  // MGK-27: terminate() makes an in-flight load resolve, so StrictMode's first
  // effect once reported loaded after its cleanup had torn the runtime down.
  test('ignores a load that settles after StrictMode cleanup', async () => {
    let runtimeLoaded = false;
    loaded.mockImplementation(() => runtimeLoaded);
    terminate.mockImplementation(() => {
      runtimeLoaded = false;
    });
    const settleLoad: Array<() => void> = [];
    load.mockImplementation(
      () => new Promise<void>((resolve) => settleLoad.push(resolve))
    );

    const { result } = renderHook(() => useFFmpeg(), { wrapper: StrictMode });
    expect(settleLoad).toHaveLength(2);
    expect(terminate).toHaveBeenCalledTimes(1);

    await act(async () => settleLoad[0]());
    expect(result.current.isLoaded).toBeNull();

    await act(async () => {
      runtimeLoaded = true;
      settleLoad[1]();
    });
    expect(result.current.isLoaded).toBe(true);
  });

  test('keeps one manager across re-renders', () => {
    load.mockReturnValue(new Promise(() => undefined));

    const { result, rerender } = renderHook(() => useFFmpeg());
    const manager = result.current.ffmpegRef.current;
    rerender();
    rerender();

    expect(FFmpegManager).toHaveBeenCalledTimes(1);
    expect(result.current.ffmpegRef.current).toBe(manager);
  });
});

import { renderHook, waitFor } from '@testing-library/react';

const load = jest.fn();
jest.mock('../lib/discordgifs/ffmpeg-manager', () => ({
  FFmpegManager: jest.fn().mockImplementation(() => ({
    load,
    terminate: jest.fn(),
  })),
}));

import { useFFmpeg } from '@/hooks/discordgifs/useFFmpeg';

describe('useFFmpeg', () => {
  // MGK-24: a rejected load once escaped the hook and left isLoaded null, so the
  // GIF Maker's "error occurred loading ffmpeg" screen could never render.
  test('reports a failed load as not loaded', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    load.mockRejectedValue(new Error('core unavailable'));

    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => expect(result.current.isLoaded).toBe(false));
  });

  test('reports a successful load as loaded', async () => {
    load.mockResolvedValue(undefined);

    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
  });
});

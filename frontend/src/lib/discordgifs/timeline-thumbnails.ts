export const timelineThumbnailCount = 24;

const thumbnailHeight = 72;
const loadTimeoutMilliseconds = 10_000;
const seekTimeoutMilliseconds = 5_000;

type ThumbnailDependencies = {
  createVideoElement: () => HTMLVideoElement;
  createCanvas: () => HTMLCanvasElement;
  setTimer: (callback: () => void, milliseconds: number) => number;
  clearTimer: (timer: number) => void;
};

const defaultDependencies: ThumbnailDependencies = {
  createVideoElement: () => document.createElement('video'),
  createCanvas: () => document.createElement('canvas'),
  setTimer: (callback, milliseconds) =>
    window.setTimeout(callback, milliseconds),
  clearTimer: (timer) => window.clearTimeout(timer),
};

/**
 * Draws evenly spaced frames by seeking a hidden video. This deliberately
 * avoids FFmpeg, which loads lazily and would take seconds per strip; a clip
 * the browser cannot decode simply resolves false and the timeline stays plain.
 */
export async function generateTimelineThumbnails(
  url: string,
  duration: number,
  {
    count = timelineThumbnailCount,
    signal,
    onFrame,
    dependencies = {},
  }: {
    count?: number;
    signal?: AbortSignal;
    onFrame: (index: number, image: string) => void;
    dependencies?: Partial<ThumbnailDependencies>;
  }
): Promise<boolean> {
  const deps = { ...defaultDependencies, ...dependencies };
  const video = deps.createVideoElement();
  const waitFor = (event: string, milliseconds: number) =>
    new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        deps.clearTimer(timer);
        video.removeEventListener(event, onEvent);
        video.removeEventListener('error', onError);
        signal?.removeEventListener('abort', onAbort);
        if (error) reject(error);
        else resolve();
      };
      const onEvent = () => finish();
      const onError = () => finish(new Error('decode failed'));
      const onAbort = () => finish(new Error('aborted'));
      const timer = deps.setTimer(
        () => finish(new Error('timed out')),
        milliseconds
      );
      video.addEventListener(event, onEvent);
      video.addEventListener('error', onError);
      signal?.addEventListener('abort', onAbort);
    });

  try {
    if (signal?.aborted || duration <= 0) return false;
    video.muted = true;
    video.preload = 'auto';
    const loaded = waitFor('loadeddata', loadTimeoutMilliseconds);
    video.src = url;
    await loaded;
    if (video.videoWidth < 1 || video.videoHeight < 1) return false;

    const canvas = deps.createCanvas();
    canvas.height = thumbnailHeight;
    canvas.width = Math.max(
      1,
      Math.round((thumbnailHeight * video.videoWidth) / video.videoHeight)
    );
    const context = canvas.getContext('2d');
    if (!context) return false;

    for (let index = 0; index < count; index++) {
      if (signal?.aborted) return false;
      const seeked = waitFor('seeked', seekTimeoutMilliseconds);
      video.currentTime = (duration * (index + 0.5)) / count;
      await seeked;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      onFrame(index, canvas.toDataURL('image/jpeg', 0.7));
    }
    return true;
  } catch {
    return false;
  } finally {
    video.removeAttribute('src');
    try {
      video.load();
    } catch {
      // Some media implementations cannot reset; the element is discarded anyway.
    }
  }
}

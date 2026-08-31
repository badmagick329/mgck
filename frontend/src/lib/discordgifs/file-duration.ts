const metadataTimeoutMilliseconds = 10_000;

type DurationReaderDependencies = {
  createObjectURL: (file: File) => string;
  revokeObjectURL: (url: string) => void;
  createVideoElement: () => HTMLVideoElement;
  setTimer: (callback: () => void, milliseconds: number) => number;
  clearTimer: (timer: number) => void;
};

const defaultDependencies: DurationReaderDependencies = {
  createObjectURL: (file) => URL.createObjectURL(file),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  createVideoElement: () => document.createElement('video'),
  setTimer: (callback, milliseconds) =>
    window.setTimeout(callback, milliseconds),
  clearTimer: (timer) => window.clearTimeout(timer),
};

export async function readFileDuration(
  file: File,
  dependencies: Partial<DurationReaderDependencies> = {}
): Promise<number | null> {
  const deps = { ...defaultDependencies, ...dependencies };
  let objectUrl: string;

  try {
    objectUrl = deps.createObjectURL(file);
  } catch {
    return null;
  }

  const video = deps.createVideoElement();

  return new Promise((resolve) => {
    let settled = false;
    let timer = 0;

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      if (timer) deps.clearTimer(timer);
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        // Some browser media implementations do not support resetting playback.
      }
      deps.revokeObjectURL(objectUrl);
    };

    const finish = (duration: number | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(duration);
    };

    const onLoadedMetadata = () => {
      const duration = video.duration;
      finish(Number.isFinite(duration) && duration >= 0 ? duration : null);
    };
    const onError = () => finish(null);

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);
    timer = deps.setTimer(() => finish(null), metadataTimeoutMilliseconds);
    video.preload = 'metadata';
    video.src = objectUrl;

    try {
      video.load();
    } catch {
      finish(null);
    }
  });
}

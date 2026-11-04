import { FFmpegManager } from '@/lib/discordgifs/ffmpeg-manager';
import { MutableRefObject, useEffect, useState } from 'react';

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState<boolean | null>(null);
  // One manager per mount, built lazily. StrictMode's mount -> cleanup -> mount
  // reuses it: terminate() leaves the manager able to load again.
  const [ffmpegRef] = useState<MutableRefObject<FFmpegManager>>(() => ({
    current: new FFmpegManager(),
  }));

  useEffect(() => {
    const manager = ffmpegRef.current;
    // terminate() makes an in-flight load() resolve rather than reject, so a
    // load settling after cleanup must not report a runtime that is gone.
    let cancelled = false;
    manager.load().then(
      () => {
        if (!cancelled && manager.loaded()) {
          setIsLoaded(true);
        }
      },
      (error) => {
        if (cancelled) {
          return;
        }
        console.error('Failed to load FFmpeg', error);
        setIsLoaded(false);
      }
    );
    return () => {
      cancelled = true;
      manager.terminate();
    };
  }, [ffmpegRef]);

  return { ffmpegRef, isLoaded };
}

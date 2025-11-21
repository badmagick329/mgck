import { FFmpegManager } from '@/lib/discordgifs/ffmpeg-manager';
import { useEffect, useRef, useState } from 'react';

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState<boolean | null>(null);
  const ffmpegRef = useRef<FFmpegManager>(new FFmpegManager());

  useEffect(() => {
    (async () => {
      await ffmpegRef.current.load();
      setIsLoaded(true);
    })();
    return () => {
      ffmpegRef.current.terminate();
    };
  }, []);

  return { ffmpegRef, isLoaded };
}

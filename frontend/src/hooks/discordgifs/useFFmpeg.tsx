import { FFmpegManager } from '@/lib/discordgifs/ffmpeg-manager';
import { useEffect, useRef, useState } from 'react';

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState<boolean | null>(null);
  const ffmpegRef = useRef<FFmpegManager>(new FFmpegManager());

  useEffect(() => {
    ffmpegRef.current.load().then(
      () => setIsLoaded(true),
      (error) => {
        console.error('Failed to load FFmpeg', error);
        setIsLoaded(false);
      }
    );
    return () => {
      ffmpegRef.current.terminate();
    };
  }, []);

  return { ffmpegRef, isLoaded };
}

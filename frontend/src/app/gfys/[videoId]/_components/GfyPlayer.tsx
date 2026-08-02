import { addGfyView } from '@/actions/gfys';
import { useGfyContext } from '@/app/gfys/_context/store';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function GfyPlayer({ videoUrl }: { videoUrl: string }) {
  const { videoVolume, setVideoVolume, goToNextGfy, goToPreviousGfy, data, loopAll } =
    useGfyContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [viewed, setViewed] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, button, a, [contenteditable="true"]')) return;
      const video = videoRef.current;
      if (!video) return;
      if (event.key === ' ') {
        event.preventDefault();
        video.paused ? await video.play() : video.pause();
      } else if (event.key.toLowerCase() === 'm') {
        video.muted = !video.muted;
      } else if (event.key === 'ArrowRight') {
        const url = await goToNextGfy();
        if (url) router.replace(url);
      } else if (event.key === 'ArrowLeft') {
        const url = await goToPreviousGfy();
        if (url) router.replace(url);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToNextGfy, goToPreviousGfy, router]);

  return (
    <video
      ref={videoRef}
      className={cn(
        videoLoading ? 'hidden' : 'block',
        'my-auto max-h-[90%] w-full sm:max-h-full'
      )}
      onLoadedData={(e) => {
        setVideoLoading(false);
        videoVolume === 0
          ? (e.currentTarget.muted = true)
          : (e.currentTarget.volume = videoVolume);
      }}
      onVolumeChange={(e) => {
        e.currentTarget.muted
          ? setVideoVolume(0)
          : setVideoVolume(e.currentTarget.volume);
      }}
      onTimeUpdate={(e) => {
        if (viewed || videoDuration === 0) {
          return;
        }
        const currentTime = e.currentTarget.currentTime;
        const halfWay = e.currentTarget.duration / 2;
        if (currentTime >= halfWay) {
          setViewed(true);
          addGfyView(videoUrl);
        }
      }}
      onDurationChange={(e) => {
        setVideoDuration(e.currentTarget.duration);
      }}
      onEnded={(e) => {
        if (loopAll && data.gfys.length > 1) {
          (async () => {
            const newGfyURL = await goToNextGfy(true);
            if (newGfyURL) {
              router.replace(newGfyURL);
            }
          })();
        }
      }}
      controls
      autoPlay
      loop={!loopAll}
      {...(videoVolume === 0 ? { muted: true } : {})}
    >
      <source src={videoUrl} type='video/mp4' />
    </video>
  );
}

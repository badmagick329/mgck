import { addGfyView } from '@/actions/gfys';
import { useGlobalContext } from '@/app/gfys/context/store';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GfyPlayer({ videoUrl }: { videoUrl: string }) {
  const { videoVolume, setVideoVolume, goToNextGfy, data, loopAll } =
    useGlobalContext();
  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [viewed, setViewed] = useState<boolean>(false);
  const router = useRouter();

  return (
    <video
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

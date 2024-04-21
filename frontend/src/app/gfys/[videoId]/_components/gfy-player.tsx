import { useState } from "react";
import { useGlobalContext } from "@/app/gfys/context/store";
import { addGfyView } from "@/actions/gfys";

export default function GfyPlayer({ videoUrl }: { videoUrl: string }) {
  const { videoVolume, setVideoVolume } = useGlobalContext();
  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [viewed, setViewed] = useState<boolean>(false);

  return (
    <video
      className={videoLoading ? "hidden" : "block"}
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
      controls
      autoPlay
      loop
      {...(videoVolume === 0 ? { muted: true } : {})}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
}

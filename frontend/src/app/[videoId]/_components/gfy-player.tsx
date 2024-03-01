import { useState } from "react";
import { useGlobalContext } from "@/app/context/store";

export default function GfyPlayer({ videoUrl }: { videoUrl: string }) {
  const { videoVolume, setVideoVolume } = useGlobalContext();
  const [videoLoading, setVideoLoading] = useState<boolean>(true);

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
      controls
      autoPlay
      loop
      {...(videoVolume === 0 ? { muted: true } : {})}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
}

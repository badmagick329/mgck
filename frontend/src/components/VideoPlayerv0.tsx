"use client";
import Image from "next/image";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect, forwardRef } from "react";
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type Props = {
  url: string;
  containerHeight: number;
  onCloseCallback: () => void;
};

// type PlayerProps = {
//   url: string;
//   style: React.CSSProperties;
//   width: number;
//   height: number;
//   videoReadyCallback?: () => void;
//   videoWidthCallback?: (width: number) => void;
//   videoHeightCallback?: (height: number) => void;
// };

export default function GfyPlayer(props: Props) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  // const [width, setWidth] = useState(1280);
  // const [height, setHeight] = useState(720);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [windowHeight, setWindowHeight] = useState<number>(0);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);
  const playerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const setDimensions = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
      // console.log(`Window width: ${windowWidth}`);
      // console.log(`Window height: ${windowHeight}`);
      // setWidth(window.innerWidth - 100);
      // setHeight(window.innerHeight - 100);
    };
    console.log("Adding resize listener");
    window.addEventListener("resize", setDimensions);
    const playerReadyListener = () => {
      console.log("Player ready");
      loadPlayer(true);
    };
    setDimensions();
    console.log("Adding player ready listener");
    playerRef.current?.addEventListener("loadedmetadata", playerReadyListener);
    return () => {
      window.removeEventListener("resize", setDimensions);
      playerRef.current?.removeEventListener(
        "loadedmetadata",
        playerReadyListener
      );
    };
  });

  const loadPlayer = (load: boolean) => {
    console.log(`Component ref: ${playerRef.current}`);
    if (load) {
      console.log("Loading player");
      setVideoLoaded(true);
      updateVideoDimensions();
    } else {
      console.log("Unloading player");
      setVideoLoaded(false);
      props.onCloseCallback();
    }
  };

  const updateVideoDimensions = () => {
    console.log(`Props container height ${props.containerHeight}`);
    const containerWidth = windowWidth - 100;
    const containerHeight = props.containerHeight - 100;
    console.log(`Container width: ${containerWidth}`);
    console.log(`Container height: ${containerHeight}`);
    const vWidth = playerRef.current?.videoWidth || 1920;
    const vHeight = playerRef.current?.videoHeight || 1080;
    const videoAspectRatio = vWidth / vHeight;
    console.log(`Video aspect ratio: ${videoAspectRatio}`);
    let newWidth, newHeight;
    if (containerHeight < containerWidth) {
      newWidth = containerHeight * videoAspectRatio;
      newHeight = containerHeight;
      if (newWidth > containerWidth) {
        newWidth = containerWidth;
        newHeight = containerWidth / videoAspectRatio;
      }
    } else {
      newWidth = containerWidth;
      newHeight = containerWidth / videoAspectRatio;
      if (newHeight > containerHeight) {
        newWidth = containerHeight * videoAspectRatio;
        newHeight = containerHeight;
      }
    }
    newWidth = Math.floor(newWidth);
    newHeight = Math.floor(newHeight);
    console.log(`Setting width: ${newWidth}. Type: ${typeof newWidth}`);
    console.log(`Setting height: ${newHeight}. Type: ${typeof newHeight}`);
    setVideoWidth(newWidth);
    setVideoHeight(newHeight);
  };

  useEffect(() => {
    console.log(`Video width now: ${videoWidth}`);
    console.log(`Video height now: ${videoHeight}`);
    setStyle({
      width: `${videoWidth}px`,
      height: `${videoHeight}px`,
    });
  }, [videoWidth, videoHeight]);

  return (
    <div className={"flex flex-col w-full"}>
      <button
        className={
          "border-white border-2 rounded-md p-2 m-2 w-[100px]" +
          "text-white bg-black " +
          "hover:bg-white hover:text-black justify-self-end"
        }
        onClick={() => loadPlayer(false)}
      >
        Back
      </button>
      <div className={"flex w-full"}>
        <video
          ref={playerRef}
          className={"flex w-full"}
          controls={true}
          autoPlay={true}
          muted={true}
          loop={true}
          playsInline={true}
          style={style}
        >
          <source src={props.url} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

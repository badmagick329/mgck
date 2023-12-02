"use client";
import Image from "next/image";

import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type props = {
  url: string;
  width?: number;
  height?: number;
};

export default function Player(props: props) {
  return (
    <ReactPlayer
      url={props.url}
      controls={true}
      playing={true}
      muted={true}
      loop={true}
      width={props.width || 1280}
      height={props.height || 720}
    />
  );
}

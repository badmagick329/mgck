"use client";
import GfyPlayer from "../VideoPlayer";
import { useGlobalContext } from "../../app/context/store";
import { searchGfys } from "@/actions/actions";
import { parseGfyResponse } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { imgurIdToJpg, imgurIdToMp4 } from "@/lib/utils";

export default function Gfys() {
  const { data, setData } = useGlobalContext();
  const [videoUrl, setVideoUrl] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = async () => {
      const resp = await searchGfys(new FormData());
      setData(parseGfyResponse(resp));
    };
    update();
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVideoUrl("");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const renderContent = () => {
    if (videoUrl)
      return (
        <GfyPlayer
          url={videoUrl}
          onCloseCallback={() => setVideoUrl("")}
          containerHeight={containerRef.current?.offsetHeight || 0}
        />
      );
    else {
      return renderList();
    }
  };

  const renderList = () => {
    return (
      <div className="flex flex-wrap w-full py-2 justify-center overflow-hidden gap-2 ">
        {data.map((d, key) => (
          <Image
            key={key}
            className="object-cover rounded-md hover:ring-2 hover:ring-offset-2
                  hover:ring-indigo-500 hover:cursor-pointer"
            onClick={() => {
              console.log(`Setting video url to ${imgurIdToMp4(d.imgurId)}`);
              setVideoUrl(imgurIdToMp4(d.imgurId));
            }}
            src={imgurIdToJpg(d.imgurId)}
            alt="imgur"
            width={250}
            height={250}
            style={{ width: "250px", height: "250px" }}
            quality={75}
            unoptimized
          />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={"flex flex-col px-10 w-full h-full items-center"}
    >
      {renderContent()}
    </div>
  );
}

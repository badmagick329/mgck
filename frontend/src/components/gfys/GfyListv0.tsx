"use client";
import GfyPlayer from "../VideoPlayer";
import { useGlobalContext } from "../../app/context/store";
import { searchGfys } from "@/actions/actions";
import { parseGfyResponse } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { imgurIdToJpg, imgurIdToMp4 } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function GfyList() {
  const { data, setData } = useGlobalContext();
  const searchParams = useSearchParams();
  const [videoUrl, setVideoUrl] = useState<string>("");

  const formDataFromSearchParams = () => {
    const formData = new FormData();
    const titleParam = (searchParams.get("title") || "") as string;
    const tagsParam = (searchParams.get("tags") || "") as string;
    formData.append("title", titleParam);
    formData.append("tags", tagsParam);
    return formData;
  };

  const updateData = async () => {
    const resp = await searchGfys(formDataFromSearchParams());
    const d = parseGfyResponse(resp);
    setData(d);
  };

  useEffect(() => {
    updateData();
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setVideoUrl("");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    updateData();
  }, [searchParams]);

  const renderContent = () => {
    if (videoUrl)
      return (
        <GfyPlayer
          url={videoUrl}
          onCloseCallback={() => setVideoUrl("")}
          containerHeight={100}
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
  return renderContent();
}

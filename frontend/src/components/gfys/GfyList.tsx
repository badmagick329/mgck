"use client";
import { useGlobalContext } from "@/app/context/store";
import { searchGfys } from "@/actions/actions";
import { parseGfyResponse } from "@/lib/utils";
import Image from "next/image";
import { useEffect } from "react";
import { imgurIdToJpg } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function GfyList() {
  const { data, setData } = useGlobalContext();
  const searchParams = useSearchParams();

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
  }, []);

  useEffect(() => {
    updateData();
  }, [searchParams]);

  return (
    <div className="flex flex-wrap w-full py-2 justify-center overflow-hidden gap-2 ">
      {data.map((d, key) => (
        <Image
          key={key}
          className="object-cover rounded-md hover:ring-2 hover:ring-offset-2
                  hover:ring-indigo-500 hover:cursor-pointer"
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
}

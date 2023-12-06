"use client";
import { useGlobalContext } from "../../app/context/store"
import { GetSearchForm } from "@/actions/actions";
import { parseGfyResponse } from "@/lib/utils";
import Image from "next/image";
import { useEffect } from "react";


export default function Gfys() {
  const { data, setData } = useGlobalContext();

  useEffect(() => {
    const update = async () => {
      const resp = await GetSearchForm(new FormData());
      setData(parseGfyResponse(resp));
    };
    update();
  }, []);
  return (
    <div className="flex flex-col px-10 items-center">
      <div className="flex flex-wrap py-2 justify-center overflow-hidden gap-2 ">
        {data.map((d) => (
          <Image
            className="object-cover rounded-md hover:ring-2 hover:ring-offset-2
            hover:ring-indigo-500 hover:cursor-pointer"
            src={`${d.imgurUrl}.jpg`}
            key={d.imgurUrl}
            alt="imgur"
            width={300}
            height={300}
            style={{ width: "300px", height: "300px" }}
            quality={75}
            unoptimized
          />
        ))}
      </div>
    </div>
  );
}

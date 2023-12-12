"use client";
import { useGlobalContext } from "@/app/context/store";
import { searchGfys } from "@/actions/actions";
import { parseGfyResponse } from "@/lib/utils";
import Image from "next/image";
import { useEffect } from "react";
import { imgurIdToJpg } from "@/lib/utils";
import { useSearchParams, usePathname } from "next/navigation";
import type { Metadata } from "next";
import {
  cleanedSearchParams,
  createURL,
  formDataFromSearchParams,
} from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Red Velvet Gfy Archive",
  description: "Search through Red Velvet Gfys now moved to Imgur",
};


export default function GfyList() {
  const { data, setData, gfyViewData, setGfyViewData } = useGlobalContext();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const fetchData = async () => {
    let now = performance.now();
    let currentTime = performance.timeOrigin + performance.now();
    console.log(`Calling action at : ${currentTime}`);
    const resp = await searchGfys(formDataFromSearchParams(searchParams));
    console.log("searchGfys took", performance.now() - now, "ms");
    now = performance.now();
    const d = parseGfyResponse(resp);
    console.log("parseGfyResponse took", performance.now() - now, "ms");
    now = performance.now();
    setData(d);
    console.log("setData took", performance.now() - now, "ms");
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    let urlSearchParams = new URLSearchParams(searchParams.toString());
    urlSearchParams = cleanedSearchParams(urlSearchParams);
    setGfyViewData({
      index: 0,
      videoIds: data.gfys.map((g) => g.imgurId),
      listUrl: createURL(pathname, urlSearchParams.toString()),
    });
  }, [data]);

  return (
    <div className="flex flex-wrap w-full py-2 gap-2 justify-center overflow-hidden lg:w-2/3">
      {data.gfys.map((d, key) => (
        <Link
          key={key}
          href={{
            pathname: `/gfy/${d.imgurId}`,
          }}
          onClick={() => {
            setGfyViewData({
              ...gfyViewData,
              index: key,
            });
          }}
        >
          <Image
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
        </Link>
      ))}
    </div>
  );
}

"use client";
import { useGlobalContext } from "@/app/context/store";
import { searchGfys } from "@/actions/actions";
import { parseGfyResponse } from "@/lib/utils";
import Image from "next/image";
import { useEffect } from "react";
import { imgurIdToJpg } from "@/lib/utils";
import { useSearchParams, usePathname } from "next/navigation";
import {
  cleanedSearchParams,
  createURL,
  formDataFromSearchParams,
} from "@/lib/utils";
import Link from "next/link";
import GfyPreview from "./gfy-preview";

export default function GfyList() {
  const { data, setData, gfyViewData, setGfyViewData } = useGlobalContext();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const fetchData = async () => {
    const resp = await searchGfys(formDataFromSearchParams(searchParams));
    const d = parseGfyResponse(resp);
    setData(d);
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
    <div className="flex w-full flex-wrap justify-center gap-2 overflow-hidden py-2 lg:w-2/3">
      {data.gfys.map((d, key) => (
        <GfyPreview key={key} title={d.title} imgurId={d.imgurId} index={key} />
      ))}
    </div>
  );
}

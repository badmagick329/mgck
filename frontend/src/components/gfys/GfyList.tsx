"use client";
import { useGlobalContext } from "@/app/context/store";
// import { searchGfys } from "@/actions/actions";
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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function GfyList() {
  const { data, setData, gfyViewData, setGfyViewData } = useGlobalContext();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // const _fetchData = async () => {
  //   let now = performance.now();
  //   let currentTime = performance.timeOrigin + performance.now();
  //   console.log(`Calling action at : ${currentTime}`);
  //   const resp = await searchGfys(formDataFromSearchParams(searchParams));
  //   console.log("searchGfys took", performance.now() - now, "ms");
  //   now = performance.now();
  //   const d = parseGfyResponse(resp);
  //   now = performance.now();
  //   setData(d);
  // };

  const fetchData = async () => {
    const formData = formDataFromSearchParams(searchParams);
    const title = formData.get("title") || "";
    const tags = formData.get("tags") || "";
    const page = formData.get("page") || "1";
    let account = formData.get("account") || "";
    if (account == "All") {
      account = "";
    }
    const apiUrl = new URL(`${BASE_URL}/api/gfys`);
    apiUrl.searchParams.append("title", title as string);
    apiUrl.searchParams.append("tags", tags as string);
    apiUrl.searchParams.append("account", account as string);
    apiUrl.searchParams.append("page", page as string);
    let now = performance.now();
    let resp = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("fetch took", performance.now() - now, "ms");
    const d = await resp.json();
    // TODO: Validation
    setData(parseGfyResponse(d));
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

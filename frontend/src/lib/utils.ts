import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  GfyData,
  GfyResult,
  GfyResponse,
  GfyParsedResponse,
} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseGfyResponse(resp: GfyResponse) {
  const newData: Array<GfyData> = [];
  resp.results?.map((d: GfyResult) => {
    newData.push({
      imgurId: d.imgur_id,
      title: d.imgur_title,
      tags: d.tags,
      date: d.date,
      account: d.account,
    });
  });
  return {
    count: resp.count,
    next: resp.next,
    previous: resp.previous,
    gfys: newData,
  } as GfyParsedResponse;
}

export function imgurIdToMp4(imgurId: string) {
  return `https://i.imgur.com/${imgurId}.mp4`;
}

export function imgurIdToJpg(imgurId: string) {
  return `https://i.imgur.com/${imgurId}.jpg`;
}

export function imgurIdToUrl(imgurId: string) {
  return `https://i.imgur.com/${imgurId}`;
}

import { ReadonlyURLSearchParams } from "next/navigation";

export function cleanedSearchParams(urlSearchParams: URLSearchParams) {
  if (urlSearchParams.get("title")?.trim() == "") {
    urlSearchParams.delete("title");
  }
  if (urlSearchParams.get("tags")?.trim() == "") {
    urlSearchParams.delete("tags");
  }
  if (urlSearchParams.get("account")?.trim() == "") {
    urlSearchParams.delete("account");
  }
  const pageParam = urlSearchParams.get("page")?.trim() || "";
  const page = parseInt(pageParam);
  if (page < 1 || isNaN(page)) {
    urlSearchParams.delete("page");
  }
  return urlSearchParams;
}

export function createURL(pathname: string, paramsString: string) {
  const urlSearchParams = cleanedSearchParams(
    new URLSearchParams(paramsString)
  );
  const newParams = urlSearchParams.toString();
  if (newParams) {
    return `${pathname}?${newParams}`;
  }
  return pathname;
}

export function formDataFromSearchParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams
) {
  const formData = new FormData();
  const titleParam = (searchParams.get("title") || "") as string;
  const tagsParam = (searchParams.get("tags") || "") as string;
  const pageParam = (searchParams.get("page") || "1") as string;
  const accountParam = (searchParams.get("account") || "") as string;
  formData.append("title", titleParam);
  formData.append("tags", tagsParam);
  formData.append("page", pageParam);
  formData.append("account", accountParam);
  return formData;
}

export function formDataFromSearchParamsString(searchParamsString: string) {
  let cleanedParams = searchParamsString;
  if (cleanedParams[0] == "/") {
    cleanedParams = cleanedParams.slice(1);
  }
  const urlSearchParams = new URLSearchParams(cleanedParams);
  return formDataFromSearchParams(urlSearchParams);
}

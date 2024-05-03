import {
  GfyData,
  GfyResult,
  GfyResponse,
  GfyParsedResponse,
} from "@/lib/types";
import { ReadonlyURLSearchParams } from "next/navigation";

export function parseGfyResponse(resp: GfyResponse): GfyParsedResponse {
  const newData: Array<GfyData> = [];
  resp.results?.map((d: GfyResult) => {
    newData.push({
      imgurId: d.imgur_id,
      title: d.imgur_title,
      tags: d.tags,
      date: d.date,
      account: d.account,
      width: d.width || null,
      height: d.height || null,
    });
  });
  return {
    count: resp.count,
    next: resp.next,
    previous: resp.previous,
    totalPages: resp.total_pages,
    gfys: newData,
  }
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

export function createURL(
  pathname: string,
  paramsString: string,
  asPage: string | null = null
) {
  const urlSearchParams = new URLSearchParams(paramsString);
  if (asPage) {
    urlSearchParams.set("page", asPage.toString());
  }
  const cleanParams = cleanedSearchParams(urlSearchParams);
  const newParams = cleanParams.toString();
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
  const startDateParam = (searchParams.get("start_date") || "") as string;
  const endDateParam = (searchParams.get("end_date") || "") as string;
  formData.append("title", titleParam);
  formData.append("tags", tagsParam);
  formData.append("page", pageParam);
  formData.append("account", accountParam);
  formData.append("start_date", startDateParam);
  formData.append("end_date", endDateParam);
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

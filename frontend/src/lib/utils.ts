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
    totalPages: resp.total_pages,
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

export async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "absolute";
  textArea.style.left = "-999999px";
  document.body.prepend(textArea);
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  } finally {
    textArea.remove();
  }
  return Promise.resolve();
}

/**
 * Take a YYMMDD, YYYYMMDD or YYYY-MM-DD string and return a YYYY-MM-DD string
 * or null if invalid.
 */
export function validDateStringOrNull(date: string) {
  date = date.trim();
  if (date.length !== 6 && date.length !== 8 && date.length !== 10) {
    return null;
  }
  if (date.length === 6) {
    date = `20${date}`;
  }

  if (date.length === 8) {
    date = date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  }

  if (isNaN(Date.parse(date))) {
    return null;
  }
  return date;
}

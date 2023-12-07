import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { GfyData, GfyResult } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseGfyResponse(resp: any) {
  const newData: Array<GfyData> = [];
  resp.results.map((d: GfyResult) => {
    newData.push({
      imgurId: d.imgur_id,
      title: d.imgur_title,
      tags: d.tags,
      date: d.date,
      account: d.account,
    });
  });
  // console.log(`New Data:\n${JSON.stringify(newData)}`);
  return newData;
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

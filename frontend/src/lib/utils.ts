import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { GfyData, GfyResult} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseGfyResponse(resp: any) {
  const newData: Array<GfyData> = [];
  resp.results.map((d: GfyResult) => {
    newData.push({
      imgurUrl: d.imgur_url,
    });
  });
  // console.log(`New Data:\n${JSON.stringify(newData)}`);
  return newData.slice(0,10);
}

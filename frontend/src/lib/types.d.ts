import { ReadonlyURLSearchParams } from "next/navigation";

export type GfyData = {
  imgurId: string;
  title: string;
  tags: string[];
  date: string;
  account: string;
};

export type GfyResult = {
  imgur_id: string;
  imgur_title: string;
  gfy_id: string;
  gfy_title: string;
  date: string;
  account: string;
  tags: string[];
};

interface GfyURLParams extends ReadonlyURLSearchParams {
  title: string;
  tags: string;
}

export type GfySearchParams = {
  searchParams: GfyURLParams;
};

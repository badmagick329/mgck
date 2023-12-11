import { ReadonlyURLSearchParams } from "next/navigation";

export type GfyParsedResponse = {
  count: number;
  previous: string | null;
  next: string | null;
  gfys: GfyData[];
};

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

export type GfyResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: GfyResult[];
};

export type GfyDetailResponse = {
  title: string;
  tags: string[];
  date: string | null;
  account: string;
  video_url: string;
};

export type AccountsResponse = {
  accounts: string[];
};

export type GfyViewData = {
  index: number;
  videoIds: string[];
  listUrl: string;
};

// TODO: Remove these?
export type GfyURLParams = ReadonlyURLSearchParams & {
  title: string;
  tags: string;
};

export type GfySearchParams = {
  searchParams: GfyURLParams;
};

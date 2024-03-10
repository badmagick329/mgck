import { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams } from "next/navigation";

export type GfyParsedResponse = {
  count: number;
  previous: string | null;
  next: string | null;
  totalPages: number;
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
  previous: string | null;
  next: string | null;
  total_pages: number;
  results: GfyResult[];
};

export type GfyDetailResponse = {
  title: string;
  tags: string[];
  date: string | null;
  account: string;
  imgur_id: string;
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

export type SearchFormParams = {
  title: string;
  tags: string;
  start_date: string;
  end_date: string;
};

type SearchParams = ReturnType<typeof useSearchParams>;

import { useSearchParams } from 'next/navigation';

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
  width: number | null;
  height: number | null;
};
export type GfyResult = {
  imgur_id: string;
  imgur_title: string;
  gfy_id: string;
  gfy_title: string;
  date: string;
  account: string;
  tags: string[];
  width: number | null;
  height: number | null;
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
  width: number | null;
  height: number | null;
  video_url: string;
};
export type GfyViewData = {
  index: number;
  videoIds: string[];
  listUrl: string;
};
export type AccountsResponse = {
  accounts: string[];
};
export type SearchFormParams = {
  title: string;
  tags: string;
  start_date: string;
  end_date: string;
};
export type SearchParams = ReturnType<typeof useSearchParams>;

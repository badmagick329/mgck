import { useSearchParams } from 'next/navigation';

import { sizeInfo } from './ffmpeg-utils/frame-size-calculator';

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

export type SearchParams = ReturnType<typeof useSearchParams>;

export type ComebacksResult = {
  count: number;
  previous: string | null;
  next: string | null;
  total_pages: number;
  results: ComebackResponse[];
};

export type ComebackResponse = {
  id: number;
  title: string;
  artist: string;
  album: string;
  date: string;
  release_type: string;
  urls: string[];
};

export type ServerError = 'Server Error' | 'Page Not Found' | 'Unknown Error';

export type CriterionType = {
  label: string;
  weight: number;
  maxValue: number;
};

export type ChoiceType = {
  criteria: CriterionType[];
  name: string;
};

export type ChooseState = {
  choices: ChoiceType[];
};

export type FFmpegLogEvent = {
  type: string;
  message: string;
};

export type FFmpegProgressEvent = {
  progress: number;
  time: number;
};

export type FFmpegFileDataOutput = {
  name: string;
  url: string;
  type: string;
  finalSize?: number;
};

export type FFmpegFileData = {
  file: File;
  outputs: Array<FFmpegFileDataOutput>;
  outputTypes: Array<keyof typeof sizeInfo>;
  progress: number;
  size: number;
  isConverting: boolean;
  isDone: boolean;
};

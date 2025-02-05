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

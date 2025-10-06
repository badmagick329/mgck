import {
  GfyData,
  GfyParsedResponse,
  GfyResponse,
  GfyResult,
} from '@/lib/types/gfys';
import { ReadonlyURLSearchParams } from 'next/navigation';

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
  };
}

export function imgurIdToImgurVideo(imgurId: string) {
  return `https://i.imgur.com/${imgurId}.mp4`;
}

export function imgurIdToVideo(imgurId: string) {
  return `https://mgck.ink/gfy-videos/${imgurId}.mp4`;
}

export function imgurIdToThumbnail(imgurId: string) {
  return `https://mgck.ink/gfy-thumbnails/${imgurId}.webp`;
}

export function imgurIdToUrl(imgurId: string) {
  return `https://i.imgur.com/${imgurId}`;
}

export function createURL(
  pathname: string,
  paramsString: string,
  asPage: string | null = null
) {
  const urlSearchParams = new URLSearchParams(paramsString);
  if (asPage) {
    urlSearchParams.set('page', asPage.toString());
  }
  const cleanParams = cleanedSearchParams(urlSearchParams);
  const newParams = cleanParams.toString();
  if (newParams) {
    return `${pathname}?${newParams}`;
  }
  return pathname;
}

function cleanedSearchParams(urlSearchParams: URLSearchParams) {
  const params = ['title', 'tags', 'account', 'start_date', 'end_date', 'page'];
  for (const param of params) {
    if (urlSearchParams.get(param)?.trim() === '') {
      urlSearchParams.delete(param);
    }
  }
  const pageParam = urlSearchParams.get('page')?.trim() || '';
  const page = parseInt(pageParam);
  if (page < 1 || isNaN(page)) {
    urlSearchParams.delete('page');
  }
  return urlSearchParams;
}

export function formDataFromSearchParams(
  searchParams: ReadonlyURLSearchParams | URLSearchParams
) {
  const formData = new FormData();
  const someOrEmptyStringParams = [
    'title',
    'tags',
    'account',
    'start_date',
    'end_date',
  ];
  for (const param of someOrEmptyStringParams) {
    const value = searchParams.get(param) || '';
    formData.append(param, value);
  }
  const pageParam = (searchParams.get('page') || '1') as string;
  formData.append('page', pageParam);
  return formData;
}

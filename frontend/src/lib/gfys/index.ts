import {
  GfyData,
  GfyParsedResponse,
  GfyResponse,
  GfyResult,
} from '@/lib/types/gfys';
import { validDateStringOrNull } from '@/lib/utils';
import { ReadonlyURLSearchParams } from 'next/navigation';

export const DEFAULT_GFY_SORT = 'recent';
export const GFY_SORTS = [DEFAULT_GFY_SORT, 'oldest', 'most_viewed'] as const;

// Order is the canonical URL's param order, so keep it stable.
const GFY_FILTER_PARAMS = [
  'title',
  'tags',
  'account',
  'start_date',
  'end_date',
  'sort',
] as const;

type GfySearchParamsInput =
  | ReadonlyURLSearchParams
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export function parseGfyResponse(resp: GfyResponse): GfyParsedResponse {
  const newData: Array<GfyData> = [];
  resp.results?.map((d: GfyResult) => {
    newData.push({
      imgurId: d.imgur_id,
      title: d.imgur_title,
      displayTitle: d.display_title,
      tags: d.tags,
      date: d.date,
      account: d.account,
      width: d.width || null,
      height: d.height || null,
      viewCount: d.view_count,
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

export function formatGfyViewCount(viewCount: number) {
  return new Intl.NumberFormat('en-GB').format(viewCount);
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
  for (const param of [...GFY_FILTER_PARAMS, 'page']) {
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
  for (const param of GFY_FILTER_PARAMS) {
    const value = searchParams.get(param) || '';
    formData.append(param, value);
  }
  const pageParam = (searchParams.get('page') || '1') as string;
  formData.append('page', pageParam);
  return formData;
}

/**
 * Canonical `/gfys` listing URL for a set of search params.
 *
 * Collapses URLs that return the same results (Search Console flagged them as
 * duplicates) while keeping distinct filters and pages distinct. Each rule
 * mirrors how `searchGfys` and the API's `filter_gfys` read the params: tags
 * are matched as a case-insensitive comma-separated set, an unknown sort falls
 * back to `recent`, invalid dates are ignored and `account=All` means no
 * account filter.
 */
export function getCanonicalGfysUrl(searchParams: GfySearchParamsInput) {
  const params = cleanedSearchParams(toURLSearchParams(searchParams));
  const canonical = new URLSearchParams();

  const title = params.get('title')?.trim();
  if (title) canonical.set('title', title);

  const tags = canonicalTags(params.get('tags') || '');
  if (tags) canonical.set('tags', tags);

  const account = params.get('account')?.trim();
  if (account && account !== 'All') canonical.set('account', account);

  for (const dateParam of ['start_date', 'end_date']) {
    const date = validDateStringOrNull(params.get(dateParam) || '');
    if (date) canonical.set(dateParam, date);
  }

  const sort = params.get('sort')?.trim();
  if (sort && sort !== DEFAULT_GFY_SORT && isGfySort(sort)) {
    canonical.set('sort', sort);
  }

  const page = parseInt(params.get('page') || '', 10);
  if (page > 1) canonical.set('page', String(page));

  const query = canonical.toString();
  return query ? `/gfys?${query}` : '/gfys';
}

function canonicalTags(tags: string) {
  const names = new Set(
    tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  );
  return Array.from(names).sort().join(',');
}

function isGfySort(sort: string): sort is (typeof GFY_SORTS)[number] {
  return (GFY_SORTS as readonly string[]).includes(sort);
}

function toURLSearchParams(searchParams: GfySearchParamsInput) {
  if (searchParams instanceof URLSearchParams) {
    return new URLSearchParams(searchParams.toString());
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return params;
}

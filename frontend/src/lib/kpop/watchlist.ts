import { API_KPOP } from '@/lib/consts/urls';
import {
  ComebacksResult,
  ComebacksResultSchema,
  KpopArtist,
  KpopArtistsResultSchema,
  WatchlistComebacksQuery,
  WatchlistComebacksQuerySchema,
} from '@/lib/types/kpop';

export function partitionKpopArtistResults(
  artists: KpopArtist[],
  query: string
) {
  const normalizedQuery = query.trim().normalize('NFKC').toLowerCase();
  const exact = artists.find(
    (artist) =>
      artist.name.trim().normalize('NFKC').toLowerCase() === normalizedQuery
  );

  return {
    exact,
    covered: exact
      ? artists.filter((artist) => artist.public_id !== exact.public_id)
      : [],
    fallback: exact ? [] : artists,
  };
}

export async function fetchWatchlistComebacks(
  query: WatchlistComebacksQuery,
  signal?: AbortSignal
): Promise<ComebacksResult> {
  const parsedQuery = WatchlistComebacksQuerySchema.safeParse(query);
  if (!parsedQuery.success) {
    throw new Error('invalid_watchlist_query');
  }

  const response = await fetch(API_KPOP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsedQuery.data),
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`http_${response.status}`);
  }

  const data = await response.json();
  const parsedResponse = ComebacksResultSchema.safeParse(data);
  if (!parsedResponse.success) {
    throw new Error('invalid_response');
  }

  return parsedResponse.data;
}

export async function fetchKpopArtists(
  query: string,
  signal?: AbortSignal
): Promise<KpopArtist[]> {
  const searchParams = new URLSearchParams({ q: query });
  const response = await fetch(`${API_KPOP}/artists?${searchParams}`, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`http_${response.status}`);
  }

  const data = await response.json();
  const parsedResponse = KpopArtistsResultSchema.safeParse(data);
  if (!parsedResponse.success) {
    throw new Error('invalid_response');
  }

  return parsedResponse.data;
}

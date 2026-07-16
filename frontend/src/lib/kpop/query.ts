import { validDateStringOrNull } from '@/lib/utils';
import { ReadonlyURLSearchParams } from 'next/navigation';

export const DEFAULT_RECENT_BUFFER_DAYS = 7;
export const TIMELINE_JUMP_DAYS = 7;
export const OPEN_ENDED_PAGE_SIZE = 10;
export const BOUNDED_WINDOW_PAGE_SIZE = 100;
export const ARCHIVE_START_DATE_COMPACT = '000101';
export const FOLLOWING_LOOKBACK_DAYS = 30;

export type KpopView = 'timeline' | 'following';

export type KpopQueryState = {
  artist: string;
  title: string;
  exact: boolean;
  startDate: string;
  endDate: string;
  page: number;
};

type SearchParamsInput =
  | ReadonlyURLSearchParams
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export function getDefaultStartDateCompact() {
  return formatCompactDate(
    addDays(getTodayUtcDate(), -DEFAULT_RECENT_BUFFER_DAYS)
  );
}

export function getTodayDateCompact() {
  return formatCompactDate(getTodayUtcDate());
}

export function getFollowingStartDate() {
  return formatApiDate(
    addDays(getTodayUtcDate(), -FOLLOWING_LOOKBACK_DAYS)
  );
}

export function getKpopView(searchParams: SearchParamsInput): KpopView {
  return toURLSearchParams(searchParams).get('view') === 'following'
    ? 'following'
    : 'timeline';
}

export function getCanonicalKpopSearchParams(
  searchParams: SearchParamsInput
): URLSearchParams {
  const params = toURLSearchParams(searchParams);
  const artist = params.get('artist')?.trim() || '';
  const title = params.get('title')?.trim() || '';
  const exact = params.get('exact') ? 'on' : '';
  let startDate = canonicalCompactDate(params.get('start-date'));
  let endDate = canonicalCompactDate(params.get('end-date'));
  const page = getValidPageValue(params.get('page'));
  const view = getKpopView(params);

  if (!startDate) {
    startDate = getDefaultStartDateCompact();
  }

  if (startDate && endDate) {
    const start = compactDateToUtcDate(startDate);
    const end = compactDateToUtcDate(endDate);
    if (start && end && end < start) {
      const previousStart = startDate;
      startDate = endDate;
      endDate = previousStart;
    }
  }

  const canonical = new URLSearchParams();
  canonical.set('start-date', startDate);
  if (endDate) {
    canonical.set('end-date', endDate);
  }
  if (artist) {
    canonical.set('artist', artist);
  }
  if (title) {
    canonical.set('title', title);
  }
  if (exact) {
    canonical.set('exact', exact);
  }
  if (page > 1) {
    canonical.set('page', String(page));
  }
  if (view === 'following') {
    canonical.set('view', view);
  }
  return canonical;
}

export function searchParamsToKpopQueryState(
  searchParams: SearchParamsInput
): KpopQueryState {
  const params = getCanonicalKpopSearchParams(searchParams);
  return {
    artist: params.get('artist') || '',
    title: params.get('title') || '',
    exact: params.get('exact') === 'on',
    startDate: params.get('start-date') || getDefaultStartDateCompact(),
    endDate: params.get('end-date') || '',
    page: getValidPageValue(params.get('page')),
  };
}

export function getKpopApiQuery(state: KpopQueryState) {
  const isBoundedWindow = Boolean(state.startDate && state.endDate);
  return {
    artist: state.artist,
    title: state.title,
    start_date: compactToApiDate(state.startDate),
    end_date: compactToApiDate(state.endDate),
    page: String(state.page),
    page_size: String(
      isBoundedWindow ? BOUNDED_WINDOW_PAGE_SIZE : OPEN_ENDED_PAGE_SIZE
    ),
    exact: state.exact ? 'on' : '',
  };
}

export function buildTimelineShiftSearchParams(
  searchParams: SearchParamsInput,
  direction: 'earlier' | 'later'
) {
  const params = getCanonicalKpopSearchParams(searchParams);
  const state = searchParamsToKpopQueryState(params);
  const multiplier = direction === 'earlier' ? -1 : 1;
  const currentStart =
    compactDateToUtcDate(state.startDate) || getTodayUtcDate();
  const currentEnd = compactDateToUtcDate(state.endDate);

  let nextStart: Date;
  let nextEnd: Date | null;

  if (currentEnd) {
    nextStart = addDays(currentStart, multiplier * TIMELINE_JUMP_DAYS);
    nextEnd = addDays(currentEnd, multiplier * TIMELINE_JUMP_DAYS);
  } else if (direction === 'earlier') {
    nextEnd = addDays(currentStart, -1);
    nextStart = addDays(nextEnd, -(TIMELINE_JUMP_DAYS - 1));
  } else {
    nextStart = addDays(currentStart, TIMELINE_JUMP_DAYS);
    nextEnd = addDays(nextStart, TIMELINE_JUMP_DAYS - 1);
  }

  params.set('start-date', formatCompactDate(nextStart));
  if (nextEnd) {
    params.set('end-date', formatCompactDate(nextEnd));
  } else {
    params.delete('end-date');
  }
  params.delete('page');
  params.delete('view');
  return params;
}

export function buildRecentSearchParams(searchParams: SearchParamsInput) {
  const params = getCanonicalKpopSearchParams(searchParams);
  params.set('start-date', getDefaultStartDateCompact());
  params.delete('end-date');
  params.delete('page');
  params.delete('view');
  return params;
}

export function buildTodaySearchParams(searchParams: SearchParamsInput) {
  const params = getCanonicalKpopSearchParams(searchParams);
  params.set('start-date', getTodayDateCompact());
  params.delete('end-date');
  params.delete('page');
  params.delete('view');
  return params;
}

export function buildAllSearchParams(searchParams: SearchParamsInput) {
  const params = getCanonicalKpopSearchParams(searchParams);
  params.set('start-date', ARCHIVE_START_DATE_COMPACT);
  params.delete('end-date');
  params.delete('page');
  params.delete('view');
  return params;
}

export function buildFollowingSearchParams(searchParams: SearchParamsInput) {
  const params = getCanonicalKpopSearchParams(searchParams);
  params.set('view', 'following');
  params.delete('page');
  return params;
}

export function buildClearSearchParams(searchParams: SearchParamsInput) {
  const params = new URLSearchParams();
  params.set('start-date', getDefaultStartDateCompact());
  return params;
}

export function getTimelineLabel(state: KpopQueryState) {
  const start = compactDateToUtcDate(state.startDate);
  const end = compactDateToUtcDate(state.endDate);
  if (!start) {
    return 'Recent + Upcoming';
  }
  if (!end) {
    if (state.startDate === getDefaultStartDateCompact()) {
      return 'Recent + Upcoming';
    }
    return `From ${formatHumanDate(start)} onward`;
  }
  return `${formatHumanDate(start)} - ${formatHumanDate(end)}`;
}

export function dateStringIsDefaultRecentWindow(dateString: string) {
  return dateString === getDefaultStartDateCompact();
}

export function compactDateToUtcDate(dateString: string) {
  const apiDate = compactToApiDate(dateString);
  if (!apiDate) {
    return null;
  }
  return utcDateFromApiDate(apiDate);
}

function canonicalCompactDate(value: string | null) {
  if (!value) {
    return '';
  }
  const trimmedValue = value.trim();
  const useFourDigitYear = trimmedValue.replaceAll('-', '').length === 8;
  const validDate = validDateStringOrNull(value);
  if (!validDate) {
    return '';
  }
  const digitsOnly = validDate.replaceAll('-', '');
  return useFourDigitYear ? digitsOnly : digitsOnly.slice(2);
}

function compactToApiDate(value: string) {
  if (!value) {
    return '';
  }
  const validDate = validDateStringOrNull(value);
  return validDate || '';
}

function formatCompactDate(date: Date) {
  const year = date.getUTCFullYear().toString().slice(2);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatApiDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayUtcDate() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function utcDateFromApiDate(apiDate: string) {
  const [year, month, day] = apiDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatHumanDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function getValidPageValue(pageValue: string | null) {
  if (!pageValue) {
    return 1;
  }
  const page = Number.parseInt(pageValue, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function toURLSearchParams(searchParams: SearchParamsInput) {
  if (searchParams instanceof URLSearchParams) {
    return new URLSearchParams(searchParams.toString());
  }

  if (typeof (searchParams as { entries?: unknown }).entries === 'function') {
    const iterableParams = searchParams as unknown as {
      entries: () => IterableIterator<[string, string]>;
    };
    const entries = Array.from(iterableParams.entries());
    return new URLSearchParams(entries);
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      if (value[0]) {
        params.set(key, value[0]);
      }
      continue;
    }
    if (value) {
      params.set(key, value);
    }
  }
  return params;
}

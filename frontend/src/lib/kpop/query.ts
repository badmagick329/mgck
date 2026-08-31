import { validDateStringOrNull } from '@/lib/utils';
import { ReadonlyURLSearchParams } from 'next/navigation';

export const DEFAULT_RECENT_BUFFER_DAYS = 7;
export const TIMELINE_EXPANSION_DAYS = 7;
export const OPEN_ENDED_PAGE_SIZE = 50;
export const BOUNDED_WINDOW_PAGE_SIZE = 100;
export const ARCHIVE_START_DATE_COMPACT = '000101';
export const FOLLOWING_LOOKBACK_DAYS = 30;

export type KpopView = 'timeline' | 'following' | 'search';
export type KpopPreset = 'recent' | 'all' | 'following' | null;

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

export function getFollowingStartDate(lookbackDays = FOLLOWING_LOOKBACK_DAYS) {
  return formatApiDate(addDays(getTodayUtcDate(), -lookbackDays));
}

export function getKpopView(searchParams: SearchParamsInput): KpopView {
  const view = toURLSearchParams(searchParams).get('view');
  if (view === 'following' || view === 'search') return view;
  return 'timeline';
}

export function hasKpopSearchFilters(searchParams: SearchParamsInput) {
  const params = getCanonicalKpopSearchParams(searchParams);
  return Boolean(
    params.get('artist') || params.get('title') || params.get('exact')
  );
}

export function getActiveKpopPreset(
  searchParams: SearchParamsInput
): KpopPreset {
  const params = getCanonicalKpopSearchParams(searchParams);
  if (getKpopView(params) === 'following') {
    return 'following';
  }

  const state = searchParamsToKpopQueryState(params);
  if (state.endDate) {
    return null;
  }
  if (state.startDate === getDefaultStartDateCompact()) {
    return 'recent';
  }
  if (state.startDate === ARCHIVE_START_DATE_COMPACT) {
    return 'all';
  }
  return null;
}

export function getCanonicalKpopSearchParams(
  searchParams: SearchParamsInput
): URLSearchParams {
  const params = toURLSearchParams(searchParams);
  const artist = params.get('artist')?.trim() || '';
  const title = params.get('title')?.trim() || '';
  const exact = params.get('exact') ? 'on' : '';
  let startDate = clampCompactDateToArchiveStart(
    canonicalCompactDate(params.get('start-date'))
  );
  let endDate = clampCompactDateToArchiveStart(
    canonicalCompactDate(params.get('end-date'))
  );
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
  if (view === 'following' || view === 'search') {
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

export function buildTimelineExpansionSearchParams(
  searchParams: SearchParamsInput,
  direction: 'earlier' | 'later'
) {
  const params = getCanonicalKpopSearchParams(searchParams);
  const state = searchParamsToKpopQueryState(params);
  const currentStart =
    compactDateToUtcDate(state.startDate) || getTodayUtcDate();
  const currentEnd = compactDateToUtcDate(state.endDate);
  const archiveStart = getArchiveStartUtcDate();

  if (direction === 'earlier' && currentStart <= archiveStart) {
    params.delete('page');
    params.delete('view');
    return params;
  }

  if (direction === 'earlier') {
    const nextStart = addDays(currentStart, -TIMELINE_EXPANSION_DAYS);
    params.set(
      'start-date',
      formatCompactDate(nextStart < archiveStart ? archiveStart : nextStart)
    );
  } else if (currentEnd) {
    params.set(
      'end-date',
      formatCompactDate(addDays(currentEnd, TIMELINE_EXPANSION_DAYS))
    );
  }
  params.delete('page');
  params.delete('view');
  return params;
}

export function canExpandTimelineEarlier(state: KpopQueryState) {
  const start = compactDateToUtcDate(state.startDate);
  return Boolean(start && start > getArchiveStartUtcDate());
}

export function buildRecentSearchParams(searchParams: SearchParamsInput) {
  const params = getCanonicalKpopSearchParams(searchParams);
  params.set('start-date', getDefaultStartDateCompact());
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

export function buildSearchSearchParams(searchParams: SearchParamsInput) {
  const params = getCanonicalKpopSearchParams(searchParams);
  params.set('view', 'search');
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
    return 'Recent and upcoming';
  }
  if (!end) {
    if (state.startDate === getDefaultStartDateCompact()) {
      return 'Recent and upcoming';
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

function clampCompactDateToArchiveStart(value: string) {
  if (!value) {
    return '';
  }
  const date = compactDateToUtcDate(value);
  return date && date < getArchiveStartUtcDate()
    ? ARCHIVE_START_DATE_COMPACT
    : value;
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

function getArchiveStartUtcDate() {
  return new Date(Date.UTC(2000, 0, 1));
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

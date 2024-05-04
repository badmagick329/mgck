export function recentDate(pastDays: number = 3) {
  const today = new Date();
  today.setDate(today.getDate() - pastDays);
  return today.toISOString().split('T')[0];
}

export const namesAndPlaceHolders = [
  {
    name: 'start-date',
    placeholder: 'Start Date (YYYY-MM-DD)',
  },
  {
    name: 'end-date',
    placeholder: 'End Date (YYYY-MM-DD)',
  },
  {
    name: 'artist',
    placeholder: 'Artist',
  },
  {
    name: 'title',
    placeholder: 'Title',
  },
  {
    name: 'exact',
    placeholder: 'Exact Artist Match',
  },
];
export const formKeys = namesAndPlaceHolders.map(({ name }) => name);

export function searchParamsAreEmpty(searchParams: URLSearchParams) {
  for (const key of formKeys) {
    if (searchParams.has(key)) {
      return false;
    }
  }
  return true;
}

export function getRecentDateParams(searchParams: URLSearchParams) {
  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.set('start-date', recentDate());
  return newSearchParams;
}

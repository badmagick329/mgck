import { ReadonlyURLSearchParams } from 'next/navigation';

export function dateStringIsToday(dateString: string) {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const targetDateString = new Date(dateString).toISOString().split('T')[0];
  return todayString === targetDateString;
}

export function recentDate(pastDays: number = 3) {
  const today = new Date();
  today.setDate(today.getDate() - pastDays);
  return today.toISOString().split('T')[0];
}

export const namesAndPlaceHolders = [
  {
    name: 'start-date',
    placeholder: 'Start Date (YYMMDD)',
  },
  {
    name: 'end-date',
    placeholder: 'End Date (YYMMDD)',
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
    placeholder: 'Exact Match',
  },
];
export const formKeys = namesAndPlaceHolders.map(({ name }) => name);

export function searchParamsAreEmpty(searchParams: ReadonlyURLSearchParams) {
  for (const key of formKeys) {
    if (searchParams.has(key)) {
      return false;
    }
  }
  return true;
}

export function getRecentDateParams(searchParams: ReadonlyURLSearchParams) {
  const newSearchParams = new URLSearchParams(searchParams.toString());
  newSearchParams.set('start-date', recentDate().replaceAll('-', '').slice(2));
  return newSearchParams;
}
export function clearFormInputs(form: HTMLFormElement | null) {
  if (!form) return;
  for (const input of form) {
    if (input instanceof HTMLInputElement) {
      if (input.type === 'checkbox') {
        input.checked = false;
        continue;
      }
      input.value = '';
    }
  }
}

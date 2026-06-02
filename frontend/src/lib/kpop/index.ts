import { DEFAULT_RECENT_BUFFER_DAYS } from './query';

export function dateStringIsToday(dateString: string) {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const targetDateString = new Date(dateString).toISOString().split('T')[0];
  return todayString === targetDateString;
}

export function recentDate(pastDays: number = DEFAULT_RECENT_BUFFER_DAYS) {
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

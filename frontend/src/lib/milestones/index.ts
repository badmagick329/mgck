import { format } from 'date-fns-tz';
import { DiffPeriod } from '@/lib/types/milestones';

export const getDiffInDays = (date: Date) =>
  Math.max(
    Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    0
  );

export const getDiffIn = (date: Date, period: DiffPeriod) => {
  let divideBy;
  switch (period) {
    case 'days':
      divideBy = 1000 * 60 * 60 * 24;
      break;
    case 'hours':
      divideBy = 1000 * 60 * 60;
      break;
    case 'minutes':
      divideBy = 1000 * 60;
      break;
    case 'weeks':
      divideBy = 1000 * 60 * 60 * 24 * 7;
      break;
    case 'seconds':
      divideBy = 1000;
      break;
  }
  if (period === 'weeks') {
    const val = ((date.getTime() - new Date().getTime()) / divideBy).toFixed(2);
    if (val.endsWith('.00') && val !== '0.00') {
      return Math.round(Number(val));
    }
    return Number(val);
  }
  return Math.ceil((date.getTime() - new Date().getTime()) / divideBy);
};

export const getLocalDatetimeDisplay = (date: Date, timezone: string) =>
  format(date, 'yyyy-MM-dd HH:mm zzz', {
    timeZone: timezone,
  });

export const getLocalDateDisplay = (date: Date, timezone: string) =>
  format(date, 'yyyy-MM-dd', {
    timeZone: timezone,
  });

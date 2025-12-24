import { format } from 'date-fns-tz';
import { ServerMilestone } from '@/lib/types/milestones';

export const serverMilestoneToClient = (
  milestoneFromServer: ServerMilestone
) => {
  return {
    name: milestoneFromServer.event_name,
    timestamp: new Date(milestoneFromServer.event_datetime_utc).getTime(),
    timezone: milestoneFromServer.event_timezone,
    color: milestoneFromServer.color,
  };
};

export const getDiffInDays = (date: Date) =>
  Math.max(
    Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    0
  );

export const getLocalDatetimeDisplay = (date: Date, timezone: string) =>
  format(date, 'yyyy-MM-dd HH:mm zzz', {
    timeZone: timezone,
  });

export const getLocalDateDisplay = (date: Date, timezone: string) =>
  format(date, 'yyyy-MM-dd', {
    timeZone: timezone,
  });

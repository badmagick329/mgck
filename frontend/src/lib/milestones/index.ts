import { ServerMilestone } from '@/lib/types/milestones';

export const serverMilestoneToClient = (
  milestoneFromServer: ServerMilestone
) => {
  return {
    name: milestoneFromServer.event_name,
    timestamp: new Date(milestoneFromServer.event_datetime_utc).getTime(),
    timezone: milestoneFromServer.event_timezone,
  };
};

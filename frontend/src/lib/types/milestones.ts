import { z } from 'zod';

export const serverMilestoneSchema = z.object({
  id: z.number(),
  event_name: z.string().trim().nonempty(),
  event_datetime_utc: z.string().trim().nonempty(),
  event_timezone: z.string().trim().nonempty(),
  created: z.string().trim().nonempty(),
});
export type ServerMilestone = z.infer<typeof serverMilestoneSchema>;

export const serverMilestoneListSchema = z.array(serverMilestoneSchema);

export const clientMilestoneSchema = z.object({
  name: z.string().trim().nonempty(),
  timestamp: z.number().nonnegative(),
  timezone: z.string(),
});
export type ClientMilestone = z.infer<typeof clientMilestoneSchema>;

export const clientMilestoneListSchema = z.array(clientMilestoneSchema);

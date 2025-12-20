import { z } from 'zod';
export type Milestone = { name: string; timestamp: number; timezone: string };

export const milestoneSchema = z.object({
  id: z.number(),
  event_name: z.string(),
  event_datetime_utc: z.string(),
  event_timezone: z.string(),
  created: z.string(),
});
export type MilestoneFromServer = z.infer<typeof milestoneSchema>;

export const milestoneListSchema = z.array(milestoneSchema);

export const clientMilestoneSchema = z.object({
  name: z.string(),
  timestamp: z.number(),
  timezone: z.string(),
});
export type ClientMilestone = z.infer<typeof clientMilestoneSchema>;

export const clientMilestoneListSchema = z.array(clientMilestoneSchema);

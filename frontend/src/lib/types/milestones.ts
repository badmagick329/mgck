import { z } from 'zod';

export const serverMilestoneSchema = z.object({
  id: z.number(),
  event_name: z.string().trim().nonempty(),
  event_datetime_utc: z.string().trim().nonempty(),
  event_timezone: z.string().trim().nonempty(),
  created: z.string().trim().nonempty(),
  color: z.string().refine((s) => s.length === 7 || s.length === 4, {
    message: 'Color must be a valid hex code of length 7 or 4',
  }),
});
export type ServerMilestone = z.infer<typeof serverMilestoneSchema>;

export const serverMilestoneListSchema = z.array(serverMilestoneSchema);

export const clientMilestoneSchema = z.object({
  name: z.string().trim().nonempty({ message: 'Name cannot be empty' }),
  timestamp: z.number(),
  timezone: z.string(),
  color: z.string().refine((s) => s.length === 7 || s.length === 4, {
    message: 'Color must be a valid hex code of length 7 or 4',
  }),
});
export type ClientMilestone = z.infer<typeof clientMilestoneSchema>;

export const clientMilestoneListSchema = z.array(clientMilestoneSchema);

export const diffPeriodEnum = z.enum([
  'days',
  'hours',
  'minutes',
  'weeks',
  'seconds',
]);

export const milestonesConfig = z.object({
  milestonesOnServer: z.boolean(),
  diffPeriod: diffPeriodEnum,
});

export type MilestonesConfig = z.infer<typeof milestonesConfig>;

export type DiffPeriod = z.infer<typeof diffPeriodEnum>;

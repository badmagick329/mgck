import { z } from 'zod';

export const serverMilestoneSchema = z.object({
  id: z.number(),
  event_name: z.string().trim().nonempty().max(255),
  event_datetime_utc: z.string().trim().nonempty(),
  event_timezone: z.string().trim().nonempty().max(63),
  created: z.string().trim().nonempty(),
  color: z
    .string()
    .refine((s) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(s), {
      message: 'Color must be a valid hex code like #RRGGBB or #RGB',
    }),
});
export type ServerMilestone = z.infer<typeof serverMilestoneSchema>;

export const serverMilestoneListSchema = z.array(serverMilestoneSchema);

export const clientMilestoneSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty({ message: 'Name cannot be empty' })
    .max(255, {
      message: 'Name cannot exceed 255 characters',
    }),
  timestamp: z.number(),
  timezone: z.string().nonempty().max(63),
  color: z
    .string()
    .refine((s) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(s), {
      message: 'Color must be a valid hex code like #RRGGBB or #RGB',
    }),
});
export type ClientMilestone = z.infer<typeof clientMilestoneSchema>;

export const clientMilestoneListSchema = z.array(clientMilestoneSchema);

export const storedMilestoneSchema = clientMilestoneSchema.extend({
  publicId: z.string().uuid(),
  updatedAt: z.number().int().nonnegative(),
  deletedAt: z.number().int().nonnegative().nullable(),
});

export type StoredMilestone = z.infer<typeof storedMilestoneSchema>;

export const diffPeriodEnum = z.enum([
  'seconds',
  'minutes',
  'hours',
  'days',
  'weeks',
]);

export const milestonesConfig = z.object({
  milestonesOnServer: z.boolean(),
  diffPeriod: diffPeriodEnum,
});

export type MilestonesConfig = z.infer<typeof milestonesConfig>;

export type DiffPeriod = z.infer<typeof diffPeriodEnum>;

export const milestoneLocalStoreSchema = z.object({
  version: z.literal(2),
  accountUserId: z.string().min(1).nullable(),
  records: z.array(storedMilestoneSchema),
  config: milestonesConfig,
  hiddenMilestoneIds: z.array(z.string().uuid()),
});

export type MilestoneLocalStore = z.infer<typeof milestoneLocalStoreSchema>;

export type MilestoneAccount = {
  userId: string;
  username: string;
};

export const milestonesBackupSchema = z.object({
  hiddenMilestones: z
    .array(z.string().trim())
    .transform((arr) => arr.filter(Boolean))
    .default([]),
  milestonesConfig: milestonesConfig.default({
    milestonesOnServer: false,
    diffPeriod: 'days',
  }),
  milestones: z.array(clientMilestoneSchema).default([]),
});

export type MilestonesBackup = z.infer<typeof milestonesBackupSchema>;

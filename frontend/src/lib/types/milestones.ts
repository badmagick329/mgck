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

const validateStoredMilestoneRecords = (
  records: StoredMilestone[],
  context: z.RefinementCtx
) => {
  const ids = new Set<string>();
  records.forEach((record, index) => {
    if (ids.has(record.publicId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate milestone publicId',
        path: [index, 'publicId'],
      });
    }
    ids.add(record.publicId);
    if (record.deletedAt !== null && record.deletedAt !== record.updatedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'deletedAt must equal updatedAt for tombstones',
        path: [index, 'deletedAt'],
      });
    }
  });
};

export const storedMilestoneSnapshotSchema = z
  .array(storedMilestoneSchema)
  .max(1000)
  .superRefine(validateStoredMilestoneRecords);

export const storedMilestoneResponseSchema = z
  .array(storedMilestoneSchema)
  .superRefine(validateStoredMilestoneRecords);

export const milestoneSyncWireRecordSchema = z.object({
  public_id: z.string().uuid(),
  name: clientMilestoneSchema.shape.name,
  timestamp: z.number().int(),
  timezone: clientMilestoneSchema.shape.timezone,
  color: clientMilestoneSchema.shape.color,
  updated_at: z.number().int().nonnegative(),
  deleted_at: z.number().int().nonnegative().nullable(),
});

export const milestoneSyncResponseSchema = z.object({
  records: z.array(milestoneSyncWireRecordSchema),
});

export type MilestoneSyncWireRecord = z.infer<
  typeof milestoneSyncWireRecordSchema
>;

export type MilestoneSyncErrorKind =
  | 'unauthenticated'
  | 'invalid'
  | 'conflict'
  | 'transient';

export type MilestoneSyncResult =
  | { ok: true; data: StoredMilestone[] }
  | { ok: false; kind: MilestoneSyncErrorKind; error: string };

export type MilestoneSyncStatus =
  | 'idle'
  | 'syncing'
  | 'retrying'
  | 'not-synced';

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

export const milestoneAutomaticSyncMetadataSchema = z
  .object({
    bootstrapCompleted: z.boolean(),
    lastSuccessfulSyncAt: z.number().int().nonnegative().nullable(),
  })
  .default({
    bootstrapCompleted: false,
    lastSuccessfulSyncAt: null,
  });

export const milestoneLocalStoreSchema = z.object({
  version: z.literal(2),
  accountUserId: z.string().min(1).nullable(),
  records: z.array(storedMilestoneSchema),
  config: milestonesConfig,
  hiddenMilestoneIds: z.array(z.string().uuid()),
  sync: milestoneAutomaticSyncMetadataSchema,
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

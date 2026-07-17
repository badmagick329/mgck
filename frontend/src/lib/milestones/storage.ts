import {
  ClientMilestone,
  clientMilestoneSchema,
  diffPeriodEnum,
  MilestoneLocalStore,
  milestoneLocalStoreSchema,
  StoredMilestone,
  storedMilestoneSchema,
} from '@/lib/types/milestones';
import { z } from 'zod';

export const ANONYMOUS_STORE_KEY = 'mgck:milestones:anonymous:v3';
export const LAST_ACCOUNT_KEY = 'mgck:milestones:last-account:v1';
export const ANONYMOUS_CONSUMED_KEY = 'mgck:milestones:anonymous-consumed:v1';
export const ANONYMOUS_OWNER_KEY = 'mgck:milestones:anonymous-owner:v1';
export const RECOVERY_KEY_PREFIX = 'mgck:milestones:recovery:';

const V2_ANONYMOUS_STORE_KEY = 'mgck:milestones:anonymous:v2';
const LEGACY_BACKUP_KEY = 'mgck:milestones:legacy-backup:v1';
const LEGACY_MILESTONES_KEY = 'milestones';
const LEGACY_CONFIG_KEY = 'milestonesConfig';
const LEGACY_HIDDEN_KEY = 'hiddenMilestones';

const v2ConfigSchema = z.object({
  milestonesOnServer: z.boolean(),
  diffPeriod: diffPeriodEnum,
});

const v2SyncMetadataSchema = z
  .object({
    bootstrapCompleted: z.boolean(),
    lastSuccessfulSyncAt: z.number().int().nonnegative().nullable(),
  })
  .default({
    bootstrapCompleted: false,
    lastSuccessfulSyncAt: null,
  });

const milestoneLocalStoreV2Schema = z.object({
  version: z.literal(2),
  accountUserId: z.string().min(1).nullable(),
  records: z.array(storedMilestoneSchema),
  config: v2ConfigSchema,
  hiddenMilestoneIds: z.array(z.string().uuid()),
  sync: v2SyncMetadataSchema,
});

type MilestoneLocalStoreV2 = z.infer<typeof milestoneLocalStoreV2Schema>;

type StoreMigration = {
  store: MilestoneLocalStore;
  warning: string | null;
  sourceKeys: string[];
  targetExisted: boolean;
};

export type StorageLoadResult = {
  store: MilestoneLocalStore;
  storageKey: string;
  warning: string | null;
};

export function accountStoreKey(userId: string) {
  return `mgck:milestones:account:${encodeURIComponent(userId)}:v3`;
}

export function v2AccountStoreKey(userId: string) {
  return `mgck:milestones:account:${encodeURIComponent(userId)}:v2`;
}

export function createEmptyMilestoneStore(
  accountUserId: string | null
): MilestoneLocalStore {
  return {
    version: 3,
    accountUserId,
    records: [],
    config: {
      diffPeriod: 'days',
    },
    hiddenMilestoneIds: [],
    sync: {
      bootstrapCompleted: false,
      lastSuccessfulSyncAt: null,
      bootstrapPreference: 'local',
    },
  };
}

export function activeMilestones(records: StoredMilestone[]) {
  return records
    .filter((record) => record.deletedAt === null)
    .sort((first, second) => first.timestamp - second.timestamp);
}

export function createStoredMilestone(
  milestone: ClientMilestone,
  now = Date.now(),
  publicId = crypto.randomUUID()
): StoredMilestone {
  return {
    ...milestone,
    publicId,
    updatedAt: now,
    deletedAt: null,
  };
}

export function loadMilestoneStore(
  storage: Storage,
  authenticatedUserId: string | null,
  now = Date.now()
): StorageLoadResult {
  if (authenticatedUserId) {
    storage.setItem(LAST_ACCOUNT_KEY, authenticatedUserId);
  }
  const ownerId =
    authenticatedUserId || storage.getItem(LAST_ACCOUNT_KEY) || null;
  const storageKey = ownerId ? accountStoreKey(ownerId) : ANONYMOUS_STORE_KEY;
  const migration = loadOrMigrateOwnerStore(storage, ownerId, now, true);
  let store = migration.store;
  let warning = migration.warning;

  if (authenticatedUserId && !storage.getItem(ANONYMOUS_CONSUMED_KEY)) {
    const anonymousMigration = loadOrMigrateOwnerStore(
      storage,
      null,
      now,
      false
    );
    warning = warning || anonymousMigration.warning;
    const anonymousSaved = persistMigratedStore(
      storage,
      ANONYMOUS_STORE_KEY,
      anonymousMigration.store
    );
    if (anonymousSaved) {
      for (const sourceKey of anonymousMigration.sourceKeys) {
        storage.removeItem(sourceKey);
      }
    } else {
      warning =
        warning ||
        'Your anonymous milestone data could not be migrated safely.';
    }
    const anonymous = milestoneLocalStoreSchema.safeParse(
      anonymousMigration.store
    );
    let anonymousOwner = storage.getItem(ANONYMOUS_OWNER_KEY);
    if (
      anonymous.success &&
      anonymousMigration.targetExisted &&
      !anonymousOwner
    ) {
      anonymousOwner = authenticatedUserId;
      storage.setItem(ANONYMOUS_OWNER_KEY, authenticatedUserId);
    }
    if (
      anonymous.success &&
      anonymousMigration.targetExisted &&
      anonymousOwner === authenticatedUserId
    ) {
      store = mergeAnonymousIntoAccount(
        store,
        anonymous.data,
        migration.targetExisted
      );
    }
  }

  const saved = persistMigratedStore(storage, storageKey, store);
  if (saved) {
    for (const sourceKey of migration.sourceKeys) {
      storage.removeItem(sourceKey);
    }
    storage.removeItem(LEGACY_BACKUP_KEY);
  } else {
    warning = warning || 'Your milestone data could not be migrated safely.';
  }
  return { store, storageKey, warning };
}

function loadOrMigrateOwnerStore(
  storage: Storage,
  ownerId: string | null,
  now: number,
  allowUnscopedLegacy: boolean
): StoreMigration {
  const storageKey = ownerId ? accountStoreKey(ownerId) : ANONYMOUS_STORE_KEY;
  const existingRaw = storage.getItem(storageKey);
  const existing = parseStore(existingRaw);
  if (existing.success && existing.data.accountUserId === ownerId) {
    return {
      store: existing.data,
      warning: null,
      sourceKeys: [],
      targetExisted: true,
    };
  }

  let warning: string | null = null;
  if (existingRaw !== null) {
    preserveRecovery(storage, existingRaw, now);
    warning = 'Some saved milestone data could not be loaded.';
  }

  const v2Key = ownerId ? v2AccountStoreKey(ownerId) : V2_ANONYMOUS_STORE_KEY;
  const v2Raw = storage.getItem(v2Key);
  const v2 = parseV2Store(v2Raw);
  if (v2.success && v2.data.accountUserId === ownerId) {
    return {
      store: migrateV2Store(v2.data),
      warning,
      sourceKeys: [v2Key],
      targetExisted: true,
    };
  }
  if (v2Raw !== null) {
    preserveRecovery(storage, v2Raw, now);
    warning = warning || 'Some saved milestone data could not be loaded.';
  }

  if (allowUnscopedLegacy) {
    const legacy = migrateLegacyStore(storage, ownerId, now);
    if (legacy) {
      return {
        ...legacy,
        warning: warning || legacy.warning,
        sourceKeys: [...(v2Raw !== null ? [v2Key] : []), ...legacy.sourceKeys],
      };
    }
  }

  return {
    store: createEmptyMilestoneStore(ownerId),
    warning,
    sourceKeys: [...(v2Raw !== null ? [v2Key] : [])],
    targetExisted: false,
  };
}

function migrateV2Store(store: MilestoneLocalStoreV2): MilestoneLocalStore {
  return {
    version: 3,
    accountUserId: store.accountUserId,
    records: store.records,
    config: { diffPeriod: store.config.diffPeriod },
    hiddenMilestoneIds: store.hiddenMilestoneIds,
    sync: {
      bootstrapCompleted: store.sync.bootstrapCompleted,
      lastSuccessfulSyncAt: store.sync.lastSuccessfulSyncAt,
      bootstrapPreference: store.sync.bootstrapCompleted
        ? null
        : store.accountUserId !== null && store.config.milestonesOnServer
          ? 'server'
          : 'local',
    },
  };
}

function persistMigratedStore(
  storage: Storage,
  storageKey: string,
  store: MilestoneLocalStore
) {
  const parsed = milestoneLocalStoreSchema.safeParse(store);
  if (!parsed.success) {
    return false;
  }
  try {
    storage.setItem(storageKey, JSON.stringify(parsed.data));
    const persisted = parseStore(storage.getItem(storageKey));
    return (
      persisted.success &&
      persisted.data.accountUserId === parsed.data.accountUserId
    );
  } catch {
    return false;
  }
}

export function markAnonymousConsumed(storage: Storage, userId: string) {
  const owner = storage.getItem(ANONYMOUS_OWNER_KEY);
  if (!owner || owner === userId) {
    storage.setItem(ANONYMOUS_OWNER_KEY, userId);
    storage.setItem(ANONYMOUS_CONSUMED_KEY, userId);
  }
}

export function bootstrapMilestoneStore(
  current: MilestoneLocalStore,
  serverRecords: StoredMilestone[],
  now = Date.now()
): MilestoneLocalStore {
  const serverById = new Map(
    serverRecords.map((record) => [record.publicId, record])
  );
  const activeServerByName = new Map(
    serverRecords
      .filter((record) => record.deletedAt === null)
      .map((record) => [record.name, record])
  );
  const localIntentByName = new Map<string, StoredMilestone>();
  for (const record of current.records) {
    const existing = localIntentByName.get(record.name);
    const activeBeatsTombstone =
      record.deletedAt === null && existing?.deletedAt !== null;
    const sameStateIsNewer =
      existing !== undefined &&
      (existing.deletedAt === null) === (record.deletedAt === null) &&
      record.updatedAt > existing.updatedAt;
    if (!existing || activeBeatsTombstone || sameStateIsNewer) {
      localIntentByName.set(record.name, record);
    }
  }

  const replacedLocalIds = new Set<string>();
  const transferredHiddenIds = new Set(current.hiddenMilestoneIds);
  for (const local of localIntentByName.values()) {
    const server = activeServerByName.get(local.name);
    if (!server) {
      continue;
    }
    replacedLocalIds.add(local.publicId);
    const updatedAt = Math.max(now, local.updatedAt, server.updatedAt + 1);
    const merged =
      current.sync.bootstrapPreference === 'server'
        ? server
        : {
            ...local,
            publicId: server.publicId,
            updatedAt,
            deletedAt: local.deletedAt === null ? null : updatedAt,
          };
    serverById.set(server.publicId, merged);
    if (transferredHiddenIds.delete(local.publicId)) {
      transferredHiddenIds.add(server.publicId);
    }
  }

  for (const local of current.records) {
    if (
      !replacedLocalIds.has(local.publicId) &&
      !serverById.has(local.publicId)
    ) {
      serverById.set(local.publicId, local);
    }
  }
  const records = Array.from(serverById.values());
  const activeIds = new Set(
    records
      .filter((record) => record.deletedAt === null)
      .map((record) => record.publicId)
  );
  return {
    ...current,
    records,
    hiddenMilestoneIds: Array.from(transferredHiddenIds).filter((id) =>
      activeIds.has(id)
    ),
    sync: {
      ...current.sync,
      bootstrapCompleted: true,
      bootstrapPreference: null,
    },
  };
}

export function applyMilestoneSyncResponse(
  current: MilestoneLocalStore,
  requestSnapshot: StoredMilestone[],
  response: StoredMilestone[]
): { store: MilestoneLocalStore; hasPendingLocalChanges: boolean } {
  const requestById = new Map(
    requestSnapshot.map((record) => [record.publicId, record])
  );
  const responseById = new Map(
    response.map((record) => [record.publicId, record])
  );
  let hasPendingLocalChanges = false;
  for (const currentRecord of current.records) {
    const requested = requestById.get(currentRecord.publicId);
    if (!requested || !storedMilestonesEqual(currentRecord, requested)) {
      responseById.set(currentRecord.publicId, currentRecord);
      hasPendingLocalChanges = true;
    }
  }

  const records = Array.from(responseById.values());
  const hiddenNames = new Set(
    current.hiddenMilestoneIds
      .map(
        (id) => current.records.find((record) => record.publicId === id)?.name
      )
      .filter((name): name is string => Boolean(name))
  );
  return {
    store: {
      ...current,
      records,
      hiddenMilestoneIds: records
        .filter(
          (record) =>
            record.deletedAt === null &&
            (current.hiddenMilestoneIds.includes(record.publicId) ||
              hiddenNames.has(record.name))
        )
        .map((record) => record.publicId),
    },
    hasPendingLocalChanges,
  };
}

function migrateLegacyStore(
  storage: Storage,
  accountUserId: string | null,
  now: number
): StoreMigration | null {
  const raw = {
    milestones: storage.getItem(LEGACY_MILESTONES_KEY),
    milestonesConfig: storage.getItem(LEGACY_CONFIG_KEY),
    hiddenMilestones: storage.getItem(LEGACY_HIDDEN_KEY),
  };
  const hasLegacy = Object.values(raw).some((value) => value !== null);
  if (!hasLegacy) {
    return null;
  }

  let warning: string | null = null;
  const legacyMilestones = parseJson(raw.milestones);
  const validMilestones: ClientMilestone[] = [];
  if (Array.isArray(legacyMilestones)) {
    for (const milestone of legacyMilestones) {
      const parsed = clientMilestoneSchema.safeParse(milestone);
      if (parsed.success) {
        validMilestones.push(parsed.data);
      } else {
        warning = 'Some saved milestone data could not be loaded.';
      }
    }
  } else if (raw.milestones !== null) {
    warning = 'Some saved milestone data could not be loaded.';
  }

  const parsedConfig = v2ConfigSchema.safeParse(
    parseJson(raw.milestonesConfig)
  );
  if (raw.milestonesConfig !== null && !parsedConfig.success) {
    warning = 'Some saved milestone settings could not be loaded.';
  }
  const config = parsedConfig.success
    ? parsedConfig.data
    : { milestonesOnServer: false, diffPeriod: 'days' as const };
  const hidden = parseJson(raw.hiddenMilestones);
  const hiddenNames = Array.isArray(hidden)
    ? hidden.filter((name): name is string => typeof name === 'string')
    : [];
  if (raw.hiddenMilestones !== null && !Array.isArray(hidden)) {
    warning = 'Some saved milestone settings could not be loaded.';
  }
  if (warning) {
    preserveRecovery(storage, JSON.stringify(raw), now);
  }

  const records = validMilestones.map((milestone) =>
    createStoredMilestone(milestone, now)
  );
  const idsByName = new Map(
    records.map((record) => [record.name, record.publicId])
  );
  return {
    store: {
      version: 3 as const,
      accountUserId,
      records,
      config: {
        diffPeriod: config.diffPeriod,
      },
      hiddenMilestoneIds: hiddenNames
        .map((name) => idsByName.get(name.trim()))
        .filter((id): id is string => Boolean(id)),
      sync: {
        bootstrapCompleted: false,
        lastSuccessfulSyncAt: null,
        bootstrapPreference:
          accountUserId && config.milestonesOnServer ? 'server' : 'local',
      },
    },
    warning,
    sourceKeys: [
      LEGACY_MILESTONES_KEY,
      LEGACY_CONFIG_KEY,
      LEGACY_HIDDEN_KEY,
    ].filter((key) => storage.getItem(key) !== null),
    targetExisted: false,
  };
}

function mergeAnonymousIntoAccount(
  account: MilestoneLocalStore,
  anonymous: MilestoneLocalStore,
  accountExisted: boolean
): MilestoneLocalStore {
  const byName = new Map<string, StoredMilestone>();
  for (const record of [...account.records, ...anonymous.records]) {
    const current = byName.get(record.name);
    if (!current || record.updatedAt > current.updatedAt) {
      byName.set(record.name, record);
    }
  }
  const records = Array.from(byName.values());
  const sourceRecords = new Map(
    [...account.records, ...anonymous.records].map((record) => [
      record.publicId,
      record,
    ])
  );
  const hiddenNames = new Set(
    [...account.hiddenMilestoneIds, ...anonymous.hiddenMilestoneIds]
      .map((id) => sourceRecords.get(id)?.name)
      .filter((name): name is string => Boolean(name))
  );
  return {
    version: 3,
    accountUserId: account.accountUserId,
    records,
    config: accountExisted ? account.config : anonymous.config,
    hiddenMilestoneIds: records
      .filter(
        (record) => record.deletedAt === null && hiddenNames.has(record.name)
      )
      .map((record) => record.publicId),
    sync: accountExisted
      ? account.sync
      : { ...account.sync, bootstrapPreference: 'local' },
  };
}

function storedMilestonesEqual(
  first: StoredMilestone,
  second: StoredMilestone
) {
  return (
    first.publicId === second.publicId &&
    first.name === second.name &&
    first.timestamp === second.timestamp &&
    first.timezone === second.timezone &&
    first.color === second.color &&
    first.updatedAt === second.updatedAt &&
    first.deletedAt === second.deletedAt
  );
}

function parseStore(raw: string | null) {
  return milestoneLocalStoreSchema.safeParse(parseJson(raw));
}

function parseV2Store(raw: string | null) {
  return milestoneLocalStoreV2Schema.safeParse(parseJson(raw));
}

function parseJson(raw: string | null): unknown {
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function preserveRecovery(storage: Storage, raw: string, now: number) {
  let key = `${RECOVERY_KEY_PREFIX}${now}`;
  let suffix = 1;
  while (storage.getItem(key) !== null) {
    key = `${RECOVERY_KEY_PREFIX}${now}-${suffix}`;
    suffix += 1;
  }
  storage.setItem(key, raw);
}

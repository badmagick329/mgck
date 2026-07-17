import {
  ClientMilestone,
  clientMilestoneSchema,
  MilestoneLocalStore,
  milestoneLocalStoreSchema,
  MilestonesBackup,
  milestonesConfig,
  StoredMilestone,
} from '@/lib/types/milestones';

export const ANONYMOUS_STORE_KEY = 'mgck:milestones:anonymous:v2';
export const LAST_ACCOUNT_KEY = 'mgck:milestones:last-account:v1';
export const ANONYMOUS_CONSUMED_KEY = 'mgck:milestones:anonymous-consumed:v1';
export const ANONYMOUS_OWNER_KEY = 'mgck:milestones:anonymous-owner:v1';
export const LEGACY_BACKUP_KEY = 'mgck:milestones:legacy-backup:v1';
export const RECOVERY_KEY_PREFIX = 'mgck:milestones:recovery:';

const LEGACY_MILESTONES_KEY = 'milestones';
const LEGACY_CONFIG_KEY = 'milestonesConfig';
const LEGACY_HIDDEN_KEY = 'hiddenMilestones';

export type StorageLoadResult = {
  store: MilestoneLocalStore;
  storageKey: string;
  warning: string | null;
};

export function accountStoreKey(userId: string) {
  return `mgck:milestones:account:${encodeURIComponent(userId)}:v2`;
}

export function createEmptyMilestoneStore(
  accountUserId: string | null
): MilestoneLocalStore {
  return {
    version: 2,
    accountUserId,
    records: [],
    config: {
      milestonesOnServer: false,
      diffPeriod: 'days',
    },
    hiddenMilestoneIds: [],
    sync: {
      bootstrapCompleted: false,
      lastSuccessfulSyncAt: null,
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
  let warning: string | null = null;
  const existingRaw = storage.getItem(storageKey);
  const parsedExisting = parseStore(existingRaw);
  const existing =
    parsedExisting.success && parsedExisting.data.accountUserId === ownerId
      ? parsedExisting
      : milestoneLocalStoreSchema.safeParse(null);

  let store: MilestoneLocalStore;
  let targetExisted = false;
  if (existing.success) {
    store = existing.data;
    targetExisted = true;
  } else {
    if (existingRaw) {
      preserveRecovery(storage, existingRaw, now);
      warning = 'Some saved milestone data could not be loaded.';
    }
    const migration = migrateLegacyStore(storage, ownerId, now);
    store = migration.store;
    warning = warning || migration.warning;
  }

  if (authenticatedUserId && !storage.getItem(ANONYMOUS_CONSUMED_KEY)) {
    const anonymous = parseStore(storage.getItem(ANONYMOUS_STORE_KEY));
    let anonymousOwner = storage.getItem(ANONYMOUS_OWNER_KEY);
    if (anonymous.success && !anonymousOwner) {
      anonymousOwner = authenticatedUserId;
      storage.setItem(ANONYMOUS_OWNER_KEY, authenticatedUserId);
    }
    if (anonymous.success && anonymousOwner === authenticatedUserId) {
      store = mergeAnonymousIntoAccount(store, anonymous.data, targetExisted);
    }
  }

  storage.setItem(storageKey, JSON.stringify(store));
  return { store, storageKey, warning };
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
    const merged = current.config.milestonesOnServer
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
    config: { ...current.config, milestonesOnServer: false },
    hiddenMilestoneIds: Array.from(transferredHiddenIds).filter((id) =>
      activeIds.has(id)
    ),
    sync: { ...current.sync, bootstrapCompleted: true },
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

export function reconcileServerMilestones(
  current: MilestoneLocalStore,
  rows: ClientMilestone[],
  now = Date.now()
): MilestoneLocalStore {
  const currentByName = new Map(
    current.records.map((record) => [record.name, record])
  );
  const serverNames = new Set(rows.map((row) => row.name));
  const records = rows.map((row) => {
    const existing = currentByName.get(row.name);
    if (!existing) {
      return createStoredMilestone(row, now);
    }
    const changed = milestoneFieldsDiffer(existing, row) || existing.deletedAt;
    return {
      ...row,
      publicId: existing.publicId,
      updatedAt: changed ? now : existing.updatedAt,
      deletedAt: null,
    };
  });
  records.push(
    ...current.records.filter(
      (record) => record.deletedAt !== null && !serverNames.has(record.name)
    )
  );
  const activeIds = new Set(
    activeMilestones(records).map((record) => record.publicId)
  );
  return {
    ...current,
    records,
    hiddenMilestoneIds: current.hiddenMilestoneIds.filter((id) =>
      activeIds.has(id)
    ),
  };
}

export function restoreMilestonesBackup(
  current: MilestoneLocalStore,
  backup: MilestonesBackup,
  authenticated: boolean,
  now = Date.now(),
  tombstoneOmitted = false
): MilestoneLocalStore {
  const currentByName = new Map(
    current.records.map((record) => [record.name, record])
  );
  const restored = backup.milestones.map((milestone) =>
    createStoredMilestone(
      milestone,
      now,
      currentByName.get(milestone.name)?.publicId
    )
  );
  const restoredNames = new Set(restored.map((record) => record.name));
  const retainedTombstones = current.records.filter(
    (record) => record.deletedAt !== null && !restoredNames.has(record.name)
  );
  const omittedTombstones = tombstoneOmitted
    ? current.records
        .filter(
          (record) =>
            record.deletedAt === null && !restoredNames.has(record.name)
        )
        .map((record) => ({
          ...record,
          updatedAt: now,
          deletedAt: now,
        }))
    : [];
  const restoredByName = new Map(
    restored.map((record) => [record.name, record.publicId])
  );
  return {
    ...current,
    records: [...restored, ...retainedTombstones, ...omittedTombstones],
    config: {
      diffPeriod: backup.milestonesConfig.diffPeriod,
      milestonesOnServer:
        !tombstoneOmitted &&
        authenticated &&
        backup.milestonesConfig.milestonesOnServer,
    },
    hiddenMilestoneIds: backup.hiddenMilestones
      .map((name) => restoredByName.get(name))
      .filter((id): id is string => Boolean(id)),
  };
}

export function milestoneBackupFromStore(
  store: MilestoneLocalStore
): MilestonesBackup {
  const active = activeMilestones(store.records);
  const hiddenIds = new Set(store.hiddenMilestoneIds);
  return {
    milestones: active.map(toClientMilestone),
    milestonesConfig: store.config,
    hiddenMilestones: active
      .filter((milestone) => hiddenIds.has(milestone.publicId))
      .map((milestone) => milestone.name),
  };
}

export function toClientMilestone(record: StoredMilestone): ClientMilestone {
  return {
    name: record.name,
    timestamp: record.timestamp,
    timezone: record.timezone,
    color: record.color,
  };
}

function migrateLegacyStore(
  storage: Storage,
  accountUserId: string | null,
  now: number
) {
  const raw = {
    milestones: storage.getItem(LEGACY_MILESTONES_KEY),
    milestonesConfig: storage.getItem(LEGACY_CONFIG_KEY),
    hiddenMilestones: storage.getItem(LEGACY_HIDDEN_KEY),
  };
  const hasLegacy = Object.values(raw).some((value) => value !== null);
  if (!hasLegacy || storage.getItem(LEGACY_BACKUP_KEY)) {
    return {
      store: createEmptyMilestoneStore(accountUserId),
      warning: null,
    };
  }

  storage.setItem(LEGACY_BACKUP_KEY, JSON.stringify(raw));
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

  const parsedConfig = milestonesConfig.safeParse(
    parseJson(raw.milestonesConfig)
  );
  if (raw.milestonesConfig !== null && !parsedConfig.success) {
    warning = 'Some saved milestone settings could not be loaded.';
  }
  const config = parsedConfig.success
    ? parsedConfig.data
    : createEmptyMilestoneStore(accountUserId).config;
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
      version: 2 as const,
      accountUserId,
      records,
      config: {
        ...config,
        milestonesOnServer: accountUserId ? config.milestonesOnServer : false,
      },
      hiddenMilestoneIds: hiddenNames
        .map((name) => idsByName.get(name.trim()))
        .filter((id): id is string => Boolean(id)),
      sync: {
        bootstrapCompleted: false,
        lastSuccessfulSyncAt: null,
      },
    },
    warning,
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
    version: 2,
    accountUserId: account.accountUserId,
    records,
    config: accountExisted
      ? account.config
      : {
          ...anonymous.config,
          milestonesOnServer: false,
        },
    hiddenMilestoneIds: records
      .filter(
        (record) => record.deletedAt === null && hiddenNames.has(record.name)
      )
      .map((record) => record.publicId),
    sync: account.sync,
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

function milestoneFieldsDiffer(
  stored: StoredMilestone,
  milestone: ClientMilestone
) {
  return (
    stored.name !== milestone.name ||
    stored.timestamp !== milestone.timestamp ||
    stored.timezone !== milestone.timezone ||
    stored.color !== milestone.color
  );
}

function parseStore(raw: string | null) {
  return milestoneLocalStoreSchema.safeParse(parseJson(raw));
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

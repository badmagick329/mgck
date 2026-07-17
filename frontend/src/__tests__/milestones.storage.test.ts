import {
  accountStoreKey,
  applyMilestoneSyncResponse,
  ANONYMOUS_CONSUMED_KEY,
  ANONYMOUS_OWNER_KEY,
  ANONYMOUS_STORE_KEY,
  bootstrapMilestoneStore,
  createEmptyMilestoneStore,
  createStoredMilestone,
  LAST_ACCOUNT_KEY,
  loadMilestoneStore,
  markAnonymousConsumed,
  RECOVERY_KEY_PREFIX,
  v2AccountStoreKey,
} from '@/lib/milestones/storage';
import { MilestoneLocalStore, StoredMilestone } from '@/lib/types/milestones';

const FIRST_ID = '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const SECOND_ID = '148c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const THIRD_ID = '248c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const V2_ANONYMOUS_STORE_KEY = 'mgck:milestones:anonymous:v2';
const LEGACY_BACKUP_KEY = 'mgck:milestones:legacy-backup:v1';

const milestone = (name = 'Launch') => ({
  name,
  timestamp: 1_800_000_000_000,
  timezone: 'Europe/London',
  color: '#123456',
});

const v2Store = ({
  owner = 'alice' as string | null,
  linked = false,
  bootstrapCompleted = false,
  records = [] as StoredMilestone[],
  hiddenMilestoneIds = [] as string[],
  lastSuccessfulSyncAt = null as number | null,
} = {}) => ({
  version: 2 as const,
  accountUserId: owner,
  records,
  config: { milestonesOnServer: linked, diffPeriod: 'weeks' as const },
  hiddenMilestoneIds,
  sync: { bootstrapCompleted, lastSuccessfulSyncAt },
});

describe('milestone local storage', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: jest.fn(() => FIRST_ID),
    });
  });

  test('migrates original linked keys directly to v3 and quarantines corrupt entries', () => {
    localStorage.setItem(
      'milestones',
      JSON.stringify([milestone(), { name: '', timestamp: 'invalid' }])
    );
    localStorage.setItem(
      'milestonesConfig',
      JSON.stringify({ milestonesOnServer: true, diffPeriod: 'weeks' })
    );
    localStorage.setItem('hiddenMilestones', JSON.stringify([' Launch ']));
    localStorage.setItem(LEGACY_BACKUP_KEY, 'obsolete backup');

    const loaded = loadMilestoneStore(localStorage, 'alice', 1_000);

    expect(loaded.warning).not.toBeNull();
    expect(loaded.storageKey).toBe(accountStoreKey('alice'));
    expect(loaded.store).toMatchObject({
      version: 3,
      accountUserId: 'alice',
      config: { diffPeriod: 'weeks' },
      sync: {
        bootstrapCompleted: false,
        lastSuccessfulSyncAt: null,
        bootstrapPreference: 'server',
      },
    });
    expect(loaded.store.records).toHaveLength(1);
    expect(loaded.store.records[0]).toMatchObject({
      name: 'Launch',
      updatedAt: 1_000,
      deletedAt: null,
    });
    expect(loaded.store.hiddenMilestoneIds).toEqual([
      loaded.store.records[0].publicId,
    ]);
    expect(localStorage.getItem('milestones')).toBeNull();
    expect(localStorage.getItem('milestonesConfig')).toBeNull();
    expect(localStorage.getItem('hiddenMilestones')).toBeNull();
    expect(localStorage.getItem(LEGACY_BACKUP_KEY)).toBeNull();
    expect(
      Object.keys(localStorage).some((key) =>
        key.startsWith(RECOVERY_KEY_PREFIX)
      )
    ).toBe(true);
  });

  test('migrates linked and unlinked v2 stores with one-time bootstrap intent', () => {
    const active = createStoredMilestone(milestone(), 100, FIRST_ID);
    const deleted = {
      ...createStoredMilestone(milestone('Deleted'), 200, SECOND_ID),
      updatedAt: 300,
      deletedAt: 300,
    };
    localStorage.setItem(
      v2AccountStoreKey('alice'),
      JSON.stringify(
        v2Store({
          linked: true,
          records: [active, deleted],
          hiddenMilestoneIds: [FIRST_ID],
        })
      )
    );
    localStorage.setItem(
      v2AccountStoreKey('bob'),
      JSON.stringify(v2Store({ owner: 'bob', linked: false }))
    );

    const alice = loadMilestoneStore(localStorage, 'alice');
    const bob = loadMilestoneStore(localStorage, 'bob');

    expect(alice.store).toMatchObject({
      version: 3,
      records: [active, deleted],
      config: { diffPeriod: 'weeks' },
      hiddenMilestoneIds: [FIRST_ID],
      sync: { bootstrapPreference: 'server' },
    });
    expect(bob.store.sync.bootstrapPreference).toBe('local');
    expect(localStorage.getItem(v2AccountStoreKey('alice'))).toBeNull();
    expect(localStorage.getItem(v2AccountStoreKey('bob'))).toBeNull();
  });

  test('preserves completed sync metadata without bootstrapping again', () => {
    localStorage.setItem(
      v2AccountStoreKey('alice'),
      JSON.stringify(
        v2Store({
          linked: true,
          bootstrapCompleted: true,
          lastSuccessfulSyncAt: 5_000,
        })
      )
    );

    const loaded = loadMilestoneStore(localStorage, 'alice');

    expect(loaded.store.sync).toEqual({
      bootstrapCompleted: true,
      lastSuccessfulSyncAt: 5_000,
      bootstrapPreference: null,
    });
  });

  test('migrates anonymous and last-account v2 stores to the correct owner', () => {
    const anonymous = v2Store({
      owner: null,
      linked: true,
      records: [createStoredMilestone(milestone('Anonymous'), 100, FIRST_ID)],
    });
    localStorage.setItem(V2_ANONYMOUS_STORE_KEY, JSON.stringify(anonymous));

    const anonymousLoaded = loadMilestoneStore(localStorage, null);

    expect(anonymousLoaded.storageKey).toBe(ANONYMOUS_STORE_KEY);
    expect(anonymousLoaded.store.sync.bootstrapPreference).toBe('local');
    expect(localStorage.getItem(V2_ANONYMOUS_STORE_KEY)).toBeNull();

    localStorage.clear();
    localStorage.setItem(LAST_ACCOUNT_KEY, 'alice');
    localStorage.setItem(
      v2AccountStoreKey('alice'),
      JSON.stringify(
        v2Store({
          records: [createStoredMilestone(milestone('Offline'), 100, FIRST_ID)],
        })
      )
    );

    const loggedOut = loadMilestoneStore(localStorage, null);

    expect(loggedOut.storageKey).toBe(accountStoreKey('alice'));
    expect(loggedOut.store.accountUserId).toBe('alice');
    expect(loggedOut.store.records[0].name).toBe('Offline');
  });

  test('quarantines corrupt and wrong-owner scoped stores without leaking data', () => {
    localStorage.setItem(accountStoreKey('alice'), '{invalid json');
    const corrupt = loadMilestoneStore(localStorage, 'alice', 2_000);

    expect(corrupt.warning).not.toBeNull();
    expect(corrupt.store.records).toEqual([]);
    expect(JSON.parse(localStorage.getItem(accountStoreKey('alice'))!)).toEqual(
      corrupt.store
    );

    localStorage.clear();
    localStorage.setItem(
      v2AccountStoreKey('bob'),
      JSON.stringify(
        v2Store({
          owner: 'alice',
          records: [createStoredMilestone(milestone(), 100, FIRST_ID)],
        })
      )
    );
    const wrongOwner = loadMilestoneStore(localStorage, 'bob', 3_000);

    expect(wrongOwner.warning).not.toBeNull();
    expect(wrongOwner.store.accountUserId).toBe('bob');
    expect(wrongOwner.store.records).toEqual([]);
    expect(localStorage.getItem(v2AccountStoreKey('bob'))).toBeNull();
  });

  test('anonymous data seeds only the first authenticated account', () => {
    const anonymous: MilestoneLocalStore = {
      ...createEmptyMilestoneStore(null),
      records: [createStoredMilestone(milestone(), 100, FIRST_ID)],
      hiddenMilestoneIds: [FIRST_ID],
    };
    localStorage.setItem(ANONYMOUS_STORE_KEY, JSON.stringify(anonymous));

    const alice = loadMilestoneStore(localStorage, 'alice', 1_000);
    const bob = loadMilestoneStore(localStorage, 'bob', 2_000);

    expect(alice.store.records.map((record) => record.name)).toEqual([
      'Launch',
    ]);
    expect(alice.store.hiddenMilestoneIds).toEqual([FIRST_ID]);
    expect(localStorage.getItem(ANONYMOUS_OWNER_KEY)).toBe('alice');
    expect(localStorage.getItem(ANONYMOUS_CONSUMED_KEY)).toBeNull();
    expect(bob.store.records).toEqual([]);

    markAnonymousConsumed(localStorage, 'alice');
    expect(localStorage.getItem(ANONYMOUS_CONSUMED_KEY)).toBe('alice');
  });

  test('bootstraps exact-name UUIDs with server and local precedence', () => {
    const local = createStoredMilestone(milestone(), 100, FIRST_ID);
    const server = createStoredMilestone(
      { ...milestone(), color: '#abcdef' },
      500,
      SECOND_ID
    );
    const serverOnly = createStoredMilestone(
      milestone('Server only'),
      400,
      THIRD_ID
    );
    const serverPreferred = bootstrapMilestoneStore(
      {
        ...createEmptyMilestoneStore('alice'),
        records: [local],
        hiddenMilestoneIds: [FIRST_ID],
        sync: {
          bootstrapCompleted: false,
          lastSuccessfulSyncAt: null,
          bootstrapPreference: 'server',
        },
      },
      [server, serverOnly],
      1_000
    );

    expect(serverPreferred.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicId: SECOND_ID,
          color: '#abcdef',
          updatedAt: 500,
        }),
        expect.objectContaining({ publicId: THIRD_ID }),
      ])
    );
    expect(serverPreferred.hiddenMilestoneIds).toEqual([SECOND_ID]);
    expect(serverPreferred.sync).toMatchObject({
      bootstrapCompleted: true,
      bootstrapPreference: null,
    });

    const localPreferred = bootstrapMilestoneStore(
      {
        ...createEmptyMilestoneStore('alice'),
        records: [{ ...local, deletedAt: 100 }],
      },
      [server],
      1_000
    );
    expect(localPreferred.records).toEqual([
      expect.objectContaining({
        publicId: SECOND_ID,
        color: '#123456',
        updatedAt: 1_000,
        deletedAt: 1_000,
      }),
    ]);
  });

  test('reapplies post-request local edits over a stale sync response', () => {
    const requested = createStoredMilestone(milestone(), 100, FIRST_ID);
    const current = {
      ...createEmptyMilestoneStore('alice'),
      records: [{ ...requested, name: 'Edited locally' }],
      hiddenMilestoneIds: [FIRST_ID],
    };
    const serverOnly = createStoredMilestone(
      milestone('Server only'),
      150,
      SECOND_ID
    );
    const merged = applyMilestoneSyncResponse(
      current,
      [requested],
      [{ ...requested, name: 'Server value', updatedAt: 150 }, serverOnly]
    );

    expect(merged.hasPendingLocalChanges).toBe(true);
    expect(merged.store.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicId: FIRST_ID,
          name: 'Edited locally',
          updatedAt: 100,
        }),
        expect.objectContaining({ publicId: SECOND_ID }),
      ])
    );
    expect(merged.store.hiddenMilestoneIds).toEqual([FIRST_ID]);
  });
});

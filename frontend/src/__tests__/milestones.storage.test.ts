import {
  accountStoreKey,
  ANONYMOUS_CONSUMED_KEY,
  ANONYMOUS_STORE_KEY,
  createEmptyMilestoneStore,
  createStoredMilestone,
  LEGACY_BACKUP_KEY,
  loadMilestoneStore,
  milestoneBackupFromStore,
  RECOVERY_KEY_PREFIX,
  reconcileServerMilestones,
  restoreMilestonesBackup,
} from '@/lib/milestones/storage';
import { MilestoneLocalStore } from '@/lib/types/milestones';

const FIRST_ID = '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const SECOND_ID = '148c3d72-5c61-4f2c-9707-e06b0cc1f7f5';

const milestone = (name = 'Launch') => ({
  name,
  timestamp: 1_800_000_000_000,
  timezone: 'Europe/London',
  color: '#123456',
});

describe('milestone local storage', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: jest.fn(() => FIRST_ID),
    });
  });

  test('migrates valid legacy account data and quarantines corrupt entries', () => {
    localStorage.setItem(
      'milestones',
      JSON.stringify([milestone(), { name: '', timestamp: 'invalid' }])
    );
    localStorage.setItem(
      'milestonesConfig',
      JSON.stringify({ milestonesOnServer: true, diffPeriod: 'weeks' })
    );
    localStorage.setItem('hiddenMilestones', JSON.stringify([' Launch ']));

    const loaded = loadMilestoneStore(localStorage, 'alice', 1_000);

    expect(loaded.warning).not.toBeNull();
    expect(loaded.store.accountUserId).toBe('alice');
    expect(loaded.store.records).toHaveLength(1);
    expect(loaded.store.records[0]).toMatchObject({
      name: 'Launch',
      updatedAt: 1_000,
      deletedAt: null,
    });
    expect(loaded.store.config).toEqual({
      milestonesOnServer: true,
      diffPeriod: 'weeks',
    });
    expect(loaded.store.hiddenMilestoneIds).toEqual([
      loaded.store.records[0].publicId,
    ]);
    expect(localStorage.getItem(LEGACY_BACKUP_KEY)).not.toBeNull();
    expect(
      Object.keys(localStorage).some((key) =>
        key.startsWith(RECOVERY_KEY_PREFIX)
      )
    ).toBe(true);
  });

  test('forces migrated anonymous data to remain unlinked', () => {
    localStorage.setItem('milestones', JSON.stringify([milestone()]));
    localStorage.setItem(
      'milestonesConfig',
      JSON.stringify({ milestonesOnServer: true, diffPeriod: 'days' })
    );

    const loaded = loadMilestoneStore(localStorage, null, 1_000);

    expect(loaded.storageKey).toBe(ANONYMOUS_STORE_KEY);
    expect(loaded.store.records).toHaveLength(1);
    expect(loaded.store.config.milestonesOnServer).toBe(false);
  });

  test('quarantines corrupt and wrong-owner scoped stores', () => {
    localStorage.setItem(accountStoreKey('alice'), '{invalid json');
    const corrupt = loadMilestoneStore(localStorage, 'alice', 2_000);

    expect(corrupt.warning).not.toBeNull();
    expect(corrupt.store.records).toEqual([]);

    localStorage.clear();
    localStorage.setItem(
      accountStoreKey('bob'),
      JSON.stringify({
        ...createEmptyMilestoneStore('alice'),
        records: [createStoredMilestone(milestone(), 100, FIRST_ID)],
      })
    );
    const wrongOwner = loadMilestoneStore(localStorage, 'bob', 3_000);

    expect(wrongOwner.warning).not.toBeNull();
    expect(wrongOwner.store.accountUserId).toBe('bob');
    expect(wrongOwner.store.records).toEqual([]);
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
    expect(localStorage.getItem(ANONYMOUS_CONSUMED_KEY)).toBe('alice');
    expect(bob.store.records).toEqual([]);
    expect(JSON.parse(localStorage.getItem(ANONYMOUS_STORE_KEY)!)).toEqual(
      anonymous
    );
  });

  test('server refresh preserves matching UUIDs and unrelated tombstones', () => {
    const current: MilestoneLocalStore = {
      ...createEmptyMilestoneStore('alice'),
      records: [
        createStoredMilestone(milestone(), 100, FIRST_ID),
        {
          ...createStoredMilestone(milestone('Deleted'), 200, SECOND_ID),
          deletedAt: 300,
          updatedAt: 300,
        },
      ],
      hiddenMilestoneIds: [FIRST_ID],
    };

    const reconciled = reconcileServerMilestones(
      current,
      [{ ...milestone(), color: '#abcdef' }],
      1_000
    );

    expect(reconciled.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicId: FIRST_ID,
          color: '#abcdef',
          updatedAt: 1_000,
          deletedAt: null,
        }),
        expect.objectContaining({
          publicId: SECOND_ID,
          deletedAt: 300,
        }),
      ])
    );
    expect(reconciled.hiddenMilestoneIds).toEqual([FIRST_ID]);
  });

  test('backup excludes tombstones and restore rebuilds UUID visibility', () => {
    const current: MilestoneLocalStore = {
      ...createEmptyMilestoneStore('alice'),
      records: [
        createStoredMilestone(milestone(), 100, FIRST_ID),
        {
          ...createStoredMilestone(milestone('Deleted'), 200, SECOND_ID),
          deletedAt: 300,
          updatedAt: 300,
        },
      ],
      hiddenMilestoneIds: [FIRST_ID, SECOND_ID],
    };

    const backup = milestoneBackupFromStore(current);
    const restored = restoreMilestonesBackup(current, backup, true, 1_000);

    expect(backup.milestones.map((record) => record.name)).toEqual(['Launch']);
    expect(backup.hiddenMilestones).toEqual(['Launch']);
    expect(restored.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ publicId: FIRST_ID, deletedAt: null }),
        expect.objectContaining({ publicId: SECOND_ID, deletedAt: 300 }),
      ])
    );
    expect(restored.hiddenMilestoneIds).toEqual([FIRST_ID]);
  });
});

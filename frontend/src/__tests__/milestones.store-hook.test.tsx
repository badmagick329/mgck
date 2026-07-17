import { act, renderHook, waitFor } from '@testing-library/react';

jest.mock('../actions/milestones', () => ({
  syncMilestonesAction: jest.fn(),
}));

import useMilestoneStore from '@/hooks/milestones/useMilestoneStore';
import useMilestones from '@/hooks/milestones/useMilestones';
import {
  accountStoreKey,
  createEmptyMilestoneStore,
  createStoredMilestone,
  LAST_ACCOUNT_KEY,
} from '@/lib/milestones/storage';

const FIRST_ID = '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const SECOND_ID = '148c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const THIRD_ID = '248c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const account = { userId: 'alice', username: 'Alice' };
const fields = (name = 'Launch') => ({
  name,
  timestamp: 1_800_000_000_000,
  timezone: 'Europe/London',
  color: '#123456',
});

describe('milestone owner store hook', () => {
  let uuidIndex = 0;

  beforeEach(() => {
    localStorage.clear();
    uuidIndex = 0;
    const ids = [FIRST_ID, SECOND_ID, THIRD_ID];
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: jest.fn(
        () =>
          ids[
            uuidIndex++
          ] as `${string}-${string}-${string}-${string}-${string}`
      ),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('keeps identity and visibility across edits, then tombstones deletes', async () => {
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(50);
    const { result } = renderHook(() => useMilestoneStore(account));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    now.mockReturnValue(100);
    act(() => {
      result.current.addMilestone(fields());
      result.current.hideMilestone(FIRST_ID);
    });
    expect(result.current.milestones[0].updatedAt).toBe(100);

    now.mockReturnValue(200);
    act(() => {
      result.current.updateMilestone(FIRST_ID, fields('Renamed'));
    });

    expect(result.current.milestones[0]).toMatchObject({
      publicId: FIRST_ID,
      name: 'Renamed',
      updatedAt: 200,
    });
    expect(result.current.isMilestoneHidden(FIRST_ID)).toBe(true);

    now.mockReturnValue(300);
    act(() => result.current.removeMilestone(FIRST_ID));

    expect(result.current.milestones).toEqual([]);
    expect(result.current.records[0]).toMatchObject({
      publicId: FIRST_ID,
      updatedAt: 300,
      deletedAt: 300,
    });
    expect(result.current.hiddenMilestoneIds).toEqual([]);
  });

  test('logged out continues the last account locally', async () => {
    const stored = {
      ...createEmptyMilestoneStore('alice'),
      records: [createStoredMilestone(fields(), 100, FIRST_ID)],
    };
    localStorage.setItem(accountStoreKey('alice'), JSON.stringify(stored));
    localStorage.setItem(LAST_ACCOUNT_KEY, 'alice');

    const { result } = renderHook(() => useMilestoneStore(null));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.milestones[0].publicId).toBe(FIRST_ID);

    act(() => result.current.addMilestone(fields('Offline')));

    expect(result.current.config).toEqual({ diffPeriod: 'days' });
    expect(
      JSON.parse(localStorage.getItem(accountStoreKey('alice'))!).records
    ).toHaveLength(2);
  });

  test('account switches enter loading state and never expose the old owner', async () => {
    localStorage.setItem(
      accountStoreKey('alice'),
      JSON.stringify({
        ...createEmptyMilestoneStore('alice'),
        records: [createStoredMilestone(fields('Alice'), 100, FIRST_ID)],
      })
    );
    localStorage.setItem(
      accountStoreKey('bob'),
      JSON.stringify({
        ...createEmptyMilestoneStore('bob'),
        records: [createStoredMilestone(fields('Bob'), 100, SECOND_ID)],
      })
    );
    const { result, rerender } = renderHook(
      ({ owner }) => useMilestoneStore(owner),
      { initialProps: { owner: account } }
    );
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.milestones[0].name).toBe('Alice');
    const lateAliceMutation = result.current.addMilestone;

    rerender({ owner: { userId: 'bob', username: 'Bob' } });

    expect(result.current.isLoaded).toBe(false);
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.accountUserId).toBe('bob');
    expect(result.current.milestones.map((record) => record.name)).toEqual([
      'Bob',
    ]);

    act(() => lateAliceMutation(fields('Late Alice mutation')));
    expect(result.current.milestones.map((record) => record.name)).toEqual([
      'Bob',
    ]);
  });

  test('rejects active duplicate names but allows reuse after deletion', async () => {
    const { result } = renderHook(() => useMilestones(null));
    await waitFor(() => expect(result.current.store.isLoaded).toBe(true));

    await act(async () => {
      await result.current.createMilestone({
        name: ' Launch ',
        date: new Date(1_800_000_000_000),
        color: '#123456',
      });
      await result.current.createMilestone({
        name: 'Other',
        date: new Date(1_900_000_000_000),
        color: '#abcdef',
      });
    });

    let duplicateCreate;
    await act(async () => {
      duplicateCreate = await result.current.createMilestone({
        name: 'Launch',
        date: new Date(2_000_000_000_000),
        color: '#654321',
      });
    });
    expect(duplicateCreate).toMatchObject({ ok: false });

    const launchId = result.current.store.milestones.find(
      (record) => record.name === 'Launch'
    )!.publicId;
    const otherId = result.current.store.milestones.find(
      (record) => record.name === 'Other'
    )!.publicId;
    let duplicateRename;
    await act(async () => {
      duplicateRename = await result.current.updateMilestone(otherId, {
        name: 'Launch',
      });
    });
    expect(duplicateRename).toMatchObject({ ok: false });

    await act(async () => {
      await result.current.deleteMilestone(launchId);
    });
    let reusedName;
    await act(async () => {
      reusedName = await result.current.updateMilestone(otherId, {
        name: 'Launch',
      });
    });

    expect(reusedName).toMatchObject({ ok: true });
    expect(result.current.store.milestones).toEqual([
      expect.objectContaining({ publicId: otherId, name: 'Launch' }),
    ]);
  });
});

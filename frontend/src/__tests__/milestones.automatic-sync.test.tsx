import { act, renderHook, waitFor } from '@testing-library/react';

jest.mock('../actions/milestones', () => ({
  syncMilestonesAction: jest.fn(),
}));

import { syncMilestonesAction } from '../actions/milestones';
import useMilestones from '@/hooks/milestones/useMilestones';
import useMilestonesAutomaticSync from '@/hooks/milestones/useMilestonesAutomaticSync';
import {
  accountStoreKey,
  ANONYMOUS_CONSUMED_KEY,
  ANONYMOUS_STORE_KEY,
  createEmptyMilestoneStore,
  createStoredMilestone,
} from '@/lib/milestones/storage';
import { MilestoneLocalStore, StoredMilestone } from '@/lib/types/milestones';

const FIRST_ID = '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const SECOND_ID = '148c3d72-5c61-4f2c-9707-e06b0cc1f7f5';
const account = { userId: 'alice', username: 'Alice' };
const fields = (name = 'Launch') => ({
  name,
  timestamp: 1_800_000_000_000,
  timezone: 'Europe/London',
  color: '#123456',
});
const mockSync = syncMilestonesAction as jest.Mock;

function readyStore(records: StoredMilestone[] = []): MilestoneLocalStore {
  return {
    ...createEmptyMilestoneStore('alice'),
    records,
    sync: { bootstrapCompleted: true, lastSuccessfulSyncAt: null },
  };
}

function fakeStore(local: MilestoneLocalStore, userId = 'alice') {
  let current = local;
  return {
    isLoaded: true,
    storageKey: accountStoreKey(userId),
    records: current.records,
    sync: current.sync,
    getLocalStoreSnapshot: jest.fn(() => current),
    bootstrapFromServer: jest.fn((records: StoredMilestone[]) => {
      current = {
        ...current,
        records,
        sync: { ...current.sync, bootstrapCompleted: true },
      };
      return current;
    }),
    applySyncResponse: jest.fn(
      (_request: StoredMilestone[], response: StoredMilestone[]) => {
        current = { ...current, records: response };
        return { applied: true, hasPendingLocalChanges: false };
      }
    ),
    markAutomaticSyncSuccess: jest.fn(() => true),
  } as any;
}

describe('milestone automatic sync coordinator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: jest.fn(() => FIRST_ID),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('bootstraps once before sending the first complete snapshot', async () => {
    const local = createStoredMilestone(fields(), 100, FIRST_ID);
    const server = createStoredMilestone(fields('Server'), 200, SECOND_ID);
    const store = fakeStore({
      ...createEmptyMilestoneStore('alice'),
      records: [local],
    });
    store.bootstrapFromServer.mockImplementation(() => {
      const bootstrapped = readyStore([local, server]);
      store.getLocalStoreSnapshot.mockReturnValue(bootstrapped);
      return bootstrapped;
    });
    mockSync
      .mockResolvedValueOnce({ ok: true, data: [server] })
      .mockResolvedValueOnce({ ok: true, data: [local, server] });

    renderHook(() =>
      useMilestonesAutomaticSync({ enabled: true, account, store })
    );

    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(2));
    expect(mockSync.mock.calls[0][0]).toEqual([]);
    expect(mockSync.mock.calls[1][0]).toEqual([local, server]);
    expect(store.bootstrapFromServer).toHaveBeenCalledWith([server]);
    expect(store.markAutomaticSyncSuccess).toHaveBeenCalledTimes(1);
  });

  test('coalesces overlapping triggers into one queued pass', async () => {
    let resolveFirst!: (value: any) => void;
    let resolveSecond!: (value: any) => void;
    const first = new Promise((resolve) => (resolveFirst = resolve));
    const second = new Promise((resolve) => (resolveSecond = resolve));
    mockSync.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const store = fakeStore(readyStore());
    const { result } = renderHook(() =>
      useMilestonesAutomaticSync({ enabled: true, account, store })
    );
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.requestSync();
      result.current.requestSync();
      result.current.requestSync();
    });
    await act(async () => resolveFirst({ ok: true, data: [] }));
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(2));
    await act(async () => resolveSecond({ ok: true, data: [] }));
    await act(async () => Promise.resolve());

    expect(mockSync).toHaveBeenCalledTimes(2);
  });

  test('discards a late response after switching accounts', async () => {
    let resolveAlice!: (value: any) => void;
    mockSync
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAlice = resolve;
        })
      )
      .mockResolvedValue({ ok: true, data: [] });
    const aliceStore = fakeStore(readyStore());
    const bobStore = fakeStore(
      {
        ...createEmptyMilestoneStore('bob'),
        sync: { bootstrapCompleted: true, lastSuccessfulSyncAt: null },
      },
      'bob'
    );
    const bob = { userId: 'bob', username: 'Bob' };
    const { rerender } = renderHook(
      ({ owner, store }) =>
        useMilestonesAutomaticSync({ enabled: true, account: owner, store }),
      { initialProps: { owner: account, store: aliceStore } }
    );
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));

    rerender({ owner: bob, store: bobStore });
    await act(async () => resolveAlice({ ok: true, data: [] }));
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(2));

    expect(aliceStore.applySyncResponse).not.toHaveBeenCalled();
    expect(bobStore.applySyncResponse).toHaveBeenCalledTimes(1);
  });

  test('retries transient failures and warns after the third attempt', async () => {
    jest.useFakeTimers();
    mockSync.mockResolvedValue({
      ok: false,
      kind: 'transient',
      error: 'offline',
    });
    const store = fakeStore(readyStore());
    const { result } = renderHook(() =>
      useMilestonesAutomaticSync({ enabled: true, account, store })
    );
    await act(async () => Promise.resolve());
    expect(result.current.status).toBe('retrying');

    await act(async () => {
      jest.advanceTimersByTime(2_000);
      await Promise.resolve();
    });
    expect(result.current.status).toBe('retrying');
    await act(async () => {
      jest.advanceTimersByTime(5_000);
      await Promise.resolve();
    });
    expect(result.current.status).toBe('not-synced');

    mockSync.mockResolvedValue({ ok: true, data: [] });
    await act(async () => {
      jest.advanceTimersByTime(15_000);
      await Promise.resolve();
    });
    expect(result.current.status).toBe('idle');
  });

  test('shows permanent failures immediately without a retry timer', async () => {
    jest.useFakeTimers();
    mockSync.mockResolvedValue({
      ok: false,
      kind: 'conflict',
      error: 'conflict',
    });
    const store = fakeStore(readyStore());
    const { result } = renderHook(() =>
      useMilestonesAutomaticSync({ enabled: true, account, store })
    );
    await act(async () => Promise.resolve());
    expect(result.current.status).toBe('not-synced');

    await act(async () => {
      jest.advanceTimersByTime(60_000);
      await Promise.resolve();
    });
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  test('retries immediately when the browser comes back online', async () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    mockSync
      .mockResolvedValueOnce({
        ok: false,
        kind: 'transient',
        error: 'offline',
      })
      .mockResolvedValueOnce({ ok: true, data: [] });
    const store = fakeStore(readyStore());
    renderHook(() =>
      useMilestonesAutomaticSync({ enabled: true, account, store })
    );
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));

    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    act(() => window.dispatchEvent(new Event('online')));
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(2));
    expect(store.markAutomaticSyncSuccess).toHaveBeenCalledTimes(1);
  });

  test('keeps CRUD local while an earlier response is in flight', async () => {
    let resolveInitial!: (value: any) => void;
    mockSync
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveInitial = resolve;
        })
      )
      .mockImplementation(async (records: StoredMilestone[]) => ({
        ok: true,
        data: records,
      }));
    localStorage.setItem(
      accountStoreKey('alice'),
      JSON.stringify(readyStore())
    );
    const { result } = renderHook(() => useMilestones(account, true));
    await waitFor(() => expect(result.current.store.isLoaded).toBe(true));
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));

    let created;
    await act(async () => {
      created = await result.current.createMilestone({
        name: 'Local first',
        date: new Date(1_800_000_000_000),
        color: '#123456',
      });
    });
    expect(created).toEqual({ ok: true });
    expect(result.current.store.milestones).toEqual([
      expect.objectContaining({ name: 'Local first' }),
    ]);
    expect(result.current.store.config.milestonesOnServer).toBe(false);

    await act(async () => resolveInitial({ ok: true, data: [] }));
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(2));
    expect(mockSync.mock.calls[1][0]).toEqual([
      expect.objectContaining({ name: 'Local first' }),
    ]);
    expect(result.current.store.milestones).toEqual([
      expect.objectContaining({ name: 'Local first' }),
    ]);
  });

  test('keeps update and delete local while synchronization is unavailable', async () => {
    let resolveInitial!: (value: any) => void;
    mockSync
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveInitial = resolve;
        })
      )
      .mockImplementation(async (records: StoredMilestone[]) => ({
        ok: true,
        data: records,
      }));
    localStorage.setItem(
      accountStoreKey('alice'),
      JSON.stringify(
        readyStore([createStoredMilestone(fields(), 100, FIRST_ID)])
      )
    );
    const { result } = renderHook(() => useMilestones(account, true));
    await waitFor(() => expect(result.current.store.isLoaded).toBe(true));
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.updateMilestone(FIRST_ID, {
        name: 'Edited offline',
      });
    });
    expect(result.current.store.milestones[0].name).toBe('Edited offline');
    await act(async () => {
      await result.current.deleteMilestone(FIRST_ID);
    });
    expect(result.current.store.milestones).toEqual([]);
    expect(result.current.store.records[0].deletedAt).not.toBeNull();

    await act(async () => resolveInitial({ ok: true, data: [] }));
    await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(2));
    expect(mockSync.mock.calls[1][0]).toEqual([
      expect.objectContaining({
        publicId: FIRST_ID,
        deletedAt: expect.any(Number),
      }),
    ]);
  });

  test('consumes a reserved anonymous handoff only after full sync succeeds', async () => {
    const anonymous = {
      ...createEmptyMilestoneStore(null),
      records: [createStoredMilestone(fields('Anonymous'), 100, FIRST_ID)],
    };
    localStorage.setItem(ANONYMOUS_STORE_KEY, JSON.stringify(anonymous));
    mockSync.mockImplementation(async (records: StoredMilestone[]) => ({
      ok: true,
      data: records,
    }));

    const { result } = renderHook(() => useMilestones(account, true));
    await waitFor(() => expect(result.current.store.isLoaded).toBe(true));
    await waitFor(() =>
      expect(localStorage.getItem(ANONYMOUS_CONSUMED_KEY)).toBe('alice')
    );

    expect(mockSync).toHaveBeenCalledTimes(2);
    expect(result.current.store.milestones).toEqual([
      expect.objectContaining({ name: 'Anonymous' }),
    ]);
  });
});

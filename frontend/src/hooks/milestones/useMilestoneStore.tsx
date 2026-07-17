'use client';

import {
  activeMilestones,
  applyMilestoneSyncResponse,
  bootstrapMilestoneStore,
  createStoredMilestone,
  loadMilestoneStore,
  markAnonymousConsumed,
} from '@/lib/milestones/storage';
import {
  ClientMilestone,
  DiffPeriod,
  MilestoneAccount,
  MilestoneLocalStore,
  StoredMilestone,
} from '@/lib/types/milestones';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function useMilestoneStore(account: MilestoneAccount | null) {
  const [localStore, setLocalStore] = useState<MilestoneLocalStore | null>(
    null
  );
  const [storageKey, setStorageKey] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const storeRef = useRef<MilestoneLocalStore | null>(null);
  const storageKeyRef = useRef('');

  useEffect(() => {
    let cancelled = false;
    setIsHydrated(false);
    setLoadWarning(null);
    storeRef.current = null;
    storageKeyRef.current = '';

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      const loaded = loadMilestoneStore(localStorage, account?.userId || null);
      storeRef.current = loaded.store;
      storageKeyRef.current = loaded.storageKey;
      setLocalStore(loaded.store);
      setStorageKey(loaded.storageKey);
      setLoadWarning(loaded.warning);
      setIsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [account?.userId]);

  const persist = useCallback(
    (
      update:
        | MilestoneLocalStore
        | ((current: MilestoneLocalStore) => MilestoneLocalStore),
      expectedStorageKey: string
    ) => {
      const current = storeRef.current;
      if (
        !current ||
        !storageKeyRef.current ||
        storageKeyRef.current !== expectedStorageKey
      ) {
        return null;
      }
      const next = typeof update === 'function' ? update(current) : update;
      storeRef.current = next;
      setLocalStore(next);
      try {
        localStorage.setItem(storageKeyRef.current, JSON.stringify(next));
      } catch {
        setLoadWarning('Your latest milestone changes could not be saved.');
      }
      return next;
    },
    []
  );

  const persistForOwner = useCallback(
    (
      update:
        | MilestoneLocalStore
        | ((current: MilestoneLocalStore) => MilestoneLocalStore)
    ) => persist(update, storageKey),
    [persist, storageKey]
  );

  const addMilestone = useCallback(
    (milestone: ClientMilestone) => {
      const stored = createStoredMilestone(milestone);
      persistForOwner((current) => ({
        ...current,
        records: [...current.records, stored],
      }));
      return stored;
    },
    [persistForOwner]
  );

  const removeMilestone = useCallback(
    (publicId: string) => {
      const now = Date.now();
      persistForOwner((current) => ({
        ...current,
        records: current.records.map((milestone) =>
          milestone.publicId === publicId
            ? { ...milestone, updatedAt: now, deletedAt: now }
            : milestone
        ),
        hiddenMilestoneIds: current.hiddenMilestoneIds.filter(
          (id) => id !== publicId
        ),
      }));
    },
    [persistForOwner]
  );

  const updateMilestone = useCallback(
    (publicId: string, milestone: ClientMilestone) => {
      const now = Date.now();
      persistForOwner((current) => ({
        ...current,
        records: current.records.map((stored) =>
          stored.publicId === publicId
            ? { ...stored, ...milestone, updatedAt: now, deletedAt: null }
            : stored
        ),
      }));
    },
    [persistForOwner]
  );

  const setDiffPeriod = useCallback(
    (diffPeriod: DiffPeriod) => {
      persistForOwner((current) => ({
        ...current,
        config: { ...current.config, diffPeriod },
      }));
    },
    [persistForOwner]
  );

  const hideMilestone = useCallback(
    (publicId: string) => {
      persistForOwner((current) =>
        current.hiddenMilestoneIds.includes(publicId)
          ? current
          : {
              ...current,
              hiddenMilestoneIds: [...current.hiddenMilestoneIds, publicId],
            }
      );
    },
    [persistForOwner]
  );

  const unhideMilestone = useCallback(
    (publicId: string) => {
      persistForOwner((current) => ({
        ...current,
        hiddenMilestoneIds: current.hiddenMilestoneIds.filter(
          (id) => id !== publicId
        ),
      }));
    },
    [persistForOwner]
  );

  const bootstrapFromServer = useCallback(
    (records: StoredMilestone[]) => {
      return persistForOwner((current) =>
        bootstrapMilestoneStore(current, records)
      );
    },
    [persistForOwner]
  );

  const applySyncResponse = useCallback(
    (
      requestSnapshot: StoredMilestone[],
      response: StoredMilestone[],
      expectedStorageKey: string
    ) => {
      let hasPendingLocalChanges = false;
      const applied = persist((current) => {
        const merged = applyMilestoneSyncResponse(
          current,
          requestSnapshot,
          response
        );
        hasPendingLocalChanges = merged.hasPendingLocalChanges;
        return merged.store;
      }, expectedStorageKey);
      return {
        applied: applied !== null,
        hasPendingLocalChanges,
      };
    },
    [persist]
  );

  const markAutomaticSyncSuccess = useCallback(
    (timestamp: number, expectedStorageKey: string) => {
      const saved = persist(
        (current) => ({
          ...current,
          sync: {
            ...current.sync,
            lastSuccessfulSyncAt: timestamp,
          },
        }),
        expectedStorageKey
      );
      if (saved && account?.userId) {
        markAnonymousConsumed(localStorage, account.userId);
      }
      return saved !== null;
    },
    [account?.userId, persist]
  );

  const records = localStore?.records || [];
  const milestones = useMemo(() => activeMilestones(records), [records]);
  const hiddenMilestoneIds = localStore?.hiddenMilestoneIds || [];
  const hiddenSet = useMemo(
    () => new Set(hiddenMilestoneIds),
    [hiddenMilestoneIds]
  );
  const ownerMatches = !account || localStore?.accountUserId === account.userId;

  return {
    milestones,
    records,
    config: localStore?.config || {
      diffPeriod: 'days' as const,
    },
    sync: localStore?.sync || {
      bootstrapCompleted: false,
      lastSuccessfulSyncAt: null,
      bootstrapPreference: 'local' as const,
    },
    storageKey,
    accountUserId: localStore?.accountUserId || null,
    account,
    isLoaded: isHydrated && ownerMatches,
    loadWarning,
    getLocalStoreSnapshot: () => storeRef.current,
    addMilestone,
    removeMilestone,
    updateMilestone,
    setDiffPeriod,
    hiddenMilestoneIds,
    hideMilestone,
    unhideMilestone,
    isMilestoneHidden: (publicId: string) => hiddenSet.has(publicId),
    bootstrapFromServer,
    applySyncResponse,
    markAutomaticSyncSuccess,
  };
}

export type MilestoneStore = ReturnType<typeof useMilestoneStore>;
export type { StoredMilestone };

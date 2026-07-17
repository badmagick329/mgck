'use client';

import { syncMilestonesAction } from '@/actions/milestones';
import useMilestoneStore from '@/hooks/milestones/useMilestoneStore';
import {
  MilestoneAccount,
  MilestoneSyncErrorKind,
  MilestoneSyncStatus,
} from '@/lib/types/milestones';
import { useCallback, useEffect, useRef, useState } from 'react';

const RETRY_DELAYS = [2_000, 5_000, 15_000, 30_000] as const;
const TRANSIENT_WARNING_THRESHOLD = 3;

type Store = ReturnType<typeof useMilestoneStore>;

export default function useMilestonesAutomaticSync({
  enabled,
  account,
  store,
}: {
  enabled: boolean;
  account: MilestoneAccount | null;
  store: Store;
}) {
  const [status, setStatus] = useState<MilestoneSyncStatus>('idle');
  const latest = useRef({ enabled, account, store });
  const mounted = useRef(true);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const failureCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSyncRef = useRef<() => void>(() => undefined);
  latest.current = { enabled, account, store };

  const clearRetry = useCallback(() => {
    if (retryTimer.current !== null) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      clearRetry();
    };
  }, [clearRetry]);

  const eligible = useCallback(() => {
    const current = latest.current;
    return Boolean(
      mounted.current &&
        current.enabled &&
        current.account &&
        current.store.isLoaded &&
        current.store.storageKey
    );
  }, []);

  const isCurrentRequest = useCallback(
    (requestGeneration: number, userId: string, storageKey: string) => {
      const current = latest.current;
      return (
        mounted.current &&
        requestGeneration === generation.current &&
        current.account?.userId === userId &&
        current.store.storageKey === storageKey
      );
    },
    []
  );

  const scheduleRetry = useCallback(
    (kind: MilestoneSyncErrorKind) => {
      if (!mounted.current) {
        return;
      }
      if (kind !== 'transient') {
        setStatus('not-synced');
        return;
      }
      failureCount.current += 1;
      setStatus(
        failureCount.current >= TRANSIENT_WARNING_THRESHOLD
          ? 'not-synced'
          : 'retrying'
      );
      const online =
        typeof navigator === 'undefined' || navigator.onLine !== false;
      const visible =
        typeof document === 'undefined' ||
        document.visibilityState === 'visible';
      if (!online || !visible) {
        return;
      }
      clearRetry();
      const delay =
        RETRY_DELAYS[
          Math.min(failureCount.current - 1, RETRY_DELAYS.length - 1)
        ];
      retryTimer.current = setTimeout(() => {
        retryTimer.current = null;
        requestSyncRef.current();
      }, delay);
    },
    [clearRetry]
  );

  const performSync = useCallback(async () => {
    if (!eligible()) {
      return;
    }
    const initial = latest.current;
    const userId = initial.account!.userId;
    const storageKey = initial.store.storageKey;
    const requestGeneration = generation.current;
    const localStore = initial.store.getLocalStoreSnapshot();
    if (!localStore) {
      return;
    }
    inFlight.current = true;
    setStatus('syncing');

    try {
      let snapshot = localStore.records;
      if (!localStore.sync.bootstrapCompleted) {
        const bootstrap = await syncMilestonesAction([]);
        if (!isCurrentRequest(requestGeneration, userId, storageKey)) {
          return;
        }
        if (!bootstrap.ok) {
          scheduleRetry(bootstrap.kind);
          return;
        }
        const bootstrapped = latest.current.store.bootstrapFromServer(
          bootstrap.data
        );
        if (!bootstrapped) {
          return;
        }
        snapshot = bootstrapped.records;
      }

      const result = await syncMilestonesAction(snapshot);
      if (!isCurrentRequest(requestGeneration, userId, storageKey)) {
        return;
      }
      if (!result.ok) {
        scheduleRetry(result.kind);
        return;
      }

      const applied = latest.current.store.applySyncResponse(
        snapshot,
        result.data,
        storageKey
      );
      if (!applied.applied) {
        return;
      }
      clearRetry();
      failureCount.current = 0;
      if (applied.hasPendingLocalChanges) {
        queued.current = true;
        setStatus('syncing');
      } else {
        latest.current.store.markAutomaticSyncSuccess(Date.now(), storageKey);
        setStatus('idle');
      }
    } finally {
      inFlight.current = false;
      if (queued.current && eligible()) {
        queued.current = false;
        queueMicrotask(() => requestSyncRef.current());
      }
    }
  }, [clearRetry, eligible, isCurrentRequest, scheduleRetry]);

  const requestSync = useCallback(() => {
    if (!eligible()) {
      return;
    }
    clearRetry();
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    void performSync();
  }, [clearRetry, eligible, performSync]);
  requestSyncRef.current = requestSync;

  useEffect(() => {
    generation.current += 1;
    queued.current = false;
    failureCount.current = 0;
    clearRetry();
    setStatus('idle');
    if (eligible()) {
      requestSync();
    }
  }, [
    account?.userId,
    clearRetry,
    eligible,
    enabled,
    requestSync,
    store.isLoaded,
    store.storageKey,
  ]);

  useEffect(() => {
    const handleOnline = () => requestSync();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestSync();
      }
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [requestSync]);

  return {
    status,
    requestSync,
    isSyncing: status === 'syncing',
  };
}

import { useCallback, useState } from 'react';

export default function useSyncOperation<T>() {
  const [isSyncing, setIsSyncing] = useState(false);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | undefined> => {
      setIsSyncing(true);
      try {
        return await fn();
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );
  return { isSyncing, execute };
}

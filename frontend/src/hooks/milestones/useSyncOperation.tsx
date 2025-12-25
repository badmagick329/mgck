import { useCallback, useState } from 'react';

export default function useSyncOperation() {
  const [isSyncing, setIsSyncing] = useState(false);

  const execute = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setIsSyncing(true);
    try {
      return await fn();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { isSyncing, execute };
}

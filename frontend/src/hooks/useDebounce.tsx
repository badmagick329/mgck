import { useCallback, useEffect, useRef } from 'react';

export default function useDebounce<T extends unknown[]>(delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), [delay]);

  return useCallback(
    (callback: (...args: T) => unknown, ...args: T) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => callback(...args), delay);
    },
    [delay]
  );
}

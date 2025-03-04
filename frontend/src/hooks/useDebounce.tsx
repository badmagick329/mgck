import { useState } from 'react';

type SetTimeout = ReturnType<typeof setTimeout>;

export default function useDebounce<T extends unknown[]>(delay: number) {
  const [timer, setTimer] = useState<SetTimeout | undefined>(undefined);

  function debounce(callback: (...args: T) => unknown, ...args: T) {
    if (timer) {
      clearTimeout(timer);
    }
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    setTimer(newTimer);
  }

  return debounce;
}

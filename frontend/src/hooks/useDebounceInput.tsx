import { useCallback, useRef, useState } from 'react';

export default function useDebounceInput({
  defaultValue,
  delay,
}: {
  defaultValue: string;
  delay: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(timeoutRef.current);
    const newValue = e.target.value;
    timeoutRef.current = setTimeout(() => {
      setValue(newValue);
    }, delay);
  }, []);

  return {
    value,
    setValue,
    handleChange,
  };
}

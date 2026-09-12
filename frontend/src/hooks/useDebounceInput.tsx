import { useCallback, useState } from 'react';
import useDebounce from './useDebounce';

export default function useDebounceInput({
  defaultValue,
  delay,
}: {
  defaultValue: string;
  delay: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const debounce = useDebounce<[string]>(delay);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      debounce(setValue, e.target.value),
    [debounce]
  );

  return {
    value,
    setValue,
    handleChange,
  };
}

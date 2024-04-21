"use client";
import { useState } from "react";

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  let storedValue: string | null = null;
  try {
    storedValue = localStorage.getItem(key);
  } catch (error) {}

  const [value, setValue] = useState<T>(() => {
    try {
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const updateValue = (newValue: T) => {
    try {
      const valueToStore =
        newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error on update local storage");
    }
  };

  const removeValue = () => {
    try {
      localStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error("Error on remove local storage");
    }
  };

  return [value, updateValue, removeValue];
}

export default useLocalStorage;

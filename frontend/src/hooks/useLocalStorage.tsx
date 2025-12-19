'use client';
import { useEffect, useState } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): {
  value: T;
  updateValue: (newValue: T | ((value: T) => T)) => void;
  removeValue: () => void;
  isLoaded: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      value: initialValue,
      updateValue: () => {},
      removeValue: () => {},
      isLoaded: false,
    };
  }

  let storedValue: string | null = null;
  try {
    storedValue = localStorage.getItem(key);
  } catch (error) {}

  const [value, setValue] = useState<T>(() => {
    try {
      const readValue = storedValue ? JSON.parse(storedValue) : initialValue;
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const updateValue = (newValue: T | ((value: T) => T)) => {
    try {
      const valueToStore =
        newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error on update local storage');
    }
  };

  const removeValue = () => {
    try {
      localStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error('Error on remove local storage');
    }
  };

  return {
    value,
    updateValue,
    removeValue,
    isLoaded,
  };
}

export default useLocalStorage;

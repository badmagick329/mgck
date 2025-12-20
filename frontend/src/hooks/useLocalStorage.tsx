'use client';
import { useEffect, useState } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): {
  value: T;
  updateValue: (newValue: T | ((value: T) => T)) => void;
  removeValue: () => void;
  isLoaded: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      value: initialValue instanceof Function ? initialValue() : initialValue,
      updateValue: () => {},
      removeValue: () => {},
      isLoaded: false,
    };
  }

  let storedValue: string | null = null;
  try {
    storedValue = localStorage.getItem(key);
  } catch (error) {}
  initialValue =
    initialValue instanceof Function ? initialValue() : initialValue;

  const [value, setValue] = useState<T>(() => {
    try {
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

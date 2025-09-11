import { useEffect, useState, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        // If item exists in localStorage, parse it. Otherwise, use initialValue.
        const value = item ? JSON.parse(item) : initialValue;
        setStoredValue(value);
      }
    } catch (error) {
      console.error(error);
      // If error, stick with initial value
      setStoredValue(initialValue);
    }
    setIsInitialized(true);
  // We only want this to run once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(`Tried to set localStorage key “${key}” even though no document was found.`);
      return;
    }
    
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  // We return the stored value, the setter, and an initialized flag.
  // The flag can be used to prevent rendering components that depend on
  // localStorage before it has been read.
  return [storedValue, setValue, isInitialized] as const;
}

export default useLocalStorage;

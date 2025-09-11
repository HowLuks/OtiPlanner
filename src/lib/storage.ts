import { useEffect, useState, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      } else {
        setStoredValue(initialValue)
      }
    } catch (error) {
      console.error(error);
      setStoredValue(initialValue);
    } finally {
      setIsInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(`Tried to set localStorage key “${key}” even though no document was found.`);
      return;
    }
    
    try {
      const valueToStore = value instanceof Function ? value(storedValue!) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue!, setValue, isInitialized] as const;
}

export default useLocalStorage;

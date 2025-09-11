import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const readValue = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  useEffect(() => {
    setStoredValue(readValue());
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(`Tried to set localStorage key “${key}” even though no document was found.`);
        return;
      }

      try {
        const valueToStore = value instanceof Function ? value(readValue()) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setStoredValue(valueToStore);
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, readValue]
  );
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
         try {
            setStoredValue(JSON.parse(event.newValue));
         } catch(e) {
            console.warn(`Error parsing storage change for key "${key}"`, e);
         }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, isInitialized] as const;
}

export default useLocalStorage;

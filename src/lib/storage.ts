import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item) as T);
        }
      } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
      }
      setIsInitialized(true); 
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        console.warn(`Tried to set localStorage key “${key}” even though no document was found.`);
        return;
      }

      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setStoredValue(valueToStore);
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
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


  const clientValue = isInitialized ? storedValue : initialValue;

  return [clientValue, setValue];
}

export default useLocalStorage;

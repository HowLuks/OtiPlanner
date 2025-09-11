import { useEffect, useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    let item;
    try {
      // We always start with the initial value from the code to avoid hydration issues
      // and to ensure the data structure is up to date.
      // We then update localStorage with this initial value.
      setStoredValue(initialValue);
      window.localStorage.setItem(key, JSON.stringify(initialValue));
    } catch (error) {
      console.error(error);
      setStoredValue(initialValue);
    }
  // We only want this to run once on mount, with the latest initialValue.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

export default useLocalStorage;

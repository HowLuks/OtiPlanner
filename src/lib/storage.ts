import { useEffect, useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    let item;
    try {
      item = window.localStorage.getItem(key);
      // If item exists, parse it. If not, use initialValue and set it in localStorage.
      const valueToStore = item ? JSON.parse(item) : initialValue;
      setStoredValue(valueToStore);
      if (!item) {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      }
    } catch (error) {
      console.error(error);
      // If parsing fails, use initialValue and reset localStorage.
      setStoredValue(initialValue);
      window.localStorage.setItem(key, JSON.stringify(initialValue));
    }
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

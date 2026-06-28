import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getUserItem, setUserItem } from '../utils/userStorage';

const STORAGE_KEY = 'gf_compare';
const MAX_COMPARE = 3;

interface CompareContextType {
  compareIds: string[];
  addToCompare: (id: string) => boolean;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextType>({
  compareIds: [],
  addToCompare: () => false,
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => false,
  isFull: false,
});

function readStorage(): string[] {
  try {
    const raw = getUserItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>(readStorage);

  const persist = (ids: string[]) => {
    try { setUserItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  };

  const addToCompare = useCallback((id: string): boolean => {
    let added = false;
    setCompareIds((prev) => {
      if (prev.includes(id) || prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, id];
      persist(next);
      added = true;
      return next;
    });
    return added;
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      const next = prev.filter((x) => x !== id);
      persist(next);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    persist([]);
  }, []);

  const isInCompare = useCallback(
    (id: string) => compareIds.includes(id),
    [compareIds],
  );

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isFull: compareIds.length >= MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompare() {
  return useContext(CompareContext);
}

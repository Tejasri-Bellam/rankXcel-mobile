import { useCallback, useState } from 'react';
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface UseSearchResult {
  query: string;
  debouncedQuery: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;
}

export function useSearch(debounceMs: number = 400): UseSearchResult {
  const [query, setQueryState] = useState('');
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const clearQuery = useCallback(() => {
    setQueryState('');
  }, []);

  return { query, debouncedQuery, setQuery, clearQuery };
}

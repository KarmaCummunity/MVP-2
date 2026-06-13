// Debounced search-input state — extracted from the search tab (TD-133 size cap).
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebouncedSearchInput(debounceMs: number) {
  const [inputText, setInputText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setDebouncedQuery(text.trim()), debounceMs);
    },
    [debounceMs],
  );

  // Cleanup debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { inputText, setInputText, debouncedQuery, setDebouncedQuery, handleTextChange };
}

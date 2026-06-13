// Focus-aware wrapper around @kc/ui's useAside (FR-RESP-003).
//
// Tab scenes stay mounted after their first visit, so a bare useAside from
// an unfocused tab would fight the focused one over the single aside slot.
// Publishing only while focused keeps "last focused screen wins" semantics.
import { useCallback, useState, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAside } from '@kc/ui';

export function useScreenAside(
  render: () => ReactNode,
  deps: ReadonlyArray<unknown>,
): void {
  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );
  useAside(render, deps, isFocused);
}

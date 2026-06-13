// Search-screen glue for the desktop aside (FR-RESP-003).
// Publishes <RecentSearchesAside/> and funnels aside taps back into the
// screen's input state via the store's one-shot requestedQuery handshake.
import { useEffect } from 'react';
import { useSearchStore } from '../../store/searchStore';
import { useScreenAside } from './useScreenAside';
import { RecentSearchesAside } from './RecentSearchesAside';

export function useSearchScreenAside(onQueryRequested: (q: string) => void): void {
  const requestedQuery = useSearchStore((s) => s.requestedQuery);
  const consumeRequestedQuery = useSearchStore((s) => s.consumeRequestedQuery);

  useEffect(() => {
    if (requestedQuery === null) return;
    const q = consumeRequestedQuery();
    if (q !== null) onQueryRequested(q);
  }, [requestedQuery, consumeRequestedQuery, onQueryRequested]);

  useScreenAside(() => <RecentSearchesAside />, []);
}

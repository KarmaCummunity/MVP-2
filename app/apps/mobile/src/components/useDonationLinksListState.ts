// FR-DONATE-007 — fetch + silent refresh after add/edit/remove (keeps DonationLinksList ≤200 LOC).
import { useCallback, useEffect, useState } from 'react';
import type { DonationCategorySlug, DonationLink } from '@kc/domain';
import { container } from '../lib/container';
import { dedupeDonationLinksById } from './donationLinksListMerge';

export function useDonationLinksListState(categorySlug: DonationCategorySlug) {
  const [links, setLinks] = useState<DonationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const load = useCallback(async (opts?: { readonly silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
      setErrored(false);
    }
    try {
      const rows = await container.listDonationLinks.execute(categorySlug);
      setLinks(dedupeDonationLinksById(rows));
      if (!silent) setErrored(false);
    } catch {
      if (!silent) setErrored(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshAfterMutation = useCallback(() => {
    void load({ silent: true });
  }, [load]);

  const onRemoved = useCallback(
    (_id: string) => {
      refreshAfterMutation();
    },
    [refreshAfterMutation],
  );

  const onAdded = useCallback(
    (_link: DonationLink) => {
      refreshAfterMutation();
    },
    [refreshAfterMutation],
  );

  const onUpdated = useCallback(
    (_link: DonationLink) => {
      refreshAfterMutation();
    },
    [refreshAfterMutation],
  );

  return { links, loading, errored, load, onAdded, onUpdated, onRemoved };
}

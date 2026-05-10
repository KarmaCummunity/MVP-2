// Action handlers + busy/error state for PostMenuSheet.
// Extracted to keep PostMenuSheet under the 200-LOC cap and to make
// the state machine testable in isolation if/when we add tests.
import { useCallback, useState } from 'react';
import type { PostWithOwner } from '@kc/application';
import { container } from '../lib/container';

interface Args {
  post: PostWithOwner;
  /** Called after a successful destructive action. */
  onAfterRemoval: () => void;
  /**
   * Called only after a successful action so the parent can close the active
   * modal. On failure the modal stays open so the error can render —
   * `error` propagates instead.
   */
  onSettle: () => void;
}

interface PostMenuActions {
  busy: boolean;
  error: string | null;
  clearError: () => void;
  handleOwnerDelete: () => Promise<void>;
  handleAdminRemove: () => Promise<void>;
}

export function usePostMenuActions({ post, onAfterRemoval, onSettle }: Args): PostMenuActions {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (work: () => Promise<void>, errorCopy: string) => {
      setBusy(true);
      setError(null);
      try {
        await work();
        onSettle();
        onAfterRemoval();
      } catch {
        setError(errorCopy);
      } finally {
        setBusy(false);
      }
    },
    [onAfterRemoval, onSettle],
  );

  const handleOwnerDelete = useCallback(
    () => run(() => container.deletePost.execute({ postId: post.postId }), 'המחיקה נכשלה, נסה שוב.'),
    [run, post.postId],
  );

  const handleAdminRemove = useCallback(
    () => run(() => container.adminRemovePost.execute({ postId: post.postId }), 'ההסרה נכשלה, נסה שוב.'),
    [run, post.postId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { busy, error, clearError, handleOwnerDelete, handleAdminRemove };
}

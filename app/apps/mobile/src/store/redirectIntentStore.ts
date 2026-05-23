// FR-POST-023 AC6 (P2.33) — pending deep-link restoration after sign-in.
//
// When an unauthenticated user lands on `/post/<id>` (or any other deep link
// that AuthGate would normally bounce to `(auth)`), capture the path here
// **before** the redirect. After the user completes sign-in (and onboarding),
// AuthGate consumes the captured path and navigates the user back to where
// they originally wanted to go.
//
// Not persisted — refreshing the app loses the intent, which is fine: a
// browser refresh re-reads the URL bar, and a native cold start usually
// happens long after the share-tap flow finished.

import { create } from 'zustand';

const INTENT_TTL_MS = 10 * 60 * 1000;

// Routes we are willing to restore to. AuthGate calls this with full
// pathnames (e.g. `/post/abc`, `/user/handle`, `/chat/xyz`). Onboarding,
// auth, and (tabs) entries are intentionally excluded so a halfway-captured
// intent never bounces the user out of the auth flow they just completed.
const RESTORABLE_PATH_PREFIXES = ['/post/', '/user/', '/chat/'];

export function isRestorablePath(path: string): boolean {
  if (typeof path !== 'string' || path === '') return false;
  return RESTORABLE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

interface RedirectIntentState {
  pendingPath: string | null;
  capturedAtMs: number | null;
  capturePath: (path: string, nowMs?: number) => void;
  /** Reads + clears the pending path if it is still within the TTL window. */
  consumePath: (nowMs?: number) => string | null;
  clearPath: () => void;
}

export const useRedirectIntentStore = create<RedirectIntentState>((set, get) => ({
  pendingPath: null,
  capturedAtMs: null,
  capturePath: (path, nowMs = Date.now()) => {
    if (!isRestorablePath(path)) return;
    // Never overwrite a fresher intent with a stale duplicate (no-op when
    // the same path lands twice — e.g. AuthGate re-runs).
    if (get().pendingPath === path) return;
    set({ pendingPath: path, capturedAtMs: nowMs });
  },
  consumePath: (nowMs = Date.now()) => {
    const { pendingPath, capturedAtMs } = get();
    if (pendingPath === null || capturedAtMs === null) return null;
    if (nowMs - capturedAtMs > INTENT_TTL_MS) {
      set({ pendingPath: null, capturedAtMs: null });
      return null;
    }
    set({ pendingPath: null, capturedAtMs: null });
    return pendingPath;
  },
  clearPath: () => set({ pendingPath: null, capturedAtMs: null }),
}));

export const REDIRECT_INTENT_TTL_MS = INTENT_TTL_MS;

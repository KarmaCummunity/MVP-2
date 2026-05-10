// Dev-only "ghost session" — injects a fake AuthSession into the store so the
// app skips the auth screen entirely. No Supabase call is made; no real user
// is created; the JWT inside is a placeholder.
//
// SAFETY MODEL — three independent gates must ALL be true for any of this to
// run, AND production bundles do not contain the code at all:
//   1. `__DEV__` — Metro/Expo replace this with the literal `false` in
//      production builds. The whole `if (!__DEV__) return null;` branch then
//      becomes unreachable code that the bundler removes. The fake session,
//      the env-var read, even the function name disappear from `dist/`.
//   2. `EXPO_PUBLIC_DEV_GHOST_SESSION === '1'` — explicit per-developer
//      opt-in via the `.env` file (gitignored).
//   3. No real session was restored on cold-start (handled by AuthGate).
//
// LIMITATIONS — by design, this is for layout/UI testing only:
//   • Any Supabase query (posts, profile, chat, donations links) will fail
//     with 401 because the JWT is fake. Screens render their loading/error/
//     empty states. That is enough to inspect RTL alignment, spacing,
//     typography, navigation, and component composition.
//   • Realtime subscriptions will reject. Inbox / chat will be empty.
//   • Writing actions (create post, add donation link, send message) will
//     also 401. Don't use ghost mode to verify mutations — use the real-auth
//     `EXPO_PUBLIC_DEV_AUTO_SIGN_IN` path for that.
//
// See docs/dev/AUTO_SIGN_IN.md for the rationale + ops checklist (same doc
// covers both this and the real-auth dev path).

import type { AuthSession as KcAuthSession } from '@kc/application';

const FLAG_VAR = 'EXPO_PUBLIC_DEV_GHOST_SESSION';

export function isDevGhostSessionEnabled(): boolean {
  if (!__DEV__) return false;
  return process.env[FLAG_VAR] === '1';
}

/**
 * Returns a synthetic `AuthSession` when ghost mode is enabled, else `null`.
 * The userId is a recognizable sentinel so any code path that accidentally
 * propagates it to the backend is easy to spot in logs.
 */
export function getDevGhostSession(): KcAuthSession | null {
  if (!isDevGhostSessionEnabled()) return null;
  console.warn(
    `[devGhostSession] Injecting fake session — DEV-ONLY, gated by __DEV__ + ${FLAG_VAR}. ` +
      'Supabase queries will 401 (fake JWT); use this only for layout/UI inspection.',
  );
  return {
    userId: '00000000-0000-0000-0000-00000000dev0',
    email: 'ghost@dev.local',
    emailVerified: true,
    accessToken: 'dev-ghost-jwt-not-valid',
    refreshToken: 'dev-ghost-refresh-not-valid',
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h from now
    displayName: 'Dev Ghost',
    avatarUrl: null,
  };
}

// FR-MOD-010 AC4 — sign-in + periodic mid-session enforcement.
//
// Periodic recheck (60s) handles the case where an admin bans a user mid-session.
// A future hardening pass should add a fetch-interceptor for instant 401/403
// detection — Supabase JS v2 doesn't expose that hook cleanly, so we go with
// the periodic poll for the MVP. Tracked as TD alongside this slice.
import { useEffect, useRef } from 'react';
import { useRouter, type Href } from 'expo-router';
import { container, supabase } from '../lib/container';
import { useAuthStore } from '../store/authStore';

const RECHECK_MS = 60_000;

export function useEnforceAccountGate(userId: string | null) {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const enforcingRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      enforcingRef.current = false;
      return;
    }

    let cancelled = false;

    const check = async () => {
      if (cancelled || enforcingRef.current) return;
      try {
        const result = await container.checkAccountGate.execute({ userId });
        if (cancelled || result.allowed) return;
        enforcingRef.current = true;
        await supabase.auth.signOut();
        signOut();
        // Cast: the new top-level route isn't picked up by the auto-generated
        // typed-routes file (.expo/types/router.d.ts) until the Expo dev
        // server runs and regenerates it. Runtime resolution is unaffected.
        router.replace({
          pathname: '/account-blocked',
          params: {
            reason: result.reason ?? 'banned',
            until: result.until ?? '',
          },
        } as unknown as Href);
      } catch {
        // Network failure is best-effort — the next interval tick retries.
      }
    };

    void check();
    const id = setInterval(() => void check(), RECHECK_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId, signOut, router]);
}

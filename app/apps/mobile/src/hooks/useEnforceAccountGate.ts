// FR-MOD-010 AC4 — sign-in + periodic mid-session enforcement + fetch-level ban detection.
// Two-tier approach: (1) instant 403 interception via setOnForbiddenCallback wired to
// the Supabase client's global.fetch (TD-149); (2) 60s poll as belt-and-suspenders.
import { useEffect, useRef } from 'react';
import { useRouter, type Href } from 'expo-router';
import { container, supabase } from '../lib/container';
import { useAuthStore } from '../store/authStore';
import { setOnForbiddenCallback } from '@kc/infrastructure-supabase';

const RECHECK_MS = 60_000;

export function useEnforceAccountGate(userId: string | null) {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const enforcingRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      enforcingRef.current = false;
      setOnForbiddenCallback(null);
      return;
    }

    let cancelled = false;

    const check = async () => {
      if (cancelled || enforcingRef.current) return;
      try {
        const result = await container.checkAccountGate.execute({ userId });
        if (cancelled || result.allowed) return;
        // FR-AUTH-006 / D-19: migration 0067 makes the gate deny `pending_verification`.
        // The reason isn't in the `AccountGateReason` union (kept narrow for FR-MOD-010 callers),
        // hence the string cast. Sign the user out so the sign-in screen can re-show the
        // verify-pending panel on the next attempt.
        if ((result.reason as string | undefined) === 'pending_verification') {
          enforcingRef.current = true;
          await supabase.auth.signOut();
          signOut();
          router.replace('/(auth)/sign-in');
          return;
        }
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

    // Instant detection: on any 403 from PostgREST, run check immediately.
    setOnForbiddenCallback(() => { void check(); });

    void check();
    const id = setInterval(() => void check(), RECHECK_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
      setOnForbiddenCallback(null);
    };
  }, [userId, signOut, router]);
}

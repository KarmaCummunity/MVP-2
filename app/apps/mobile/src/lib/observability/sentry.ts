/**
 * Mapped to docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md § Wave 0.
 * Single entry point for Sentry SDK init.
 * Other code MUST NOT call Sentry.init directly.
 */
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN: string | undefined =
  (process.env.EXPO_PUBLIC_SENTRY_DSN as string | undefined) ??
  (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn;

type Env = 'dev' | 'prod';
function detectEnv(): Env {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

let initialised = false;
export function initSentry(): void {
  if (initialised) return;
  if (!DSN) { if (__DEV__) console.warn('[observability] Sentry DSN missing'); return; }
  const env = detectEnv();
  Sentry.init({
    dsn: DSN,
    environment: env,
    enableAutoSessionTracking: true,
    tracesSampleRate: env === 'prod' ? 0.25 : 1.0,
    enableNativeFramesTracking: true,
  });
  initialised = true;
}
export function isInitialised(): boolean { return initialised; }
export { Sentry };

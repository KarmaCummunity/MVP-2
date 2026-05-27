/**
 * Mapped to docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md § Wave 0.
 *
 * Single entry point for Sentry SDK init. Other code MUST NOT call Sentry.init
 * directly.
 *
 * The SDK module (`@sentry/react-native`, ~250 KB minified) is loaded LAZILY
 * via `import()` only when a DSN is actually configured. Without a DSN the
 * SDK never enters the bundle on first paint — important because:
 *   1. Dev builds currently ship without a DSN.
 *   2. Even in prod, deferring the SDK past first paint shaves cold-start time.
 */
import Constants from 'expo-constants';

const DSN: string | undefined =
  (process.env.EXPO_PUBLIC_SENTRY_DSN as string | undefined) ??
  (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn;

type Env = 'dev' | 'prod';
function detectEnv(): Env {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

export function hasDsn(): boolean {
  return Boolean(DSN);
}

let initialised = false;
let sentryModule: typeof import('@sentry/react-native') | null = null;

export async function initSentry(): Promise<void> {
  if (initialised) return;
  if (!DSN) {
    if (__DEV__) console.warn('[observability] Sentry DSN missing — skipping init');
    return;
  }
  try {
    const mod = await import('@sentry/react-native');
    const env = detectEnv();
    mod.init({
      dsn: DSN,
      environment: env,
      enableAutoSessionTracking: true,
      tracesSampleRate: env === 'prod' ? 0.25 : 1.0,
      enableNativeFramesTracking: true,
    });
    sentryModule = mod;
    initialised = true;
  } catch (err) {
    if (__DEV__) console.warn('[observability] Sentry init failed', err);
  }
}

export function isInitialised(): boolean {
  return initialised;
}

export function getSentryIfInit(): typeof import('@sentry/react-native') | null {
  return initialised ? sentryModule : null;
}

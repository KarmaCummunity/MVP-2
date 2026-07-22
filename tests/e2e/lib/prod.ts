// GloWe live-site synthetic monitoring helpers (INFRA-QA-W7).
//
// GloWe production is served at GLOWE_PROD_URL (default deploy:
// https://dev.karma-community.pages.dev/glowe) — NOT karma-community-kc.com/glowe.
// KC production is a separate URL (KC_PROD_URL); do not conflate the two.

export const GLOWE_PROD_URL = (process.env.GLOWE_PROD_URL ?? '').replace(/\/$/, '');
export const GLOWE_BASE = GLOWE_PROD_URL;
export const GLOWE_ORIGIN = GLOWE_BASE ? new URL(GLOWE_BASE).origin : '';

export function requireGloweProdTarget(): void {
  if (!GLOWE_PROD_URL) {
    throw new Error('GLOWE_PROD_URL is required for prod-health probes');
  }
}

export function gloweUrl(page: string): string {
  requireGloweProdTarget();
  if (!page || page === '/' || page === 'index.html') return `${GLOWE_BASE}/index.html`;
  return `${GLOWE_BASE}/pages/${page}`;
}

// Semver x.y.z from glowe-version.js (no hardcoded version in specs).
export const VERSION_RE = /version:\s*'(\d+\.\d+\.\d+)'/;

export async function fetchAppVersion(): Promise<string | null> {
  requireGloweProdTarget();
  const res = await fetch(`${GLOWE_BASE}/js/glowe-version.js`, { redirect: 'follow' });
  if (!res.ok) return null;
  const body = await res.text();
  const match = body.match(VERSION_RE);
  return match?.[1] ?? null;
}

export async function measure<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
  const started = Date.now();
  const result = await fn();
  return { result, latencyMs: Date.now() - started };
}

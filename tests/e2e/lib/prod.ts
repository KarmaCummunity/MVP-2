// Production synthetic monitoring helpers (INFRA-QA-W7).
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

const prodWebUrl = (process.env.PROD_WEB_URL ?? '').replace(/\/$/, '');
export const PROD_WEB_URL = prodWebUrl;
export const GLOWE_BASE = (process.env.GLOWE_PROD_URL ?? (prodWebUrl ? `${prodWebUrl}/glowe` : '')).replace(/\/$/, '');
export const GLOWE_ORIGIN = GLOWE_BASE ? new URL(GLOWE_BASE).origin : '';

export function requireProdTarget(): void {
  if (!PROD_WEB_URL) {
    throw new Error('PROD_WEB_URL is required for prod-health probes');
  }
  if (!GLOWE_BASE) {
    throw new Error('Could not derive GLOWE_BASE from PROD_WEB_URL');
  }
}

export function gloweUrl(page: string): string {
  requireProdTarget();
  if (!page || page === '/' || page === 'index.html') return `${GLOWE_BASE}/index.html`;
  return `${GLOWE_BASE}/pages/${page}`;
}

// Semver x.y.z from glowe-version.js (no hardcoded version in specs).
export const VERSION_RE = /version:\s*'(\d+\.\d+\.\d+)'/;

export async function fetchAppVersion(): Promise<string | null> {
  requireProdTarget();
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

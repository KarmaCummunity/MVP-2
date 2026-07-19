// _shared/cors.ts
// Shared CORS helper for Edge Functions that serve public-facing requests.
// Origin allowlist is read from PUBLIC_RESEARCH_ALLOWED_ORIGINS (comma-separated)
// and always merged with local GloWe/Expo dev origins so local UI never breaks
// when the remote env var is set for production hosts only.

const RAW = (Deno.env.get('PUBLIC_RESEARCH_ALLOWED_ORIGINS') ?? '').trim();

const DEV_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const FROM_ENV = RAW
  ? RAW.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

export const ALLOWED_ORIGINS: string[] = [...new Set([...DEV_ORIGINS, ...FROM_ENV])];

export function isAllowedOrigin(origin: string | null): boolean {
  return origin !== null && ALLOWED_ORIGINS.includes(origin);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!isAllowedOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

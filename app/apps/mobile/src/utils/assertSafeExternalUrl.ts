const ALLOWED_SCHEMES = new Set(['https:', 'http:', 'mailto:', 'tel:']);

/** Reject javascript/data and other dangerous schemes before opening a URL. */
export function assertSafeExternalUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('empty_url');
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('invalid_url');
  }
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw new Error('unsupported_scheme');
  }
  return parsed.href;
}

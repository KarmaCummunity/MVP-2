/** Parses `?flag=true` style query params used by marketing web URLs. */

export function parseTruthyQueryParam(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null) return false;
  const v = raw.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

/**
 * PostgREST returns HTTP 404 + code `PGRST205` when the requested relation
 * is not in the schema cache (common when a migration was not applied yet).
 */
export function isPostgrestRelationMissing(error: {
  code?: string;
  message?: string;
}): boolean {
  if (error.code === 'PGRST205') return true;
  const msg = (error.message ?? '').toLowerCase();
  if (msg.includes('could not find the table') && msg.includes('schema cache')) return true;
  return false;
}

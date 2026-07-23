import { isPrimarilyLatinName } from '@kc/glowe-domain';
import type { SupabaseClient } from '@supabase/supabase-js';

function trimName(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

export async function resolveEnglishName(
  client: SupabaseClient,
  primary: string,
  explicitEn: string | null | undefined,
  context: 'person' | 'organization',
): Promise<string> {
  const explicit = trimName(explicitEn);
  if (explicit) return explicit;
  const source = trimName(primary);
  if (!source) return '';
  if (isPrimarilyLatinName(source)) return source;
  try {
    const { data, error } = await client.functions.invoke('glowe-generate-name-en', {
      body: { names: [{ field: 'name', text: source, context }] },
    });
    if (error) return '';
    const results = data && typeof data === 'object' && 'results' in data
      ? (data as { results?: { textEn?: string }[] }).results
      : null;
    const first = Array.isArray(results) ? results[0] : null;
    return trimName(first?.textEn);
  } catch {
    return '';
  }
}

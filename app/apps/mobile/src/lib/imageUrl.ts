// Mapped to docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md § Wave 1.
// Builds Supabase Storage public URLs. Optionally applies image transform params
// (`?width=N&quality=N`) which routes through the `/render/image/` endpoint.
// Pure function — no client coupling.
//   https://supabase.com/docs/guides/storage/serving/image-transformations

type Args = { bucket: string; path: string; width?: number; quality?: number };

function getSupabaseBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('EXPO_PUBLIC_SUPABASE_URL not set');
  return url.replace(/\/$/, '');
}

export function getSupabasePublicImageUrl({ bucket, path, width, quality }: Args): string {
  if (!path) return '';
  const base = getSupabaseBaseUrl();
  const wantsTransform = typeof width === 'number' || typeof quality === 'number';
  if (!wantsTransform) {
    return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }
  const params = new URLSearchParams();
  if (typeof width === 'number') params.set('width', String(width));
  if (typeof quality === 'number') params.set('quality', String(quality));
  return `${base}/storage/v1/render/image/public/${bucket}/${path}?${params.toString()}`;
}

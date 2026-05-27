// Mapped to docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md § Wave 1.
// Builds Supabase Storage public URLs.
//
// The `/render/image/` transform endpoint (`?width=N&quality=N`) returns 404 or
// hangs for the `post-images` bucket on the dev project — likely a transform
// quota / config issue at the Storage tier we cannot fix from the client.
// Symptom: post media never resolves; expo-image's blurhash placeholder sticks
// indefinitely. So we now route all images through the plain `/object/public/`
// endpoint regardless of caller hints. The width/quality args remain in the
// signature so we can re-enable transforms in Wave 4 alongside a CDN that
// guarantees a working pipeline.
//
//   https://supabase.com/docs/guides/storage/serving/image-transformations

type Args = { bucket: string; path: string; width?: number; quality?: number };

function getSupabaseBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('EXPO_PUBLIC_SUPABASE_URL not set');
  return url.replace(/\/$/, '');
}

const USE_TRANSFORM = process.env.EXPO_PUBLIC_USE_STORAGE_TRANSFORM === '1';

export function getSupabasePublicImageUrl({ bucket, path, width, quality }: Args): string {
  if (!path) return '';
  const base = getSupabaseBaseUrl();
  const wantsTransform =
    USE_TRANSFORM && (typeof width === 'number' || typeof quality === 'number');
  if (!wantsTransform) {
    return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }
  const params = new URLSearchParams();
  if (typeof width === 'number') params.set('width', String(width));
  if (typeof quality === 'number') params.set('quality', String(quality));
  return `${base}/storage/v1/render/image/public/${bucket}/${path}?${params.toString()}`;
}

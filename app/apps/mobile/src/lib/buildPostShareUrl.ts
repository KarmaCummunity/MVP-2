// FR-POST-023 — pure URL builder for the share link. Returns the canonical
// `${webBaseUrl}/post/<id>` URL that the in-app deep link, the universal
// link, and the share message all resolve to. Never references Supabase.

const DEFAULT_WEB_BASE_URL = 'https://karma-community-kc.com';

export function buildPostShareUrl(postId: string, webBaseUrl: string): string {
  if (!postId || !postId.trim()) {
    throw new Error('buildPostShareUrl: postId is required');
  }
  if (!webBaseUrl || !webBaseUrl.trim()) {
    throw new Error('buildPostShareUrl: webBaseUrl is required');
  }
  const trimmed = webBaseUrl.replace(/\/+$/, '');
  return `${trimmed}/post/${encodeURIComponent(postId.trim())}`;
}

// Read EXPO_PUBLIC_WEB_BASE_URL directly at the call site (Metro inlines
// `process.env.EXPO_PUBLIC_*` ONLY at literal call sites — passing
// `process.env` through a parameter loses the inline). Caller hands us the
// already-read value; we trim + default.
export function resolveWebBaseUrl(env: { EXPO_PUBLIC_WEB_BASE_URL?: string | undefined }): string {
  const raw = env.EXPO_PUBLIC_WEB_BASE_URL;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim().replace(/\/+$/, '');
  }
  return DEFAULT_WEB_BASE_URL;
}

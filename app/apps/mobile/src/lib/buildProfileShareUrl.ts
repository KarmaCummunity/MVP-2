// FR-PROFILE-008 — pure URL builder for the profile share link. Returns the
// canonical `${webBaseUrl}/user/<handle>` URL that the in-app deep link, the
// universal link, and the share message all resolve to. Never references
// Supabase. Mirrors `buildPostShareUrl` (FR-POST-023).

export function buildProfileShareUrl(handle: string, webBaseUrl: string): string {
  if (!handle || !handle.trim()) {
    throw new Error('buildProfileShareUrl: handle is required');
  }
  if (!webBaseUrl || !webBaseUrl.trim()) {
    throw new Error('buildProfileShareUrl: webBaseUrl is required');
  }
  const trimmed = webBaseUrl.replace(/\/+$/, '');
  return `${trimmed}/user/${encodeURIComponent(handle.trim())}`;
}

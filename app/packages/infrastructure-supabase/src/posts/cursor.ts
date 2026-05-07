export interface FeedCursor {
  createdAt: string; // ISO8601
}

// Opaque cursor — URL-safe encoding works in both Node and React Native (Hermes
// has no global Buffer; the previous base64url path crashed at runtime in mobile).
export function encodeCursor(cursor: FeedCursor): string {
  return encodeURIComponent(JSON.stringify(cursor));
}

export function decodeCursor(raw: string | undefined): FeedCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<FeedCursor>;
    if (!parsed.createdAt || typeof parsed.createdAt !== 'string') return null;
    if (Number.isNaN(Date.parse(parsed.createdAt))) return null;
    return { createdAt: parsed.createdAt };
  } catch {
    return null;
  }
}

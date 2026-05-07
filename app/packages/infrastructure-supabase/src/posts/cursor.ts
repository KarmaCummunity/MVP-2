export interface FeedCursor {
  createdAt: string; // ISO8601
}

export function encodeCursor(cursor: FeedCursor): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeCursor(raw: string | undefined): FeedCursor | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as Partial<FeedCursor>;
    if (!parsed.createdAt || typeof parsed.createdAt !== 'string') return null;
    if (Number.isNaN(Date.parse(parsed.createdAt))) return null;
    return { createdAt: parsed.createdAt };
  } catch {
    return null;
  }
}

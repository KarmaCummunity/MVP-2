export interface SavedPostsCursor {
  savedAt: string;
}

export function encodeSavedPostsCursor(cursor: SavedPostsCursor): string {
  return encodeURIComponent(JSON.stringify(cursor));
}

export function decodeSavedPostsCursor(raw: string | undefined): SavedPostsCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<SavedPostsCursor>;
    if (!parsed.savedAt || typeof parsed.savedAt !== 'string') return null;
    if (Number.isNaN(Date.parse(parsed.savedAt))) return null;
    return { savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

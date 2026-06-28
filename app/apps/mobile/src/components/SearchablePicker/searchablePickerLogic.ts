// Pure logic for SearchablePicker — extracted so it is unit-testable in a
// node-environment vitest run (the project has no jsdom). The JSX shell
// composes these helpers; their behavior is fully covered here.

export interface SearchablePickerItemDescriptor {
  readonly id: string;
  readonly name: string;
}

/** Apply the caller-provided match predicate to a (possibly null) item list. */
export function filterItems<T>(
  items: readonly T[] | null | undefined,
  query: string,
  match: (item: T, q: string) => boolean,
): readonly T[] {
  if (!items) return [];
  const q = query.trim();
  if (!q) return items;
  return items.filter((it) => match(it, q));
}

/**
 * Decide whether to render the free-text fallback row. The row exists only
 * when (a) the caller opted in, (b) the user typed something non-empty, and
 * (c) the typed text does not already match a canonical row's display name.
 */
export function shouldShowFreeTextRow<T>(args: {
  readonly allowFreeText: boolean | undefined;
  readonly query: string;
  readonly items: readonly T[] | null | undefined;
  readonly renderRow: (item: T) => SearchablePickerItemDescriptor;
}): boolean {
  if (!args.allowFreeText) return false;
  const trimmed = args.query.trim();
  if (trimmed.length === 0) return false;
  if (!args.items) return true; // no canonical list — free text is the only option
  return !args.items.some((it) => args.renderRow(it).name === trimmed);
}

/**
 * Map a free-text query to the selection payload the picker emits. Empty `id`
 * signals "no canonical match"; callers persist the verbatim `name`.
 */
export function freeTextSelection(query: string): SearchablePickerItemDescriptor {
  return { id: '', name: query.trim() };
}

// researchDraft — persists an in-progress public-research submission to
// localStorage so a browser refresh / accidental reload does not wipe the
// visitor's answers (FR-RESEARCH-001). Web-only: every entry point no-ops
// cleanly where window/localStorage is unavailable (native, SSR, tests).
//
// The draft is keyed by survey slug and tagged with the bundle version, so a
// republished survey (new question set) never restores answers keyed to old
// question ids. Drafts older than the TTL are treated as abandoned.

export type ResearchDraftAnswer = { rating: number | null; answerText: string | null };

export type ResearchDraft = {
  version: number;
  activeIndex: number;
  answers: Record<string, ResearchDraftAnswer>;
  contactEmail: string;
  contactWindowHe: string;
  savedAt: number;
};

export type ResearchDraftInput = Omit<ResearchDraft, 'savedAt'>;

const KEY_PREFIX = 'kc-research-draft-';
// Drafts untouched for longer than this are considered abandoned and ignored.
const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ?? null;
  } catch {
    // Safari private mode and some embedded webviews throw on access.
    return null;
  }
}

function keyFor(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
}

function isAnswerMap(value: unknown): value is Record<string, ResearchDraftAnswer> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function loadResearchDraft(
  slug: string,
  version: number,
  now: number = Date.now(),
): ResearchDraft | null {
  const store = storage();
  if (!store || !slug) return null;
  try {
    const raw = store.getItem(keyFor(slug));
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<ResearchDraft> | null;
    if (!draft || typeof draft !== 'object') return null;
    if (draft.version !== version) return null; // stale question set — discard
    if (!isAnswerMap(draft.answers)) return null;
    if (typeof draft.savedAt === 'number' && now - draft.savedAt > DRAFT_TTL_MS) {
      return null; // abandoned
    }
    return {
      version,
      activeIndex: typeof draft.activeIndex === 'number' ? draft.activeIndex : 0,
      answers: draft.answers,
      contactEmail: typeof draft.contactEmail === 'string' ? draft.contactEmail : '',
      contactWindowHe: typeof draft.contactWindowHe === 'string' ? draft.contactWindowHe : '',
      savedAt: typeof draft.savedAt === 'number' ? draft.savedAt : now,
    };
  } catch {
    return null;
  }
}

export function saveResearchDraft(
  slug: string,
  draft: ResearchDraftInput,
  now: number = Date.now(),
): void {
  const store = storage();
  if (!store || !slug) return;
  try {
    store.setItem(keyFor(slug), JSON.stringify({ ...draft, savedAt: now }));
  } catch {
    // Quota / private-mode write failures are non-fatal: the visitor keeps
    // their in-memory session, just without the refresh safety net.
  }
}

export function clearResearchDraft(slug: string): void {
  const store = storage();
  if (!store || !slug) return;
  try {
    store.removeItem(keyFor(slug));
  } catch {
    // ignore
  }
}

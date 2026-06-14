import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearResearchDraft,
  loadResearchDraft,
  saveResearchDraft,
  type ResearchDraftInput,
} from '../researchDraft';

function makeMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
    _map: map,
  };
}

const SLUG = 'alt-platforms-research';

const sampleDraft: ResearchDraftInput = {
  version: 1,
  activeIndex: 3,
  answers: {
    'q-1': { rating: 5, answerText: 'בערך' },
    'q-2': { rating: null, answerText: null },
  },
  contactEmail: 'a@b.com',
  contactWindowHe: 'אחה"צ',
};

describe('researchDraft', () => {
  let store: ReturnType<typeof makeMemoryStorage>;

  beforeEach(() => {
    store = makeMemoryStorage();
    vi.stubGlobal('window', { localStorage: store });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a saved draft for the matching slug + version', () => {
    saveResearchDraft(SLUG, sampleDraft, 1000);
    const loaded = loadResearchDraft(SLUG, 1, 2000);
    expect(loaded).not.toBeNull();
    expect(loaded!.activeIndex).toBe(3);
    expect(loaded!.answers['q-1']).toEqual({ rating: 5, answerText: 'בערך' });
    expect(loaded!.contactEmail).toBe('a@b.com');
    expect(loaded!.contactWindowHe).toBe('אחה"צ');
    expect(loaded!.savedAt).toBe(1000);
  });

  it('discards a draft whose version no longer matches the live bundle', () => {
    saveResearchDraft(SLUG, sampleDraft, 1000);
    expect(loadResearchDraft(SLUG, 2, 2000)).toBeNull();
  });

  it('discards a draft older than the TTL', () => {
    saveResearchDraft(SLUG, sampleDraft, 0);
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    expect(loadResearchDraft(SLUG, 1, fifteenDaysMs)).toBeNull();
  });

  it('clears a stored draft', () => {
    saveResearchDraft(SLUG, sampleDraft, 1000);
    clearResearchDraft(SLUG);
    expect(loadResearchDraft(SLUG, 1, 2000)).toBeNull();
  });

  it('returns null when nothing is stored', () => {
    expect(loadResearchDraft(SLUG, 1, 2000)).toBeNull();
  });

  it('returns null and never throws when window/localStorage is absent', () => {
    vi.stubGlobal('window', undefined);
    expect(() => saveResearchDraft(SLUG, sampleDraft)).not.toThrow();
    expect(loadResearchDraft(SLUG, 1)).toBeNull();
    expect(() => clearResearchDraft(SLUG)).not.toThrow();
  });

  it('survives corrupt JSON in storage', () => {
    store.setItem('kc-research-draft-' + SLUG, '{not json');
    expect(loadResearchDraft(SLUG, 1, 2000)).toBeNull();
  });
});

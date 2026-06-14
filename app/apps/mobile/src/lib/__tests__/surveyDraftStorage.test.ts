import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSurveyDraft,
  loadSurveyDraft,
  saveSurveyDraft,
  type SurveyDraftInput,
} from '../surveyDraftStorage';

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

const NS = 'survey';
const SLUG = 'ux-experience';

const sampleDraft: SurveyDraftInput = {
  version: 1,
  activeIndex: 3,
  answers: {
    'q-1': { rating: 5, answerText: 'בערך' },
    'q-2': { rating: null, answerText: 'טקסט בלי דירוג' },
  },
};

describe('surveyDraftStorage', () => {
  let store: ReturnType<typeof makeMemoryStorage>;

  beforeEach(() => {
    store = makeMemoryStorage();
    vi.stubGlobal('window', { localStorage: store });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a saved draft for the matching namespace + slug + version', () => {
    saveSurveyDraft(NS, SLUG, sampleDraft, 1000);
    const loaded = loadSurveyDraft(NS, SLUG, 1, 2000);
    expect(loaded).not.toBeNull();
    expect(loaded!.activeIndex).toBe(3);
    expect(loaded!.answers['q-1']).toEqual({ rating: 5, answerText: 'בערך' });
    // text-only (unrated) answers are preserved too — the in-app bug this fixes
    expect(loaded!.answers['q-2']).toEqual({ rating: null, answerText: 'טקסט בלי דירוג' });
    expect(loaded!.savedAt).toBe(1000);
  });

  it('isolates drafts by namespace (same slug, different surface)', () => {
    saveSurveyDraft('survey', SLUG, sampleDraft, 1000);
    expect(loadSurveyDraft('research', SLUG, 1, 2000)).toBeNull();
    expect(loadSurveyDraft('survey', SLUG, 1, 2000)).not.toBeNull();
  });

  it('keeps the research key backward-compatible (kc-research-draft-<slug>)', () => {
    saveSurveyDraft('research', 'alt-platforms-research', sampleDraft, 1000);
    expect(store.getItem('kc-research-draft-alt-platforms-research')).not.toBeNull();
  });

  it('discards a draft whose version no longer matches the live bundle', () => {
    saveSurveyDraft(NS, SLUG, sampleDraft, 1000);
    expect(loadSurveyDraft(NS, SLUG, 2, 2000)).toBeNull();
  });

  it('discards a draft older than the TTL', () => {
    saveSurveyDraft(NS, SLUG, sampleDraft, 0);
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    expect(loadSurveyDraft(NS, SLUG, 1, fifteenDaysMs)).toBeNull();
  });

  it('clears a stored draft', () => {
    saveSurveyDraft(NS, SLUG, sampleDraft, 1000);
    clearSurveyDraft(NS, SLUG);
    expect(loadSurveyDraft(NS, SLUG, 1, 2000)).toBeNull();
  });

  it('returns null when nothing is stored', () => {
    expect(loadSurveyDraft(NS, SLUG, 1, 2000)).toBeNull();
  });

  it('returns null and never throws when window/localStorage is absent', () => {
    vi.stubGlobal('window', undefined);
    expect(() => saveSurveyDraft(NS, SLUG, sampleDraft)).not.toThrow();
    expect(loadSurveyDraft(NS, SLUG, 1)).toBeNull();
    expect(() => clearSurveyDraft(NS, SLUG)).not.toThrow();
  });

  it('survives corrupt JSON in storage', () => {
    store.setItem('kc-survey-draft-' + SLUG, '{not json');
    expect(loadSurveyDraft(NS, SLUG, 1, 2000)).toBeNull();
  });
});

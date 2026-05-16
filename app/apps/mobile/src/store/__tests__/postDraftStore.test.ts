import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: (k: string) => Promise.resolve(store.get(k) ?? null),
      setItem: (k: string, v: string) => Promise.resolve(void store.set(k, v)),
      removeItem: (k: string) => Promise.resolve(void store.delete(k)),
    },
  };
});

import {
  usePostDraftStore,
  readDraftForOwner,
  type PostDraftPayload,
} from '../postDraftStore';

const sample: PostDraftPayload = {
  ownerId: 'user-A',
  updatedAt: 1_700_000_000,
  type: 'Give',
  title: 'Couch',
  description: '',
  category: 'Furniture',
  condition: 'Good',
  urgency: '',
  locationDisplayLevel: 'CityAndStreet',
  visibility: 'Public',
  hideFromCounterparty: false,
  uploads: [],
};

beforeEach(() => {
  usePostDraftStore.getState().clearDraft();
});

describe('usePostDraftStore', () => {
  it('starts with no draft', () => {
    expect(usePostDraftStore.getState().draft).toBeNull();
  });

  it('setDraft persists the full payload', () => {
    usePostDraftStore.getState().setDraft(sample);
    expect(usePostDraftStore.getState().draft).toEqual(sample);
  });

  it('clearDraft removes the persisted payload', () => {
    usePostDraftStore.getState().setDraft(sample);
    usePostDraftStore.getState().clearDraft();
    expect(usePostDraftStore.getState().draft).toBeNull();
  });

  it('overwriting setDraft replaces the previous draft cleanly', () => {
    usePostDraftStore.getState().setDraft(sample);
    const next: PostDraftPayload = { ...sample, title: 'Lamp', updatedAt: sample.updatedAt + 1 };
    usePostDraftStore.getState().setDraft(next);
    expect(usePostDraftStore.getState().draft).toEqual(next);
  });
});

describe('readDraftForOwner — AC5 per-user scoping', () => {
  it('returns null and leaves store untouched when no draft is persisted', () => {
    expect(readDraftForOwner('user-A')).toBeNull();
    expect(usePostDraftStore.getState().draft).toBeNull();
  });

  it('returns the draft when ownerId matches', () => {
    usePostDraftStore.getState().setDraft(sample);
    expect(readDraftForOwner('user-A')).toEqual(sample);
    expect(usePostDraftStore.getState().draft).toEqual(sample);
  });

  it('clears the persisted draft on ownerId mismatch', () => {
    usePostDraftStore.getState().setDraft(sample);
    expect(readDraftForOwner('user-B')).toBeNull();
    expect(usePostDraftStore.getState().draft).toBeNull();
  });

  it('clears the persisted draft when no current user is signed in', () => {
    usePostDraftStore.getState().setDraft(sample);
    expect(readDraftForOwner(undefined)).toBeNull();
    expect(usePostDraftStore.getState().draft).toBeNull();
  });
});

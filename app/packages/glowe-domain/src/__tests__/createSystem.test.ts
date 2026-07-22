import { describe, it, expect } from 'vitest';
import {
  createMenuState,
  validateEventDraft,
  normalizeEventDraft,
  validateOfferPostDraft,
  normalizeOfferPostDraft,
  isOpenOffer,
} from '../createSystem';

describe('createMenuState', () => {
  it('anon viewers get the sign-in state and no types', () => {
    const state = createMenuState(false, null);
    expect(state.state).toBe('anon');
    expect(state.types).toHaveLength(0);
  });

  it('unapproved organizations are view-only', () => {
    const pending = createMenuState(true, {
      accountType: 'organization',
      approvalStatus: 'pending',
    });
    expect(pending.state).toBe('unverified');
    const rejected = createMenuState(true, {
      accountType: 'organization',
      approvalStatus: 'rejected',
    });
    expect(rejected.state).toBe('unverified');
  });

  it('approved organizations create post / event / opportunity / need', () => {
    const state = createMenuState(true, {
      accountType: 'organization',
      approvalStatus: 'approved',
    });
    expect(state.state).toBe('ok');
    expect(state.types.map((t) => t.id)).toEqual([
      'post',
      'event',
      'opportunity',
      'need',
    ]);
  });

  it('individuals create post / need / offer', () => {
    const state = createMenuState(true, {
      accountType: 'individual',
      approvalStatus: 'not_required',
    });
    expect(state.types.map((t) => t.id)).toEqual(['post', 'need', 'offer']);
  });

  it('members without an account type yet get the individual set', () => {
    const state = createMenuState(true, {});
    expect(state.state).toBe('ok');
    expect(state.types.map((t) => t.id)).toEqual(['post', 'need', 'offer']);
  });
});

describe('validateEventDraft', () => {
  const base = { title: 'ניקיון חוף', start_at: '2026-08-01T10:00' };

  it('accepts a titled, dated draft', () => {
    expect(validateEventDraft(base).valid).toBe(true);
  });

  it('requires title and start date', () => {
    expect(validateEventDraft({ start_at: base.start_at }).valid).toBe(false);
    expect(validateEventDraft({ title: 'x' }).valid).toBe(false);
    expect(
      validateEventDraft({ ...base, start_at: 'not-a-date' }).valid,
    ).toBe(false);
  });

  it('rejects an end before the start and non-positive capacity', () => {
    expect(
      validateEventDraft({ ...base, end_at: '2026-07-01T10:00' }).valid,
    ).toBe(false);
    expect(validateEventDraft({ ...base, capacity: '0' }).valid).toBe(false);
    expect(validateEventDraft({ ...base, capacity: '25' }).valid).toBe(true);
  });
});

describe('normalizeEventDraft', () => {
  it('builds the glowe_opportunities event shape', () => {
    const row = normalizeEventDraft({
      title: ' ערב התנדבות ',
      organization: 'לב פתוח',
      start_at: '2026-08-01T10:00',
      event_type: 'digital',
      capacity: '12',
      registration_mode: 'open',
      location: 'Online',
    });
    expect(row.title).toBe('ערב התנדבות');
    expect(row.commitment).toBe('Event');
    expect(row.event_type).toBe('digital');
    expect(row.capacity).toBe(12);
    expect(row.registration_mode).toBe('open');
    expect(typeof row.start_at).toBe('string');
    expect(row.end_at).toBe(null);
  });

  it('defaults to physical + gated with unlimited capacity', () => {
    const row = normalizeEventDraft({
      title: 'x',
      start_at: '2026-08-01T10:00',
    });
    expect(row.event_type).toBe('physical');
    expect(row.registration_mode).toBe('gated');
    expect(row.capacity).toBe(null);
  });
});

describe('volunteer offer drafts', () => {
  it('validates headline + description', () => {
    expect(
      validateOfferPostDraft({ title: 'מעצב גרפי', text: '3 שעות בשבוע' })
        .valid,
    ).toBe(true);
    expect(validateOfferPostDraft({ title: 'x' }).valid).toBe(false);
    expect(validateOfferPostDraft({ text: 'y' }).valid).toBe(false);
  });

  it('normalizes to an open offer post', () => {
    const row = normalizeOfferPostDraft({
      title: ' עזרה בעיצוב ',
      text: 'בשמחה',
      impact_area: 'Education',
    });
    expect(row.post_type).toBe('offer');
    expect(row.status).toBe('open');
    expect(row.title).toBe('עזרה בעיצוב');
    expect(row.impact_area).toBe('Education');
  });

  it('isOpenOffer matches only open offer rows', () => {
    expect(isOpenOffer({ post_type: 'offer', status: 'open' })).toBe(true);
    expect(isOpenOffer({ post_type: 'offer', status: 'removed' })).toBe(false);
    expect(isOpenOffer({ post_type: 'wish', status: 'open' })).toBe(false);
    expect(isOpenOffer(null)).toBe(false);
  });
});

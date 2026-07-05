import { describe, it, expect } from 'vitest';
import GloweModeration from '../glowe-moderation.js';

describe('canonicalTargetType', () => {
  it('maps wish and offer cards to the post target', () => {
    expect(GloweModeration.canonicalTargetType('wish')).toBe('post');
    expect(GloweModeration.canonicalTargetType('offer')).toBe('post');
  });

  it('passes DB-native types through', () => {
    expect(GloweModeration.canonicalTargetType('opportunity')).toBe('opportunity');
    expect(GloweModeration.canonicalTargetType('profile')).toBe('profile');
  });

  it('falls back to general for unknown types', () => {
    expect(GloweModeration.canonicalTargetType('banana')).toBe('general');
    expect(GloweModeration.canonicalTargetType('')).toBe('general');
    expect(GloweModeration.canonicalTargetType(undefined)).toBe('general');
  });
});

describe('validateReportDraft', () => {
  it('accepts a known reason and a target', () => {
    expect(GloweModeration.validateReportDraft({ reason: 'spam', targetId: 'post-1' }).valid).toBe(true);
  });

  it('rejects an unknown or missing reason', () => {
    expect(GloweModeration.validateReportDraft({ reason: 'rude', targetId: 'x' }).valid).toBe(false);
    expect(GloweModeration.validateReportDraft({ targetId: 'x' }).valid).toBe(false);
  });

  it('rejects a missing target', () => {
    expect(GloweModeration.validateReportDraft({ reason: 'spam' }).valid).toBe(false);
  });
});

describe('buildReportPayload', () => {
  it('builds the 0226 column shape with a canonical target type', () => {
    const payload = GloweModeration.buildReportPayload({
      targetType: 'wish', targetId: 42, reason: 'spam', note: '  fishy  '
    });
    expect(payload).toEqual({ target_type: 'post', target_id: '42', reason: 'spam', note: 'fishy' });
  });

  it('collapses an empty note to null and caps at 2000 chars', () => {
    expect(GloweModeration.buildReportPayload({ targetType: 'post', targetId: 'a', reason: 'other', note: '  ' }).note).toBe(null);
    const long = 'x'.repeat(3000);
    expect(GloweModeration.buildReportPayload({ targetType: 'post', targetId: 'a', reason: 'other', note: long }).note.length).toBe(2000);
  });
});

describe('isDuplicateReportError', () => {
  it('detects the 23505 unique violation', () => {
    expect(GloweModeration.isDuplicateReportError({ code: '23505' })).toBe(true);
    expect(GloweModeration.isDuplicateReportError({ message: 'duplicate key value violates unique constraint' })).toBe(true);
  });

  it('ignores other errors and null', () => {
    expect(GloweModeration.isDuplicateReportError({ code: '42501', message: 'forbidden' })).toBe(false);
    expect(GloweModeration.isDuplicateReportError(null)).toBe(false);
  });
});

describe('admin queue mapping', () => {
  it('maps snake_case RPC rows and counts open reports', () => {
    const rows = [
      { id: '1', reporter_name: 'יעל', target_type: 'post', target_id: 'p1', reason: 'spam', status: 'open', created_at: '2026-07-01' },
      { id: '2', reporter_name: '', target_type: 'profile', target_id: 'u1', reason: 'fake_profile', status: 'dismissed' }
    ];
    const mapped = GloweModeration.mapAdminReportRows(rows);
    expect(mapped[0].reporterName).toBe('יעל');
    expect(mapped[1].reporterName).toBe('GloWe member');
    expect(GloweModeration.openReports(mapped)).toHaveLength(1);
  });
});

describe('canRemoveTarget / isRemovedContent', () => {
  it('only posts and opportunities are removable (wishes count as posts)', () => {
    expect(GloweModeration.canRemoveTarget('post')).toBe(true);
    expect(GloweModeration.canRemoveTarget('wish')).toBe(true);
    expect(GloweModeration.canRemoveTarget('opportunity')).toBe(true);
    expect(GloweModeration.canRemoveTarget('profile')).toBe(false);
    expect(GloweModeration.canRemoveTarget('general')).toBe(false);
  });

  it('flags removed rows', () => {
    expect(GloweModeration.isRemovedContent({ status: 'removed' })).toBe(true);
    expect(GloweModeration.isRemovedContent({ status: 'open' })).toBe(false);
    expect(GloweModeration.isRemovedContent(null)).toBe(false);
  });
});

describe('reportTargetHref', () => {
  it('links post / opportunity / profile targets', () => {
    expect(GloweModeration.reportTargetHref({ targetType: 'opportunity', targetId: 'o1' }, ''))
      .toBe('pages/opportunity.html?id=o1');
    expect(GloweModeration.reportTargetHref({ targetType: 'post', targetId: 'p1' }, ''))
      .toBe('pages/community.html?post=p1');
    expect(GloweModeration.reportTargetHref({ targetType: 'profile', targetId: 'u1' }, ''))
      .toBe('pages/profile.html?id=u1');
  });

  it('returns empty for unlinkable targets', () => {
    expect(GloweModeration.reportTargetHref({ targetType: 'general', targetId: 'site' }, '')).toBe('');
    expect(GloweModeration.reportTargetHref({ targetType: 'post', targetId: '' }, '')).toBe('');
  });
});

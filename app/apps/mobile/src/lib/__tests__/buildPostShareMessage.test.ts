import { describe, it, expect } from 'vitest';

import {
  buildPostShareMessage,
  type PostShareMessageInput,
  type ShareTranslate,
} from '../buildPostShareMessage';

// Echo-style translator: returns the key (with interpolated params inlined).
// Lets us assert which keys were looked up and the structural shape of the
// composed message without depending on the actual Hebrew strings.
const tEcho: ShareTranslate = (key, params) =>
  params ? `${key}|${JSON.stringify(params)}` : key;

// Fixture-style translator that returns Hebrew-ish copy so we can assert the
// final composed body reads end-to-end.
const tHe: ShareTranslate = (key) => {
  const table: Record<string, string> = {
    'post.detail.shareHeadlineGive': '🎁 חפץ שמחכה לבית חדש בקהילת קארמה',
    'post.detail.shareHeadlineRequest': '🔍 בקשה לעזרה מקהילת קארמה',
    'post.detail.shareCtaGive': 'אולי זה בדיוק בשבילכם — לחצו לפרטים 👇',
    'post.detail.shareCtaRequest': 'אם תוכלו לעזור — לחצו לפרטים 👇',
    'post.detail.shareLabelTitle': 'כותרת:',
    'post.detail.shareLabelDescription': 'תיאור:',
    'post.detail.shareLabelCategory': 'קטגוריה:',
    'post.detail.shareLabelLocation': 'מיקום:',
    'post.category.Furniture': 'רהיטים',
    'post.category.Books': 'ספרים',
    'post.category.Other': 'אחר',
  };
  return table[key] ?? key;
};

const GIVE_FIXTURE: PostShareMessageInput = {
  type: 'Give',
  title: 'כיסא נדנדה מעץ',
  description: 'בצבע חום בהיר, במצב מצוין, מחפש בית חדש לאחר 12 שנים אצלנו.',
  category: 'Furniture',
  cityName: 'תל אביב',
};

const REQUEST_FIXTURE: PostShareMessageInput = {
  type: 'Request',
  title: 'מחפש מיטת תינוק',
  description: null,
  category: 'BabyGear',
  cityName: 'ירושלים',
};

describe('buildPostShareMessage', () => {
  it('composes a full Give message with labeled, bold-marked fields and Give CTA', () => {
    const msg = buildPostShareMessage(GIVE_FIXTURE, tHe);
    expect(msg).toBe(
      [
        '🎁 חפץ שמחכה לבית חדש בקהילת קארמה',
        '',
        '*כותרת:* כיסא נדנדה מעץ',
        '*תיאור:* בצבע חום בהיר, במצב מצוין, מחפש בית חדש לאחר 12 שנים אצלנו.',
        '*קטגוריה:* רהיטים',
        '*מיקום:* תל אביב',
        '',
        'אולי זה בדיוק בשבילכם — לחצו לפרטים 👇',
      ].join('\n'),
    );
  });

  it('uses the Request headline + CTA when post.type === "Request"', () => {
    const msg = buildPostShareMessage(REQUEST_FIXTURE, tEcho);
    expect(msg).toContain('post.detail.shareHeadlineRequest');
    expect(msg).toContain('post.detail.shareCtaRequest');
    expect(msg).not.toContain('shareHeadlineGive');
    expect(msg).not.toContain('shareCtaGive');
  });

  it('omits the description label when description is null/empty/whitespace', () => {
    const cases: Array<PostShareMessageInput> = [
      { ...GIVE_FIXTURE, description: null },
      { ...GIVE_FIXTURE, description: '' },
      { ...GIVE_FIXTURE, description: '   ' },
    ];
    for (const post of cases) {
      const msg = buildPostShareMessage(post, tHe);
      expect(msg).not.toContain('*תיאור:*');
      // CTA still appears at the end.
      expect(msg.endsWith('אולי זה בדיוק בשבילכם — לחצו לפרטים 👇')).toBe(true);
    }
  });

  it('truncates a long description to 160 characters with an ellipsis', () => {
    const longDesc = 'א'.repeat(200);
    const msg = buildPostShareMessage({ ...GIVE_FIXTURE, description: longDesc }, tHe);
    expect(msg).toContain(`${'א'.repeat(159)}…`);
    expect(msg).not.toContain(`${'א'.repeat(200)}`);
  });

  it('keeps a short description verbatim (no ellipsis appended)', () => {
    const shortDesc = 'במצב מצוין';
    const msg = buildPostShareMessage({ ...GIVE_FIXTURE, description: shortDesc }, tHe);
    expect(msg).toContain(`*תיאור:* ${shortDesc}`);
    expect(msg).not.toContain('…');
  });

  it('omits the category line when category is "Other" (catch-all)', () => {
    const msg = buildPostShareMessage({ ...GIVE_FIXTURE, category: 'Other' }, tHe);
    expect(msg).not.toContain('*קטגוריה:*');
    // Location still rendered.
    expect(msg).toContain('*מיקום:* תל אביב');
  });

  it('includes the category line when it is anything but "Other"', () => {
    const msg = buildPostShareMessage({ ...GIVE_FIXTURE, category: 'Books' }, tHe);
    expect(msg).toContain('*קטגוריה:* ספרים');
  });

  it('trims whitespace from title and city before composition', () => {
    const msg = buildPostShareMessage(
      { ...GIVE_FIXTURE, title: '  כיסא נדנדה מעץ  ', cityName: ' תל אביב ' },
      tHe,
    );
    expect(msg).toContain('*כותרת:* כיסא נדנדה מעץ');
    expect(msg).toContain('*מיקום:* תל אביב');
    // No stray double-space from leading/trailing whitespace on the value.
    expect(msg).not.toContain('*כותרת:*  ');
    expect(msg).not.toContain('*מיקום:*  ');
  });

  it('always places the CTA on the last line', () => {
    const msg = buildPostShareMessage(GIVE_FIXTURE, tHe);
    const lines = msg.split('\n');
    expect(lines[lines.length - 1]).toBe('אולי זה בדיוק בשבילכם — לחצו לפרטים 👇');
  });
});

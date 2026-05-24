import { describe, expect, it } from 'vitest';
import { buildPostShareMessage, type PostShareMessageInput, type ShareTranslate } from '../buildPostShareMessage';

const t: ShareTranslate = (key) => `t:${key}`;

function base(): PostShareMessageInput {
  return {
    type: 'Give',
    title: 'שולחן עץ',
    description: 'שולחן יד-שנייה במצב מצוין',
    category: 'Furniture',
    address: { cityName: 'תל אביב', street: 'דיזנגוף', streetNumber: '99' },
    locationDisplayLevel: 'CityOnly',
    postedAt: 'לפני יומיים',
  };
}

describe('buildPostShareMessage', () => {
  it('renders the Give headline + CTA when type is Give', () => {
    const msg = buildPostShareMessage(base(), t);
    expect(msg.startsWith('t:post.detail.shareHeadlineGive')).toBe(true);
    expect(msg).toContain('t:post.detail.shareCtaGive');
    expect(msg).not.toContain('t:post.detail.shareHeadlineRequest');
  });

  it('renders the Request headline + CTA when type is Request', () => {
    const msg = buildPostShareMessage({ ...base(), type: 'Request' }, t);
    expect(msg).toContain('t:post.detail.shareHeadlineRequest');
    expect(msg).toContain('t:post.detail.shareCtaRequest');
  });

  it('wraps every label in bold asterisks', () => {
    const msg = buildPostShareMessage(base(), t);
    expect(msg).toContain('*t:post.detail.shareLabelTitle* שולחן עץ');
    expect(msg).toContain('*t:post.detail.shareLabelDescription* שולחן יד-שנייה במצב מצוין');
    expect(msg).toContain('*t:post.detail.shareLabelLocation* תל אביב');
    expect(msg).toContain('*t:post.detail.shareLabelCategory*');
    expect(msg).toContain('*t:post.detail.shareLabelPostedAt* לפני יומיים');
  });

  it('omits the description line when description is null', () => {
    const msg = buildPostShareMessage({ ...base(), description: null }, t);
    expect(msg).not.toContain('shareLabelDescription');
  });

  it('omits the description line when description is empty/whitespace', () => {
    const msg = buildPostShareMessage({ ...base(), description: '   ' }, t);
    expect(msg).not.toContain('shareLabelDescription');
  });

  it('truncates description longer than 200 chars with an ellipsis', () => {
    const long = 'א'.repeat(250);
    const msg = buildPostShareMessage({ ...base(), description: long }, t);
    const descLine = msg.split('\n').find((l) => l.includes('shareLabelDescription')) ?? '';
    expect(descLine.endsWith('…')).toBe(true);
    expect(descLine.length).toBeLessThanOrEqual('*t:post.detail.shareLabelDescription* '.length + 200);
  });

  it('always includes the category line, even for Other', () => {
    const msg = buildPostShareMessage({ ...base(), category: 'Other' }, t);
    expect(msg).toContain('*t:post.detail.shareLabelCategory* t:post.category.Other');
  });

  it('renders city only when locationDisplayLevel is CityOnly', () => {
    const msg = buildPostShareMessage({ ...base(), locationDisplayLevel: 'CityOnly' }, t);
    expect(msg).toContain('*t:post.detail.shareLabelLocation* תל אביב');
    expect(msg).not.toContain('דיזנגוף');
    expect(msg).not.toContain('99');
  });

  it('renders city + street when locationDisplayLevel is CityAndStreet', () => {
    const msg = buildPostShareMessage({ ...base(), locationDisplayLevel: 'CityAndStreet' }, t);
    expect(msg).toContain('תל אביב, t:post.detail.streetPrefix דיזנגוף');
    expect(msg).not.toContain('99');
  });

  it('renders full address when locationDisplayLevel is Full', () => {
    const msg = buildPostShareMessage({ ...base(), locationDisplayLevel: 'Full' }, t);
    expect(msg).toContain('תל אביב, דיזנגוף 99');
  });

  it('places the URL on its own final line when included via the consumer', () => {
    const msg = buildPostShareMessage(base(), t);
    // The composer does not append the URL itself — that is the caller's
    // responsibility. We assert the composer ends with the CTA so the caller
    // can append `\n${url}`.
    expect(msg.endsWith('t:post.detail.shareCtaGive')).toBe(true);
  });
});

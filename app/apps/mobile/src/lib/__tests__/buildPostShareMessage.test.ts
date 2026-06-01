import { describe, expect, it } from 'vitest';
import { buildPostShareMessage, type PostShareMessageInput, type ShareTranslate } from '../buildPostShareMessage';

const t: ShareTranslate = (key) => `t:${key}`;

function base(overrides: Partial<PostShareMessageInput> = {}): PostShareMessageInput {
  return {
    type: 'Give',
    status: 'open',
    title: 'שולחן עץ',
    description: 'שולחן יד-שנייה במצב מצוין',
    category: 'Furniture',
    address: { cityName: 'תל אביב', street: 'דיזנגוף', streetNumber: '99' },
    locationDisplayLevel: 'CityOnly',
    postedAt: 'לפני יומיים',
    publisherLabel: 'דנה',
    ...overrides,
  };
}

describe('buildPostShareMessage', () => {
  it('renders the Give open headline + CTA when type is Give and status is open', () => {
    const msg = buildPostShareMessage(base(), t);
    expect(msg.startsWith('t:post.detail.shareHeadlineGiveOpen')).toBe(true);
    expect(msg).toContain('t:post.detail.shareCtaGiveOpen');
    expect(msg).not.toContain('t:post.detail.shareHeadlineGiveClosed');
  });

  it('renders the Give closed headline + CTA when status is closed_delivered', () => {
    const msg = buildPostShareMessage({ ...base(), status: 'closed_delivered' }, t);
    expect(msg).toContain('t:post.detail.shareHeadlineGiveClosed');
    expect(msg).toContain('t:post.detail.shareCtaGiveClosed');
  });

  it('renders the Request open headline + CTA when type is Request', () => {
    const msg = buildPostShareMessage({ ...base(), type: 'Request' }, t);
    expect(msg).toContain('t:post.detail.shareHeadlineRequestOpen');
    expect(msg).toContain('t:post.detail.shareCtaRequestOpen');
  });

  it('renders the Request closed headline + CTA when type is Request and closed', () => {
    const msg = buildPostShareMessage({ ...base(), type: 'Request', status: 'closed_delivered' }, t);
    expect(msg).toContain('t:post.detail.shareHeadlineRequestClosed');
    expect(msg).toContain('t:post.detail.shareCtaRequestClosed');
  });

  it('includes a localized status line', () => {
    const openMsg = buildPostShareMessage(base(), t);
    expect(openMsg).toContain('*t:post.detail.shareLabelStatus* t:post.detail.statusOpen');

    const closedMsg = buildPostShareMessage({ ...base(), status: 'closed_delivered' }, t);
    expect(closedMsg).toContain('*t:post.detail.shareLabelStatus* t:post.detail.statusClosed');
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

  it('renders full address when locationDisplayLevel is FullAddress', () => {
    const msg = buildPostShareMessage({ ...base(), locationDisplayLevel: 'FullAddress' }, t);
    expect(msg).toContain('תל אביב, דיזנגוף 99');
  });

  it('ends with the lifecycle-specific CTA so the caller can append the URL', () => {
    const msg = buildPostShareMessage(base(), t);
    expect(msg.endsWith('t:post.detail.shareCtaGiveOpen')).toBe(true);
  });

  it('includes the publisher line for every post', () => {
    const msg = buildPostShareMessage(base({ publisherLabel: 'דנה' }), t);
    expect(msg).toContain('*t:post.detail.shareLabelPublisher* דנה');
  });

  it('shows anonymous publisher label when passed', () => {
    const msg = buildPostShareMessage(
      base({ publisherLabel: 't:post.detail.anonymousUser' }),
      t,
    );
    expect(msg).toContain('*t:post.detail.shareLabelPublisher* t:post.detail.anonymousUser');
  });

  it('includes counterparty only on closed posts with a label', () => {
    const openMsg = buildPostShareMessage(
      base({ counterpartyLabel: 'יוסי' }),
      t,
    );
    expect(openMsg).not.toContain('shareLabelCounterparty');

    const closedMsg = buildPostShareMessage(
      base({ status: 'closed_delivered', counterpartyLabel: 'יוסי' }),
      t,
    );
    expect(closedMsg).toContain('*t:post.detail.shareLabelCounterparty* יוסי');
  });

  it('omits counterparty when closed but label is empty', () => {
    const msg = buildPostShareMessage(
      base({ status: 'closed_delivered', counterpartyLabel: '   ' }),
      t,
    );
    expect(msg).not.toContain('shareLabelCounterparty');
  });
});

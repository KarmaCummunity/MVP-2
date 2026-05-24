// FR-POST-023 — composes the localized message body that accompanies the share
// URL. Pure function (no React, no i18next side-effects) so tests do not
// bootstrap the i18n runtime. Caller appends the URL on its own trailing
// line — keeping the URL outside this composer means platform branching in
// sharePost can pass the URL to Share.share's structured `url` field on Web
// while still embedding it inline on native, without duplicating composer
// logic per platform.
//
// Layout (one labeled line per field; labels wrapped in `*…*` so WhatsApp /
// Telegram / Signal render them bold):
//
//   <headline — type × open|closed>
//
//   *<publisherLabel>* <name|anonymous>
//   *<counterpartyLabel>* <name|anonymous>   <-- closed_delivered + marked recipient only
//   *<titleLabel>* <title>
//   *<descriptionLabel>* <description>    <-- omitted when null/empty
//   *<categoryLabel>* <category>          <-- always included, even "Other"
//   *<locationLabel>* <address>           <-- city / city+street / full per displayLevel
//   *<postedAtLabel>* <relativeTime>
//   *<statusLabel>* <open|closed status>
//
//   <CTA — type × open|closed>

const DESCRIPTION_MAX = 200;

export interface PostShareMessageInput {
  type: 'Give' | 'Request';
  status: 'open' | 'closed_delivered';
  title: string;
  description: string | null;
  /** Category enum value (e.g. `Furniture`, `Other`). */
  category: string;
  address: { cityName: string; street: string; streetNumber: string };
  locationDisplayLevel: 'CityOnly' | 'CityAndStreet' | 'FullAddress';
  /** Already-formatted relative time, e.g. "לפני יומיים". */
  postedAt: string;
  /** Resolved owner line (name, deleted fallback, or anonymous). */
  publisherLabel: string;
  /** Resolved counterparty when closed + marked recipient; omit for open posts. */
  counterpartyLabel?: string | null;
}

export type ShareTranslate = (key: string, params?: Record<string, string>) => string;

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}

function bold(label: string, value: string): string {
  return `*${label}* ${value}`;
}

function renderAddress(input: PostShareMessageInput, t: ShareTranslate): string {
  const city = input.address.cityName.trim();
  if (input.locationDisplayLevel === 'CityOnly') return city;
  if (input.locationDisplayLevel === 'CityAndStreet') {
    return `${city}, ${t('post.detail.streetPrefix')} ${input.address.street.trim()}`;
  }
  return `${city}, ${input.address.street.trim()} ${input.address.streetNumber.trim()}`;
}

function shareLifecycleSuffix(status: PostShareMessageInput['status']): 'Open' | 'Closed' {
  return status === 'closed_delivered' ? 'Closed' : 'Open';
}

function shareHeadlineKey(input: PostShareMessageInput): string {
  const suffix = shareLifecycleSuffix(input.status);
  return input.type === 'Give'
    ? `post.detail.shareHeadlineGive${suffix}`
    : `post.detail.shareHeadlineRequest${suffix}`;
}

function shareCtaKey(input: PostShareMessageInput): string {
  const suffix = shareLifecycleSuffix(input.status);
  return input.type === 'Give'
    ? `post.detail.shareCtaGive${suffix}`
    : `post.detail.shareCtaRequest${suffix}`;
}

function shareStatusValue(input: PostShareMessageInput, t: ShareTranslate): string {
  return input.status === 'closed_delivered'
    ? t('post.detail.statusClosed')
    : t('post.detail.statusOpen');
}

export function buildPostShareMessage(post: PostShareMessageInput, t: ShareTranslate): string {
  const headline = t(shareHeadlineKey(post));
  const cta = t(shareCtaKey(post));

  const lines: string[] = [headline, ''];
  lines.push(bold(t('post.detail.shareLabelPublisher'), post.publisherLabel));

  const counterparty = (post.counterpartyLabel ?? '').trim();
  if (post.status === 'closed_delivered' && counterparty !== '') {
    lines.push(bold(t('post.detail.shareLabelCounterparty'), counterparty));
  }

  lines.push(bold(t('post.detail.shareLabelTitle'), post.title.trim()));

  const description = (post.description ?? '').trim();
  if (description !== '') {
    lines.push(bold(t('post.detail.shareLabelDescription'), truncate(description, DESCRIPTION_MAX)));
  }

  lines.push(bold(t('post.detail.shareLabelCategory'), t(`post.category.${post.category}`)));
  lines.push(bold(t('post.detail.shareLabelLocation'), renderAddress(post, t)));
  lines.push(bold(t('post.detail.shareLabelPostedAt'), post.postedAt));
  lines.push(bold(t('post.detail.shareLabelStatus'), shareStatusValue(post, t)));

  lines.push('', cta);
  return lines.join('\n');
}

// FR-POST-023 — composes the Hebrew message body that accompanies the share
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
//   <headline>
//
//   *<titleLabel>* <title>
//   *<descriptionLabel>* <description>    <-- omitted when null/empty
//   *<categoryLabel>* <category>          <-- always included, even "Other"
//   *<locationLabel>* <address>           <-- city / city+street / full per displayLevel
//   *<postedAtLabel>* <relativeTime>
//
//   <CTA>

const DESCRIPTION_MAX = 200;

export interface PostShareMessageInput {
  type: 'Give' | 'Request';
  title: string;
  description: string | null;
  /** Category enum value (e.g. `Furniture`, `Other`). */
  category: string;
  address: { cityName: string; street: string; streetNumber: string };
  locationDisplayLevel: 'CityOnly' | 'CityAndStreet' | 'Full';
  /** Already-formatted relative time, e.g. "לפני יומיים". */
  postedAt: string;
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

export function buildPostShareMessage(post: PostShareMessageInput, t: ShareTranslate): string {
  const isGive = post.type === 'Give';
  const headline = t(isGive ? 'post.detail.shareHeadlineGive' : 'post.detail.shareHeadlineRequest');
  const cta = t(isGive ? 'post.detail.shareCtaGive' : 'post.detail.shareCtaRequest');

  const lines: string[] = [headline, ''];
  lines.push(bold(t('post.detail.shareLabelTitle'), post.title.trim()));

  const description = (post.description ?? '').trim();
  if (description !== '') {
    lines.push(bold(t('post.detail.shareLabelDescription'), truncate(description, DESCRIPTION_MAX)));
  }

  lines.push(bold(t('post.detail.shareLabelCategory'), t(`post.category.${post.category}`)));
  lines.push(bold(t('post.detail.shareLabelLocation'), renderAddress(post, t)));
  lines.push(bold(t('post.detail.shareLabelPostedAt'), post.postedAt));

  lines.push('', cta);
  return lines.join('\n');
}

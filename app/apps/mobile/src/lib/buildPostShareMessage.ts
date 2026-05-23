// FR-POST-023 — composes the Hebrew message body that accompanies the share
// URL. Pure function (no React, no i18next side-effects) so it's testable
// without bootstrapping the i18n runtime. The composition rules — what to
// include, in what order, with what truncation — live here, not in i18n
// templates, because the per-type / optional-field branching gets ugly
// when forced into a single mustache string.
//
// Layout (one labeled line per field — emphasised with WhatsApp / Telegram
// markdown `*…*` so the labels read bold on the dominant chat apps; SMS /
// iMessage that don't parse markdown still show readable plain text with
// visible asterisks):
//
//   <headline>
//
//   *<titleLabel>* <title>
//   *<descriptionLabel>* <description>   <-- omitted when empty
//   *<categoryLabel>* <category>         <-- omitted when "Other"
//   *<locationLabel>* <city>
//
//   <CTA>
//
// Labels are resolved through the `t` translator (see locale keys
// `post.detail.shareLabel*`); this file holds layout/composition only.

const DESCRIPTION_MAX = 160;

export interface PostShareMessageInput {
  type: 'Give' | 'Request';
  title: string;
  description: string | null;
  /** `Category` enum value (e.g. `Furniture`). Used for the secondary line. */
  category: string;
  cityName: string;
}

/** `t` mirrors the react-i18next signature shape — narrow on purpose. */
export type ShareTranslate = (key: string, params?: Record<string, string>) => string;

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}

function bold(label: string, value: string): string {
  return `*${label}* ${value}`;
}

export function buildPostShareMessage(post: PostShareMessageInput, t: ShareTranslate): string {
  const isGive = post.type === 'Give';
  const headline = t(isGive ? 'post.detail.shareHeadlineGive' : 'post.detail.shareHeadlineRequest');
  const cta = t(isGive ? 'post.detail.shareCtaGive' : 'post.detail.shareCtaRequest');

  // Block 1 — per-type headline + a blank line separating it from the body.
  const lines: string[] = [headline, ''];

  // Block 2 — labeled fields. Title is always present (Post invariant).
  lines.push(bold(t('post.detail.shareLabelTitle'), post.title.trim()));

  const description = (post.description ?? '').trim();
  if (description !== '') {
    lines.push(bold(t('post.detail.shareLabelDescription'), truncate(description, DESCRIPTION_MAX)));
  }

  // Category line is omitted for the catch-all `Other` so the share body
  // never renders the redundant "<categoryLabel> <otherCategoryName>" line.
  if (post.category && post.category !== 'Other') {
    lines.push(bold(t('post.detail.shareLabelCategory'), t(`post.category.${post.category}`)));
  }

  lines.push(bold(t('post.detail.shareLabelLocation'), post.cityName.trim()));

  // Block 3 — type-aware CTA. The trailing 👇 hints at the URL below.
  lines.push('', cta);

  return lines.join('\n');
}

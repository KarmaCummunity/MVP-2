// FR-POST-023 — composes the Hebrew message body that accompanies the share
// URL. Pure function (no React, no i18next side-effects) so it's testable
// without bootstrapping the i18n runtime. The composition rules — what to
// include, in what order, with what truncation — live here, not in i18n
// templates, because the per-type / optional-field branching gets ugly
// when forced into a single mustache string.

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

export function buildPostShareMessage(post: PostShareMessageInput, t: ShareTranslate): string {
  const isGive = post.type === 'Give';
  const headline = t(isGive ? 'post.detail.shareHeadlineGive' : 'post.detail.shareHeadlineRequest');
  const cta = t(isGive ? 'post.detail.shareCtaGive' : 'post.detail.shareCtaRequest');

  // Block 1 — headline (per-type cue + community context).
  const lines: string[] = [headline];

  // Block 2 — the post title on its own line so the recipient's eye lands on
  // it before the secondary metadata.
  lines.push('', post.title.trim());

  // Block 3 — location · category (single line). Category is omitted for the
  // catch-all `Other` so we never share something like "תל אביב · אחר".
  let locationLine = `📍 ${post.cityName.trim()}`;
  if (post.category && post.category !== 'Other') {
    locationLine += ` · ${t(`post.category.${post.category}`)}`;
  }
  lines.push(locationLine);

  // Block 4 — optional description preview. Truncated so social-app
  // previews stay scannable; we don't want a 500-char wall of text.
  const description = (post.description ?? '').trim();
  if (description !== '') {
    lines.push('', truncate(description, DESCRIPTION_MAX));
  }

  // Block 5 — type-aware CTA. The trailing 👇 hints at the URL below.
  lines.push('', cta);

  return lines.join('\n');
}

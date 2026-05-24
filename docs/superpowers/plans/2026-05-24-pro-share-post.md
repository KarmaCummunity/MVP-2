# Pro Share-Post Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement FR-POST-023 with a single canonical share URL (`https://karma-community-kc.com/post/<id>`) served end-to-end from the existing Railway web service — eliminating the Supabase-domain leak that caused the prior version to be reverted.

**Architecture:** Replace `serve dist --single` in the Dockerfile runtime stage with a ~60-LOC Hono server (`hono` + `@hono/node-server`) that branches on User-Agent for `/post/:id`: crawlers get an OG-meta stub built from a Supabase REST read; humans get the SPA `index.html`. Everything else stays static-file-served. Share message body is composed by a pure function with every relevant post field (title, description, category-always-incl-Other, full address per `locationDisplayLevel`, posted-at) and a once-only URL.

**Tech Stack:** React Native (Expo SDK 54), Expo Router, Hono 4 + `@hono/node-server` (new), `expo-file-system` (native binary attach), Zustand (in-memory redirect-intent store), vitest, Supabase REST (anon key, RLS-gated).

**Spec:** `docs/superpowers/specs/2026-05-24-pro-share-post-design.md` — read sections 3-12 before starting.

---

## File Structure

**Create:**
- `app/apps/mobile/src/lib/buildPostShareUrl.ts` — pure URL builder
- `app/apps/mobile/src/lib/buildPostShareMessage.ts` — pure message composer
- `app/apps/mobile/src/lib/sharePost.ts` — platform-aware share invocation
- `app/apps/mobile/src/lib/downloadPostImageForShare.ts` — native cache download
- `app/apps/mobile/src/lib/__tests__/buildPostShareUrl.test.ts`
- `app/apps/mobile/src/lib/__tests__/buildPostShareMessage.test.ts`
- `app/apps/mobile/src/lib/__tests__/sharePost.test.ts`
- `app/apps/mobile/src/store/redirectIntentStore.ts`
- `app/apps/mobile/src/store/__tests__/redirectIntentStore.test.ts`
- `app/apps/mobile/src/components/post/PostShareButton.tsx`
- `app/apps/mobile/web-server/server.mjs` — Hono entry
- `app/apps/mobile/web-server/package.json` — runtime deps (hono + @hono/node-server)
- `app/apps/mobile/web-server/server.test.mjs` — UA-branching + OG-meta integration tests
- `app/apps/mobile/web-server/README.md` — operator notes

**Modify:**
- `app/apps/mobile/package.json` — add `expo-file-system` runtime dep
- `app/apps/mobile/src/i18n/locales/he/modules/post.ts` — add share locale keys to `detail` block
- `app/apps/mobile/app/post/[id].tsx` — add `PostShareButton` next to `PostMenuButton` in headerRight
- `app/apps/mobile/src/components/AuthGate.tsx` — capture pathname before unauth redirect, consume after sign-in
- `app/.env.example` — add `EXPO_PUBLIC_WEB_BASE_URL`
- `Dockerfile` — runtime stage swaps `serve` for `node server.mjs`; build stage gains `EXPO_PUBLIC_WEB_BASE_URL` ARG/ENV
- `docs/SSOT/spec/04_posts.md` — replace FR-POST-023 section with new architecture
- `docs/SSOT/BACKLOG.md` — flip P2.33 to `✅ Done` (with new one-liner)
- `docs/SSOT/DECISIONS.md` — append `D-38`

---

## Branch + Commit Convention

Single PR. Branch from latest `origin/dev`:

```bash
git fetch origin
git switch -c feat/FR-POST-023-pro-share-post origin/dev
```

Each task ends with **one commit**. Conventional Commits, scope `posts` (or `infra` for Dockerfile/server). Reference `FR-POST-023` in the body when relevant. Examples in the steps below.

---

## Task 1: Pure URL builder

**Files:**
- Create: `app/apps/mobile/src/lib/buildPostShareUrl.ts`
- Test: `app/apps/mobile/src/lib/__tests__/buildPostShareUrl.test.ts`

- [ ] **Step 1.1 — Write the failing test**

Create `app/apps/mobile/src/lib/__tests__/buildPostShareUrl.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildPostShareUrl, resolveWebBaseUrl } from '../buildPostShareUrl';

describe('buildPostShareUrl', () => {
  it('joins the base url and the post id', () => {
    expect(buildPostShareUrl('abc-123', 'https://karma-community-kc.com')).toBe(
      'https://karma-community-kc.com/post/abc-123',
    );
  });

  it('strips trailing slashes from the base url', () => {
    expect(buildPostShareUrl('abc-123', 'https://karma-community-kc.com//')).toBe(
      'https://karma-community-kc.com/post/abc-123',
    );
  });

  it('url-encodes the post id', () => {
    expect(buildPostShareUrl('a b/c', 'https://kc.com')).toBe('https://kc.com/post/a%20b%2Fc');
  });

  it('throws on empty post id', () => {
    expect(() => buildPostShareUrl('', 'https://kc.com')).toThrow(/postId/);
  });

  it('throws on empty base url', () => {
    expect(() => buildPostShareUrl('abc', '')).toThrow(/webBaseUrl/);
  });
});

describe('resolveWebBaseUrl', () => {
  it('returns the env var when set', () => {
    expect(resolveWebBaseUrl({ EXPO_PUBLIC_WEB_BASE_URL: 'https://example.com' })).toBe(
      'https://example.com',
    );
  });

  it('strips trailing slashes from the env value', () => {
    expect(resolveWebBaseUrl({ EXPO_PUBLIC_WEB_BASE_URL: 'https://example.com///' })).toBe(
      'https://example.com',
    );
  });

  it('falls back to the production host when env is unset', () => {
    expect(resolveWebBaseUrl({})).toBe('https://karma-community-kc.com');
  });

  it('falls back when env is an empty string', () => {
    expect(resolveWebBaseUrl({ EXPO_PUBLIC_WEB_BASE_URL: '   ' })).toBe('https://karma-community-kc.com');
  });
});
```

- [ ] **Step 1.2 — Run, expect failure**

```bash
cd app && pnpm --filter @kc/mobile test src/lib/__tests__/buildPostShareUrl.test.ts
```

Expected: FAIL — module `../buildPostShareUrl` not found.

- [ ] **Step 1.3 — Implement**

Create `app/apps/mobile/src/lib/buildPostShareUrl.ts`:

```ts
// FR-POST-023 — pure URL builder for the share link. Returns the canonical
// `${webBaseUrl}/post/<id>` URL that the in-app deep link, the universal
// link, and the share message all resolve to. Never references Supabase.

const DEFAULT_WEB_BASE_URL = 'https://karma-community-kc.com';

export function buildPostShareUrl(postId: string, webBaseUrl: string): string {
  if (!postId || !postId.trim()) {
    throw new Error('buildPostShareUrl: postId is required');
  }
  if (!webBaseUrl || !webBaseUrl.trim()) {
    throw new Error('buildPostShareUrl: webBaseUrl is required');
  }
  const trimmed = webBaseUrl.replace(/\/+$/, '');
  return `${trimmed}/post/${encodeURIComponent(postId.trim())}`;
}

// Read EXPO_PUBLIC_WEB_BASE_URL directly at the call site (Metro inlines
// `process.env.EXPO_PUBLIC_*` ONLY at literal call sites — passing
// `process.env` through a parameter loses the inline). Caller hands us the
// already-read value; we trim + default.
export function resolveWebBaseUrl(env: { EXPO_PUBLIC_WEB_BASE_URL?: string | undefined }): string {
  const raw = env.EXPO_PUBLIC_WEB_BASE_URL;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim().replace(/\/+$/, '');
  }
  return DEFAULT_WEB_BASE_URL;
}
```

- [ ] **Step 1.4 — Run, expect pass**

```bash
cd app && pnpm --filter @kc/mobile test src/lib/__tests__/buildPostShareUrl.test.ts
```

Expected: 9 tests pass.

- [ ] **Step 1.5 — Commit**

```bash
git add app/apps/mobile/src/lib/buildPostShareUrl.ts app/apps/mobile/src/lib/__tests__/buildPostShareUrl.test.ts
git commit -m "feat(posts): pure share-url builder (FR-POST-023)"
```

---

## Task 2: i18n keys + share-message composer

**Files:**
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/post.ts`
- Create: `app/apps/mobile/src/lib/buildPostShareMessage.ts`
- Test: `app/apps/mobile/src/lib/__tests__/buildPostShareMessage.test.ts`

- [ ] **Step 2.1 — Add locale keys**

In `app/apps/mobile/src/i18n/locales/he/modules/post.ts`, locate the `detail: { ... }` block (around line 137). Add these keys inside that block:

```ts
    // FR-POST-023 — share post via link (P2.33).
    shareA11y: 'שתף את הפוסט',
    shareDialogTitle: 'שיתוף פוסט',
    shareHeadlineGive: '🎁 חפץ שמחכה לבית חדש בקהילת קארמה',
    shareHeadlineRequest: '🔍 בקשה לעזרה מקהילת קארמה',
    shareLabelTitle: 'כותרת:',
    shareLabelDescription: 'תיאור:',
    shareLabelCategory: 'קטגוריה:',
    shareLabelLocation: 'מיקום:',
    shareLabelPostedAt: 'פורסם:',
    shareCtaGive: 'אולי זה בדיוק בשבילכם — לחצו לפרטים 👇',
    shareCtaRequest: 'אם תוכלו לעזור — לחצו לפרטים 👇',
    shareCopiedToast: 'הקישור הועתק',
    shareFailedToast: 'השיתוף נכשל, נסה שוב.',
    shareStreetPrefix: 'רחוב',
```

(`shareStreetPrefix` may already exist as `streetPrefix` elsewhere in the `detail` block — if so, do not duplicate; reuse the existing key in the composer instead.)

- [ ] **Step 2.2 — Write the failing test**

Create `app/apps/mobile/src/lib/__tests__/buildPostShareMessage.test.ts`:

```ts
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
    expect(msg).toContain('תל אביב, t:post.detail.shareStreetPrefix דיזנגוף');
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
```

- [ ] **Step 2.3 — Run, expect failure**

```bash
cd app && pnpm --filter @kc/mobile test src/lib/__tests__/buildPostShareMessage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 2.4 — Implement composer**

Create `app/apps/mobile/src/lib/buildPostShareMessage.ts`:

```ts
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
    return `${city}, ${t('post.detail.shareStreetPrefix')} ${input.address.street.trim()}`;
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
```

- [ ] **Step 2.5 — Run, expect pass**

```bash
cd app && pnpm --filter @kc/mobile test src/lib/__tests__/buildPostShareMessage.test.ts
```

Expected: 11 tests pass.

- [ ] **Step 2.6 — Commit**

```bash
git add app/apps/mobile/src/lib/buildPostShareMessage.ts \
        app/apps/mobile/src/lib/__tests__/buildPostShareMessage.test.ts \
        app/apps/mobile/src/i18n/locales/he/modules/post.ts
git commit -m "feat(posts): structured share-message composer + locale keys (FR-POST-023)"
```

---

## Task 3: Native image download to OS cache

**Files:**
- Create: `app/apps/mobile/src/lib/downloadPostImageForShare.ts`
- Modify: `app/apps/mobile/package.json` — add `expo-file-system`

- [ ] **Step 3.1 — Add the dependency**

Find the `dependencies` block in `app/apps/mobile/package.json`. Add the line (sorted alphabetically; the lockfile already pins `expo-file-system@19.0.22` because the package is depended on transitively, so no install pass should change pnpm-lock.yaml shape — but it now becomes a direct dep so it survives `pnpm install --frozen-lockfile` in CI):

```json
    "expo-file-system": "~19.0.22",
```

Then refresh the lockfile and verify:

```bash
cd app && pnpm install --lockfile-only
git diff -- pnpm-lock.yaml
```

Expected: the diff shows only `expo-file-system` moving from a transitive entry to a direct dep entry under `@kc/mobile`. If the diff is larger than that, stop and investigate before committing.

- [ ] **Step 3.2 — Write the implementation directly (no unit test)**

`downloadPostImageForShare` is native-only (uses `expo-file-system`'s native runtime). It would require a heavy mock to unit-test, and its behavior is exercised end-to-end through `sharePost.test.ts` (Task 4). Direct implementation is acceptable for this shape.

Create `app/apps/mobile/src/lib/downloadPostImageForShare.ts`:

```ts
// FR-POST-023 — download the post's first image into the OS cache so
// `Share.share({ url: <fileUri> })` can attach the binary directly. Native-
// only: web uses Blob/File via fetch in `sharePost.ts`. Returns `null` (not
// throws) on any failure so the caller falls back to the URL-only share
// path instead of dropping the affordance entirely.

import { Platform } from 'react-native';

export type DownloadedImage = Readonly<{
  /** Local `file://` URI safe to pass to `Share.share({ url })`. */
  uri: string;
  /** MIME type derived from the URL extension (falls back to image/jpeg). */
  mimeType: string;
}>;

function extFromUrl(url: string): string {
  const cleaned = url.split('?')[0]!.split('#')[0]!;
  const dot = cleaned.lastIndexOf('.');
  if (dot < 0) return 'jpg';
  const ext = cleaned.slice(dot + 1).toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp' || ext === 'heic') {
    return ext;
  }
  return 'jpg';
}

function mimeFromExt(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

export async function downloadPostImageForShare(
  remoteUrl: string,
  postId: string,
): Promise<DownloadedImage | null> {
  if (Platform.OS === 'web') return null;
  if (!remoteUrl || !postId) return null;
  let FileSystem: typeof import('expo-file-system/legacy');
  try {
    // Lazy-require so vitest (node env, no expo native module) does not
    // choke when sharePost.ts is exercised through web-flow tests.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    FileSystem = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
  } catch {
    return null;
  }
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return null;
  const ext = extFromUrl(remoteUrl);
  // Deterministic filename so repeated shares of the same post reuse the
  // cached file instead of re-downloading on every tap.
  const safeId = postId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const target = `${cacheDir}kc-share-${safeId}.${ext}`;
  try {
    const result = await FileSystem.downloadAsync(remoteUrl, target);
    if (result.status < 200 || result.status >= 300) return null;
    return { uri: result.uri, mimeType: mimeFromExt(ext) };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3.3 — Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors. If `expo-file-system/legacy` types are missing, install missing types or use the non-legacy path (`expo-file-system` directly).

- [ ] **Step 3.4 — Commit**

```bash
git add app/apps/mobile/src/lib/downloadPostImageForShare.ts \
        app/apps/mobile/package.json \
        app/pnpm-lock.yaml
git commit -m "feat(posts): native cache download for share image (FR-POST-023)"
```

---

## Task 4: Platform-aware `sharePost`

**Files:**
- Create: `app/apps/mobile/src/lib/sharePost.ts`
- Test: `app/apps/mobile/src/lib/__tests__/sharePost.test.ts`

- [ ] **Step 4.1 — Write the failing test**

Create `app/apps/mobile/src/lib/__tests__/sharePost.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => {
  return {
    Platform: { OS: 'web' as 'web' | 'ios' | 'android' },
    Share: {
      share: vi.fn(),
      dismissedAction: 'dismissedAction',
      sharedAction: 'sharedAction',
    },
  };
});

vi.mock('../downloadPostImageForShare', () => ({
  downloadPostImageForShare: vi.fn(),
}));

import { Platform, Share } from 'react-native';
import { downloadPostImageForShare } from '../downloadPostImageForShare';
import { sharePost } from '../sharePost';

const baseInput = {
  postId: 'abc-123',
  title: 'שולחן עץ',
  message: 'body\nwithout url',
  webBaseUrl: 'https://karma-community-kc.com',
  remoteImageUrl: 'https://cdn.example.com/img.jpg',
};

describe('sharePost — web', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'web';
    vi.clearAllMocks();
  });

  it('calls navigator.share with files when Web Share Level 2 supports files', async () => {
    const blob = new Blob(['hi'], { type: 'image/jpeg' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
    vi.stubGlobal('fetch', fetchMock);
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { share, canShare });
    vi.stubGlobal('File', class File {
      constructor(public parts: unknown[], public name: string, public opts: unknown) {}
    });

    const outcome = await sharePost(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    expect(canShare).toHaveBeenCalled();
    expect(share).toHaveBeenCalledTimes(1);
    const arg = share.mock.calls[0][0];
    expect(arg.url).toBe('https://karma-community-kc.com/post/abc-123');
    expect(arg.files).toHaveLength(1);
  });

  it('falls back to text+url when canShare returns false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['']) }));
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(false);
    vi.stubGlobal('navigator', { share, canShare });
    vi.stubGlobal('File', class File {});

    const outcome = await sharePost(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = share.mock.calls[0][0];
    expect(arg.files).toBeUndefined();
    expect(arg.url).toBe('https://karma-community-kc.com/post/abc-123');
    expect(arg.text).toBe('body\nwithout url');
  });

  it('returns dismissed when navigator.share throws AbortError', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('cancelled'), { name: 'AbortError' }));
    vi.stubGlobal('navigator', { share });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const outcome = await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(outcome).toEqual({ kind: 'dismissed' });
  });

  it('falls back to clipboard when navigator.share is missing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const outcome = await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(outcome).toEqual({ kind: 'copied' });
    expect(writeText).toHaveBeenCalledWith('https://karma-community-kc.com/post/abc-123');
  });

  it('returns failed when no share api is available', async () => {
    vi.stubGlobal('navigator', {});

    const outcome = await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(outcome.kind).toBe('failed');
  });
});

describe('sharePost — ios', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'ios';
    vi.clearAllMocks();
  });

  it('attaches the local file via url and embeds the share url in message', async () => {
    (downloadPostImageForShare as ReturnType<typeof vi.fn>).mockResolvedValue({
      uri: 'file:///cache/img.jpg',
      mimeType: 'image/jpeg',
    });
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    const outcome = await sharePost(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBe('file:///cache/img.jpg');
    expect(arg.message).toContain('body\nwithout url');
    expect(arg.message).toContain('https://karma-community-kc.com/post/abc-123');
    // URL appears exactly once in the message body.
    const occurrences = (arg.message.match(/karma-community-kc/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('omits the url field when image download fails', async () => {
    (downloadPostImageForShare as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    const outcome = await sharePost(baseInput);

    expect(outcome).toEqual({ kind: 'shared' });
    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBeUndefined();
    expect(arg.message).toContain('https://karma-community-kc.com/post/abc-123');
  });

  it('omits the url field when remoteImageUrl is not provided', async () => {
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(downloadPostImageForShare).not.toHaveBeenCalled();
    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBeUndefined();
  });
});

describe('sharePost — android', () => {
  beforeEach(() => {
    (Platform as { OS: string }).OS = 'android';
    vi.clearAllMocks();
  });

  it('never passes the url field, even when an image is present', async () => {
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'sharedAction' });

    await sharePost(baseInput);

    const arg = (Share.share as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.url).toBeUndefined();
    expect(arg.message).toContain('https://karma-community-kc.com/post/abc-123');
    // Crucial regression — RN's Android Share concatenates `url` onto
    // EXTRA_TEXT, surfacing the link twice in WhatsApp. The url field
    // must remain absent.
    const occurrences = (arg.message.match(/karma-community-kc/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('returns dismissed on dismissedAction', async () => {
    (Share.share as ReturnType<typeof vi.fn>).mockResolvedValue({ action: 'dismissedAction' });

    const outcome = await sharePost({ ...baseInput, remoteImageUrl: undefined });

    expect(outcome).toEqual({ kind: 'dismissed' });
  });
});
```

- [ ] **Step 4.2 — Run, expect failure**

```bash
cd app && pnpm --filter @kc/mobile test src/lib/__tests__/sharePost.test.ts
```

Expected: FAIL — module `../sharePost` not found.

- [ ] **Step 4.3 — Implement sharePost**

Create `app/apps/mobile/src/lib/sharePost.ts`:

```ts
// FR-POST-023 — share a post via the OS share sheet. Returns a discriminated
// union outcome; never throws. The share URL appears in the message body
// exactly once on every platform (the prior version's duplicated-link bug
// in WhatsApp came from RN's Android Share concatenating the `url` field
// onto EXTRA_TEXT after `message`).
//
//   iOS w/ image:  Share.share({ message: <text+url>, url: <fileUri>, title })
//   iOS no image:  Share.share({ message: <text+url>, title })
//   Android (any): Share.share({ message: <text+url>, title })            -- no url
//   Web w/ files:  navigator.share({ title, text, url, files: [imageFile] })
//   Web no files:  navigator.share({ title, text, url })
//   Web no share:  navigator.clipboard.writeText(url) → outcome 'copied'.

import { Platform, Share } from 'react-native';

import { buildPostShareUrl } from './buildPostShareUrl';
import { downloadPostImageForShare } from './downloadPostImageForShare';

export type PostShareInput = Readonly<{
  postId: string;
  title: string;
  message: string;
  webBaseUrl: string;
  /** Public URL of `mediaAssets[0]` when present. Omitted on no-media posts. */
  remoteImageUrl?: string;
}>;

export type SharePostOutcome =
  | { kind: 'shared' }
  | { kind: 'dismissed' }
  | { kind: 'copied' }
  | { kind: 'failed'; reason: string };

type WebShareNavigator = {
  share?: (data: { title?: string; text?: string; url?: string; files?: File[] }) => Promise<void>;
  canShare?: (data: { files?: File[] }) => boolean;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

async function fetchAsFile(remoteUrl: string, postId: string): Promise<File | null> {
  if (typeof fetch === 'undefined' || typeof File === 'undefined') return null;
  try {
    const resp = await fetch(remoteUrl);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const ext = (blob.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
    const safeId = postId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return new File([blob], `kc-share-${safeId}.${ext}`, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

async function shareWeb(
  input: PostShareInput,
  url: string,
  nav: WebShareNavigator | undefined,
): Promise<SharePostOutcome> {
  if (nav?.share) {
    let file: File | null = null;
    if (input.remoteImageUrl && input.remoteImageUrl.trim() !== '') {
      file = await fetchAsFile(input.remoteImageUrl, input.postId);
    }
    const filesPayload = file && (!nav.canShare || nav.canShare({ files: [file] })) ? [file] : undefined;
    try {
      if (filesPayload) {
        await nav.share({ title: input.title, text: input.message, url, files: filesPayload });
      } else {
        await nav.share({ title: input.title, text: input.message, url });
      }
      return { kind: 'shared' };
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'AbortError') return { kind: 'dismissed' };
    }
  }
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(url);
      return { kind: 'copied' };
    } catch (err) {
      return { kind: 'failed', reason: err instanceof Error ? err.message : 'clipboard_failed' };
    }
  }
  return { kind: 'failed', reason: 'no_share_api' };
}

export async function sharePost(input: PostShareInput): Promise<SharePostOutcome> {
  const url = buildPostShareUrl(input.postId, input.webBaseUrl);

  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as WebShareNavigator) : undefined;
    return shareWeb(input, url, nav);
  }

  // iOS attaches the image binary via the `url` field; the share URL lives
  // inline in `message`. Android never passes `url` because RN concatenates
  // it onto EXTRA_TEXT, surfacing the link twice in WhatsApp.
  let localImageUri: string | undefined;
  if (Platform.OS === 'ios' && input.remoteImageUrl && input.remoteImageUrl.trim() !== '') {
    const downloaded = await downloadPostImageForShare(input.remoteImageUrl, input.postId);
    localImageUri = downloaded?.uri;
  }

  try {
    const messageWithUrl = `${input.message}\n${url}`;
    if (localImageUri && Platform.OS === 'ios') {
      const result = await Share.share({
        message: messageWithUrl,
        url: localImageUri,
        title: input.title,
      });
      if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
      return { kind: 'shared' };
    }
    const result = await Share.share({ message: messageWithUrl, title: input.title });
    if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
    return { kind: 'shared' };
  } catch (err) {
    return { kind: 'failed', reason: err instanceof Error ? err.message : 'share_failed' };
  }
}
```

- [ ] **Step 4.4 — Run, expect pass**

```bash
cd app && pnpm --filter @kc/mobile test src/lib/__tests__/sharePost.test.ts
```

Expected: 10 tests pass. If any web test fails because `vi.stubGlobal` does not restore between cases, add `afterEach(() => vi.unstubAllGlobals())` at the top of each `describe`.

- [ ] **Step 4.5 — Commit**

```bash
git add app/apps/mobile/src/lib/sharePost.ts app/apps/mobile/src/lib/__tests__/sharePost.test.ts
git commit -m "feat(posts): platform-aware sharePost (FR-POST-023)"
```

---

## Task 5: Redirect intent store

**Files:**
- Create: `app/apps/mobile/src/store/redirectIntentStore.ts`
- Test: `app/apps/mobile/src/store/__tests__/redirectIntentStore.test.ts`

- [ ] **Step 5.1 — Write the failing test**

Create `app/apps/mobile/src/store/__tests__/redirectIntentStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { REDIRECT_INTENT_TTL_MS, isRestorablePath, useRedirectIntentStore } from '../redirectIntentStore';

describe('isRestorablePath', () => {
  it('accepts /post/, /user/, /chat/ paths', () => {
    expect(isRestorablePath('/post/abc-123')).toBe(true);
    expect(isRestorablePath('/user/handle')).toBe(true);
    expect(isRestorablePath('/chat/thread-1')).toBe(true);
  });

  it('rejects auth, onboarding, tabs paths', () => {
    expect(isRestorablePath('/(auth)/sign-in')).toBe(false);
    expect(isRestorablePath('/(onboarding)/photo')).toBe(false);
    expect(isRestorablePath('/(tabs)')).toBe(false);
    expect(isRestorablePath('/')).toBe(false);
    expect(isRestorablePath('')).toBe(false);
  });
});

describe('redirectIntentStore', () => {
  beforeEach(() => {
    useRedirectIntentStore.getState().clearPath();
  });

  it('captures a restorable path', () => {
    useRedirectIntentStore.getState().capturePath('/post/abc');
    expect(useRedirectIntentStore.getState().pendingPath).toBe('/post/abc');
  });

  it('ignores non-restorable paths', () => {
    useRedirectIntentStore.getState().capturePath('/(auth)/sign-in');
    expect(useRedirectIntentStore.getState().pendingPath).toBeNull();
  });

  it('consumePath returns the path and clears it', () => {
    useRedirectIntentStore.getState().capturePath('/post/abc');
    const out = useRedirectIntentStore.getState().consumePath();
    expect(out).toBe('/post/abc');
    expect(useRedirectIntentStore.getState().pendingPath).toBeNull();
  });

  it('consumePath returns null past the TTL', () => {
    const now = 1_000_000;
    useRedirectIntentStore.getState().capturePath('/post/abc', now);
    const out = useRedirectIntentStore.getState().consumePath(now + REDIRECT_INTENT_TTL_MS + 1);
    expect(out).toBeNull();
    expect(useRedirectIntentStore.getState().pendingPath).toBeNull();
  });

  it('capturing the same path twice is a no-op', () => {
    useRedirectIntentStore.getState().capturePath('/post/abc', 1000);
    useRedirectIntentStore.getState().capturePath('/post/abc', 9999);
    expect(useRedirectIntentStore.getState().capturedAtMs).toBe(1000);
  });

  it('clearPath wipes the pending intent', () => {
    useRedirectIntentStore.getState().capturePath('/post/abc');
    useRedirectIntentStore.getState().clearPath();
    expect(useRedirectIntentStore.getState().pendingPath).toBeNull();
  });
});
```

- [ ] **Step 5.2 — Run, expect failure**

```bash
cd app && pnpm --filter @kc/mobile test src/store/__tests__/redirectIntentStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 5.3 — Implement**

Create `app/apps/mobile/src/store/redirectIntentStore.ts`:

```ts
// FR-POST-023 AC6 — pending deep-link restoration after sign-in.
//
// When an unauthenticated user lands on `/post/<id>` (or any other deep
// link that AuthGate bounces to `(auth)`), capture the path here BEFORE the
// redirect. After the user completes sign-in (and onboarding), AuthGate
// consumes the captured path and navigates back to where they originally
// wanted to go.
//
// Not persisted — refreshing the app loses the intent, which is fine: a
// browser refresh re-reads the URL bar, and a native cold start usually
// happens long after the share-tap flow finished.

import { create } from 'zustand';

const INTENT_TTL_MS = 10 * 60 * 1000;

// Restorable path prefixes. Auth / onboarding / tabs are intentionally
// excluded so a half-captured intent never bounces the user out of the
// auth flow they just completed.
const RESTORABLE_PATH_PREFIXES = ['/post/', '/user/', '/chat/'];

export function isRestorablePath(path: string): boolean {
  if (typeof path !== 'string' || path === '') return false;
  return RESTORABLE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

interface RedirectIntentState {
  pendingPath: string | null;
  capturedAtMs: number | null;
  capturePath: (path: string, nowMs?: number) => void;
  /** Reads + clears the pending path if it is still within the TTL window. */
  consumePath: (nowMs?: number) => string | null;
  clearPath: () => void;
}

export const useRedirectIntentStore = create<RedirectIntentState>((set, get) => ({
  pendingPath: null,
  capturedAtMs: null,
  capturePath: (path, nowMs = Date.now()) => {
    if (!isRestorablePath(path)) return;
    if (get().pendingPath === path) return;
    set({ pendingPath: path, capturedAtMs: nowMs });
  },
  consumePath: (nowMs = Date.now()) => {
    const { pendingPath, capturedAtMs } = get();
    if (pendingPath === null || capturedAtMs === null) return null;
    if (nowMs - capturedAtMs > INTENT_TTL_MS) {
      set({ pendingPath: null, capturedAtMs: null });
      return null;
    }
    set({ pendingPath: null, capturedAtMs: null });
    return pendingPath;
  },
  clearPath: () => set({ pendingPath: null, capturedAtMs: null }),
}));

export const REDIRECT_INTENT_TTL_MS = INTENT_TTL_MS;
```

- [ ] **Step 5.4 — Run, expect pass**

```bash
cd app && pnpm --filter @kc/mobile test src/store/__tests__/redirectIntentStore.test.ts
```

Expected: 9 tests pass.

- [ ] **Step 5.5 — Commit**

```bash
git add app/apps/mobile/src/store/redirectIntentStore.ts app/apps/mobile/src/store/__tests__/redirectIntentStore.test.ts
git commit -m "feat(posts): redirect-intent store for post-login deep-link restore (FR-POST-023)"
```

---

## Task 6: PostShareButton component

**Files:**
- Create: `app/apps/mobile/src/components/post/PostShareButton.tsx`

- [ ] **Step 6.1 — Implement**

This component has heavy React-Native + theme dependencies; we cover its behavior end-to-end via the unit tests on the building blocks plus the manual smoke test. No new unit test in this task.

Create `app/apps/mobile/src/components/post/PostShareButton.tsx`:

```tsx
// FR-POST-023 (P2.33) — header share button on the post-detail screen.
// Visible to any viewer (owner or third party) on a Public + open post.
// Image presence is not required: Request posts without images still share
// (the OG server falls back to the generic community card).

import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import type { PostWithOwner } from '@kc/application';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { makeUseStyles, useTheme } from '@kc/ui';
import { resolveWebBaseUrl } from '../../lib/buildPostShareUrl';
import { sharePost } from '../../lib/sharePost';
import { buildPostShareMessage } from '../../lib/buildPostShareMessage';
import { useFeedSessionStore } from '../../store/feedSessionStore';

const POST_IMAGES_BUCKET = 'post-images';

interface Props {
  post: PostWithOwner;
}

export function PostShareButton({ post }: Props) {
  const { t } = useTranslation();
  const styles = usePostShareButtonStyles();
  const { colors } = useTheme();
  const showToast = useFeedSessionStore((s) => s.showEphemeralToast);
  const [busy, setBusy] = useState(false);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Metro inlines `process.env.EXPO_PUBLIC_*` ONLY at literal call
      // sites — passing process.env through a parameter loses the inline
      // (the bundle ships an empty object instead of the keys). Read the
      // env at the call site so Metro can resolve it statically.
      const webBaseUrl = resolveWebBaseUrl({
        EXPO_PUBLIC_WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL,
      });
      const postedAt = formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: dateFnsHe,
      });
      const message = buildPostShareMessage(
        {
          type: post.type,
          title: post.title,
          description: post.description,
          category: post.category,
          address: post.address,
          locationDisplayLevel: post.locationDisplayLevel,
          postedAt,
        },
        t,
      );
      const firstAsset = post.mediaAssets[0];
      const remoteImageUrl = firstAsset
        ? getSupabaseClient().storage.from(POST_IMAGES_BUCKET).getPublicUrl(firstAsset.path).data.publicUrl
        : undefined;
      const outcome = await sharePost({
        postId: post.postId,
        title: post.title,
        message,
        webBaseUrl,
        remoteImageUrl,
      });
      if (outcome.kind === 'copied') {
        showToast(t('post.detail.shareCopiedToast'), 'success', 1800);
      } else if (outcome.kind === 'failed') {
        showToast(t('post.detail.shareFailedToast'), 'error', 2200);
      }
    } catch (err) {
      console.warn('[PostShareButton] share failed', err);
      showToast(t('post.detail.shareFailedToast'), 'error', 2200);
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    post.postId,
    post.title,
    post.type,
    post.description,
    post.category,
    post.address,
    post.locationDisplayLevel,
    post.createdAt,
    post.mediaAssets,
    showToast,
    t,
  ]);

  if (!canSharePost(post)) return null;

  return (
    <Pressable
      style={styles.btn}
      onPress={() => void onPress()}
      disabled={busy}
      accessibilityLabel={t('post.detail.shareA11y')}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      hitSlop={8}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : (
        <Ionicons
          name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
          size={22}
          color={colors.textPrimary}
        />
      )}
    </Pressable>
  );
}

export function canSharePost(post: PostWithOwner): boolean {
  return post.status === 'open' && post.visibility === 'Public';
}

const usePostShareButtonStyles = makeUseStyles(() => ({
  btn: { padding: 4, marginEnd: 4 },
}));
```

- [ ] **Step 6.2 — Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors. If `PostWithOwner` does not expose `locationDisplayLevel` directly, check the existing helper `postLocationDisplayText` in `app/apps/mobile/app/post/[id].tsx:41-46` for the correct property path and update both the call site and the message-composer input shape accordingly.

- [ ] **Step 6.3 — Commit**

```bash
git add app/apps/mobile/src/components/post/PostShareButton.tsx
git commit -m "feat(posts): post-detail share button (FR-POST-023)"
```

---

## Task 7: Mount the share button on the post detail screen

**Files:**
- Modify: `app/apps/mobile/app/post/[id].tsx`
- Modify: `app/apps/mobile/app/post/postDetailScreen.styles.ts`

- [ ] **Step 7.1 — Add the import**

In `app/apps/mobile/app/post/[id].tsx`, add the import next to `PostMenuButton`:

```ts
import { PostMenuButton } from '../../src/components/post/PostMenuButton';
import { PostShareButton } from '../../src/components/post/PostShareButton';
```

- [ ] **Step 7.2 — Replace headerRight**

Find:

```tsx
<Stack.Screen options={{ headerRight: () => <PostMenuButton post={post} /> }} />
```

Replace with:

```tsx
<Stack.Screen
  options={{
    // Under forceRTL=true, the inner row visually flips so the *first*
    // child lands at the screen's right edge (= the corner). Share is
    // first so it sits in the corner, with the ⋮ menu to its left.
    headerRight: () => (
      <View style={styles.headerActions}>
        <PostShareButton post={post} />
        <PostMenuButton post={post} />
      </View>
    ),
  }}
/>
```

- [ ] **Step 7.3 — Add the row style**

In `app/apps/mobile/app/post/postDetailScreen.styles.ts`, add to the styles object (anywhere before the final `}`):

```ts
  headerActions: { flexDirection: 'row', alignItems: 'center' },
```

- [ ] **Step 7.4 — Update the file-level mapping comment**

Change line 2 of `app/apps/mobile/app/post/[id].tsx` from:

```ts
// Mapped to: FR-POST-014, FR-POST-015, FR-POST-021, FR-CHAT-004, FR-CHAT-005. Closes TD-32 / AUDIT-P2-09.
```

to:

```ts
// Mapped to: FR-POST-014, FR-POST-015, FR-POST-021, FR-POST-023, FR-CHAT-004, FR-CHAT-005. Closes TD-32 / AUDIT-P2-09.
```

- [ ] **Step 7.5 — Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors.

- [ ] **Step 7.6 — Commit**

```bash
git add app/apps/mobile/app/post/[id].tsx app/apps/mobile/app/post/postDetailScreen.styles.ts
git commit -m "feat(posts): mount share button in post detail header (FR-POST-023)"
```

---

## Task 8: Wire redirect-intent store into AuthGate

**Files:**
- Modify: `app/apps/mobile/src/components/AuthGate.tsx`

- [ ] **Step 8.1 — Add imports**

In `app/apps/mobile/src/components/AuthGate.tsx`, change:

```ts
import { useRouter, useSegments } from 'expo-router';
```

to:

```ts
import { useRouter, useSegments, usePathname, type Href } from 'expo-router';
```

Add this import alongside the other store imports:

```ts
import { useRedirectIntentStore } from '../store/redirectIntentStore';
```

- [ ] **Step 8.2 — Read store + pathname**

Inside the `AuthGate` function, after the existing hook reads (around the `useQueryClient` line), add:

```ts
  const pathname = usePathname();
  const capturePendingPath = useRedirectIntentStore((s) => s.capturePath);
  const consumePendingPath = useRedirectIntentStore((s) => s.consumePath);
```

- [ ] **Step 8.3 — Capture the path on the unauth redirect**

Find the unauth-redirect branch:

```ts
    if (!isAuthenticated) {
      if (
        !inAuthGroup &&
        !inGuestGroup &&
        !isOAuthCallback &&
        !isEmailVerify &&
        !isAccountBlocked &&
        !isAboutSurface
      ) {
        router.replace('/(auth)');
      }
      return;
    }
```

Replace with:

```ts
    if (!isAuthenticated) {
      if (
        !inAuthGroup &&
        !inGuestGroup &&
        !isOAuthCallback &&
        !isEmailVerify &&
        !isAccountBlocked &&
        !isAboutSurface
      ) {
        // FR-POST-023 AC6 — remember the deep-link target so we can restore
        // it after the user completes sign-in / onboarding.
        if (typeof pathname === 'string') capturePendingPath(pathname);
        router.replace('/(auth)');
      }
      return;
    }
```

- [ ] **Step 8.4 — Consume the path after sign-in completion**

Find the auth-completed redirect block:

```ts
    if (onboardingState === 'pending_basic_info' && basicInfoSkipped === true) {
      router.replace('/(tabs)');
    } else if (onboardingState === 'pending_basic_info') {
      router.replace('/(onboarding)/about-intro');
    } else if (onboardingState === 'pending_avatar') {
      router.replace('/(onboarding)/photo');
    } else {
      router.replace('/(tabs)');
    }
```

Replace with:

```ts
    if (onboardingState === 'pending_basic_info' && basicInfoSkipped === true) {
      // FR-POST-023 AC6 — restore a captured deep-link if the user signed in
      // straight through the basic-info skip path.
      const pending = consumePendingPath();
      router.replace((pending ?? '/(tabs)') as Href);
    } else if (onboardingState === 'pending_basic_info') {
      router.replace('/(onboarding)/about-intro');
    } else if (onboardingState === 'pending_avatar') {
      router.replace('/(onboarding)/photo');
    } else {
      const pending = consumePendingPath();
      router.replace((pending ?? '/(tabs)') as Href);
    }
```

- [ ] **Step 8.5 — Extend the effect deps**

Update the dependency array of the redirect-rules effect:

```ts
  }, [isLoading, isAuthenticated, onboardingState, basicInfoSkipped, segments, pathname, router, capturePendingPath, consumePendingPath]);
```

- [ ] **Step 8.6 — Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors.

- [ ] **Step 8.7 — Commit**

```bash
git add app/apps/mobile/src/components/AuthGate.tsx
git commit -m "feat(posts): capture + restore deep-link path through AuthGate (FR-POST-023)"
```

---

## Task 9: Hono web server (replaces `serve dist --single`)

**Files:**
- Create: `app/apps/mobile/web-server/package.json`
- Create: `app/apps/mobile/web-server/server.mjs`
- Create: `app/apps/mobile/web-server/server.test.mjs`
- Create: `app/apps/mobile/web-server/README.md`

- [ ] **Step 9.1 — Bootstrap the web-server package**

Create `app/apps/mobile/web-server/package.json`:

```json
{
  "name": "@kc/web-server",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "dependencies": {
    "hono": "^4.6.0",
    "@hono/node-server": "^1.14.0"
  },
  "scripts": {
    "test": "node --test server.test.mjs"
  }
}
```

- [ ] **Step 9.2 — Write the failing integration test**

Create `app/apps/mobile/web-server/server.test.mjs`:

```js
// Node-native test runner. Spins the Hono app instance directly (no socket
// server) and asserts UA branching + OG-meta rendering.

import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let DIST_DIR;
let app;
let fetchMock;

async function bootstrap(distDir) {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-test';
  process.env.APP_BASE_URL = 'https://karma-community-kc.com';
  process.env.WEB_DIST_DIR = distDir;
  const mod = await import(`./server.mjs?t=${Date.now()}`);
  return mod.createApp({ fetch: fetchMock });
}

before(async () => {
  DIST_DIR = await mkdir(join(tmpdir(), `kc-test-${Date.now()}`), { recursive: true });
  DIST_DIR = DIST_DIR ?? join(tmpdir(), `kc-test-${Date.now()}`);
  await writeFile(join(DIST_DIR, 'index.html'), '<!doctype html><html><body>SPA</body></html>', 'utf8');
  await writeFile(join(DIST_DIR, 'favicon.ico'), 'icon-bytes', 'utf8');
});

after(async () => {
  await rm(DIST_DIR, { recursive: true, force: true });
});

describe('GET /post/:id', () => {
  it('returns OG HTML with the post image for a WhatsApp crawler', async () => {
    fetchMock = mock.fn(async () =>
      new Response(
        JSON.stringify([
          {
            post_id: 'a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042',
            title: 'שולחן עץ',
            description: 'במצב מצוין',
            visibility: 'Public',
            status: 'open',
            media_assets: [{ path: 'foo/bar.jpg', ordinal: 0 }],
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /og:image/);
    assert.match(body, /foo\/bar\.jpg/);
    assert.match(body, /שולחן עץ/);
    assert.match(body, /https:\/\/karma-community-kc\.com\/post\/a3ee6f9d/);
    assert.doesNotMatch(body, /supabase\.co\/functions/);
  });

  it('returns the SPA index for a browser UA', async () => {
    fetchMock = mock.fn(); // should not be called for humans
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042', {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh)' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /SPA/);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('returns the generic OG card on invalid UUID', async () => {
    fetchMock = mock.fn();
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/not-a-uuid', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /og:image/);
    assert.match(body, /pwa-icon-512/);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('returns the generic OG card when Supabase returns no rows', async () => {
    fetchMock = mock.fn(async () =>
      new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    const body = await res.text();
    assert.match(body, /pwa-icon-512/);
  });

  it('returns the generic OG card when Supabase times out', async () => {
    fetchMock = mock.fn(async () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    });
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /pwa-icon-512/);
  });
});

describe('static + SPA fallback', () => {
  it('serves a static file when present', async () => {
    fetchMock = mock.fn();
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/favicon.ico');
    assert.equal(res.status, 200);
  });

  it('falls back to index.html for unknown routes (SPA refresh)', async () => {
    fetchMock = mock.fn();
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/donations');
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /SPA/);
  });
});
```

- [ ] **Step 9.3 — Install deps so the test can run**

```bash
cd app && pnpm install
```

Expected: pnpm adds `hono` and `@hono/node-server` to `@kc/web-server`. The lockfile gets entries for both.

- [ ] **Step 9.4 — Run, expect failure**

```bash
cd app/apps/mobile/web-server && node --test server.test.mjs
```

Expected: FAIL — `server.mjs` not found / `createApp` not exported.

- [ ] **Step 9.5 — Implement the server**

Create `app/apps/mobile/web-server/server.mjs`:

```js
// FR-POST-023 — Hono server that replaces `serve dist --single`.
// One canonical URL: https://karma-community-kc.com/post/<id>.
//
// Behaviour:
//   - GET /post/:id from a crawler UA  →  200 text/html OG stub built from a
//     Supabase REST read (anon key, RLS-gated to Public + open). Two-second
//     timeout; falls back to generic card on miss/failure.
//   - GET /post/:id from a human UA    →  200 text/html with the SPA index.
//   - Everything else                  →  static file from dist/ if present,
//                                          else SPA fallback to index.html.
//
// No Supabase domain ever appears in user-visible responses. The OG `og:url`
// + canonical link are always APP_BASE_URL/post/<id>.

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = process.env.WEB_DIST_DIR ?? resolve(here, 'dist');

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://karma-community-kc.com';
const APP_NAME = 'KC - קהילת קארמה';
const APP_TAGLINE = 'קהילת קארמה — נותנים ומבקשים מבלי לקנות.';
const STORAGE_BUCKET = 'post-images';
const FALLBACK_OG_IMAGE = `${APP_BASE_URL}/pwa-icon-512.png`;
const REST_TIMEOUT_MS = 2000;

const BOT_UA = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Slackbot|LinkedInBot|SkypeUriPreview|Discordbot|Applebot|googlebot|bingbot|Pinterest|redditbot|Embedly|vkShare/i;
const POST_UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const OG_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'public, max-age=300, s-maxage=300',
  'x-content-type-options': 'nosniff',
};

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function truncate(s, max) {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

function publicMediaUrl(path) {
  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  return `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${STORAGE_BUCKET}/${trimmed}`;
}

function renderOgHtml({ title, description, imageUrl, canonicalUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(imageUrl);
  const safeCanonical = escapeHtml(canonicalUrl);
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}" />
<link rel="canonical" href="${safeCanonical}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${escapeHtml(APP_NAME)}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:alt" content="${safeTitle}" />
<meta property="og:url" content="${safeCanonical}" />
<meta property="og:locale" content="he_IL" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${safeImage}" />
</head>
<body>
<noscript><a href="${safeCanonical}">${safeTitle}</a></noscript>
</body>
</html>`;
}

function renderGenericOg(canonicalUrl) {
  return renderOgHtml({
    title: APP_NAME,
    description: APP_TAGLINE,
    imageUrl: FALLBACK_OG_IMAGE,
    canonicalUrl,
  });
}

async function fetchPostForShare(postId, fetchImpl) {
  if (!POST_UUID.test(postId)) return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const url =
    `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/posts` +
    `?select=post_id,title,description,visibility,status,media_assets(path,ordinal)` +
    `&post_id=eq.${encodeURIComponent(postId)}` +
    `&visibility=eq.Public&status=eq.open&limit=1`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REST_TIMEOUT_MS);
  try {
    const resp = await fetchImpl(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        accept: 'application/json',
      },
      signal: ctrl.signal,
    });
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const row = rows[0];
    const media = Array.isArray(row.media_assets) ? row.media_assets : [];
    const first = media.slice().sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))[0];
    return {
      title: row.title,
      description: row.description ?? '',
      firstMediaPath: first?.path ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function readIndexHtml() {
  return readFile(resolve(DIST_DIR, 'index.html'), 'utf8');
}

export function createApp({ fetch: fetchImpl } = {}) {
  const f = fetchImpl ?? globalThis.fetch;
  const app = new Hono();

  app.get('/post/:id', async (c) => {
    const id = c.req.param('id');
    const ua = c.req.header('user-agent') ?? '';
    const canonicalUrl = `${APP_BASE_URL}/post/${encodeURIComponent(id)}`;
    if (!BOT_UA.test(ua)) {
      return c.html(await readIndexHtml());
    }
    if (!POST_UUID.test(id)) {
      return new Response(renderGenericOg(canonicalUrl), { status: 200, headers: OG_HEADERS });
    }
    const post = await fetchPostForShare(id, f);
    if (!post) {
      return new Response(renderGenericOg(canonicalUrl), { status: 200, headers: OG_HEADERS });
    }
    const imageUrl = post.firstMediaPath ? publicMediaUrl(post.firstMediaPath) : FALLBACK_OG_IMAGE;
    const body = renderOgHtml({
      title: truncate(post.title, 70),
      description: truncate((post.description || APP_TAGLINE).trim(), 200),
      imageUrl,
      canonicalUrl,
    });
    return new Response(body, { status: 200, headers: OG_HEADERS });
  });

  app.use('/*', serveStatic({ root: DIST_DIR }));
  app.get('*', async (c) => c.html(await readIndexHtml()));

  return app;
}

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);
  serve({ fetch: app.fetch, port });
  console.log(`[web-server] listening on :${port}, serving ${DIST_DIR}`);
}
```

- [ ] **Step 9.6 — Run, expect pass**

```bash
cd app/apps/mobile/web-server && node --test server.test.mjs
```

Expected: 7 tests pass. If `serveStatic` returns an unexpected status for missing files, ensure the `app.get('*')` SPA fallback is registered **after** `serveStatic`.

- [ ] **Step 9.7 — Write the operator README**

Create `app/apps/mobile/web-server/README.md`:

```md
# Web Server — Hono runtime for karma-community-kc.com

Replaces `serve dist --single`. Serves the Expo web bundle from `dist/`,
plus a tiny dynamic route at `/post/:id` that branches on User-Agent:

- Crawler (`WhatsApp`, `Twitterbot`, ...) → OG meta stub built from a
  Supabase REST read (anon key, RLS-gated to `Public + open` posts).
- Human UA → SPA `index.html`.
- Everything else → static file from `dist/`, SPA fallback to `index.html`.

## Required environment variables

| Var                  | Required | Purpose |
|----------------------|----------|---------|
| `SUPABASE_URL`       | yes      | REST endpoint host (no `EXPO_PUBLIC_` prefix — server-side). |
| `SUPABASE_ANON_KEY`  | yes      | Anon-key reads (RLS gates Public+open). |
| `APP_BASE_URL`       | no       | Defaults to `https://karma-community-kc.com`. Used for `og:url` + canonical link. |
| `PORT`               | no       | Defaults to `3000`. |
| `WEB_DIST_DIR`       | no       | Defaults to `./dist`. Overridable for tests. |

## Run locally

```bash
node server.mjs
```

## Tests

```bash
node --test server.test.mjs
```
```

- [ ] **Step 9.8 — Commit**

```bash
git add app/apps/mobile/web-server app/pnpm-lock.yaml
git commit -m "feat(infra): hono web-server with crawler OG meta for /post/:id (FR-POST-023)"
```

---

## Task 10: Switch Dockerfile runtime stage to the Hono server

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 10.1 — Replace the runtime stage**

Replace the Dockerfile content with:

```dockerfile
# syntax=docker/dockerfile:1.7
# Two-stage build: Expo web bundle → Node 20 Hono server.
# Designed for Railway, builds anywhere Docker runs.

# ─── Stage 1: install + build the web bundle ──────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

RUN corepack enable
COPY app /repo/app
WORKDIR /repo/app
RUN pnpm install --frozen-lockfile

# Every EXPO_PUBLIC_* the client reads at bundle time must be listed here;
# otherwise the builder stage never sees it and Metro inlines `undefined`.
ARG EXPO_PUBLIC_ENVIRONMENT
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_WEB_BASE_URL
ENV EXPO_PUBLIC_ENVIRONMENT=${EXPO_PUBLIC_ENVIRONMENT}
ENV EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY}
ENV EXPO_PUBLIC_WEB_BASE_URL=${EXPO_PUBLIC_WEB_BASE_URL}

RUN pnpm build:web

# ─── Stage 2: Hono server with OG meta + static SPA + SPA fallback ────
FROM node:20-alpine AS runner
WORKDIR /srv

# Server package brings hono + @hono/node-server only. Tiny dep surface.
COPY --from=builder /repo/app/apps/mobile/web-server/package.json ./package.json
RUN npm install --omit=dev

COPY --from=builder /repo/app/apps/mobile/web-server/server.mjs ./server.mjs
COPY --from=builder /repo/app/apps/mobile/dist ./dist

ENV PORT=3000
ENV WEB_DIST_DIR=/srv/dist
EXPOSE 3000

# SUPABASE_URL, SUPABASE_ANON_KEY, APP_BASE_URL are injected by Railway at runtime.
CMD ["node", "server.mjs"]
```

- [ ] **Step 10.2 — Build and run the image locally to smoke-test**

```bash
docker build \
  --build-arg EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL}" \
  --build-arg EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  --build-arg EXPO_PUBLIC_WEB_BASE_URL=https://karma-community-kc.com \
  -t kc-web:test .
docker run --rm -d \
  -e SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL}" \
  -e SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -e APP_BASE_URL=https://karma-community-kc.com \
  -p 3000:3000 --name kc-web-test kc-web:test
sleep 2
curl -sS -A 'Mozilla/5.0' http://localhost:3000/ | head -c 200
curl -sS -A 'WhatsApp/2.0' http://localhost:3000/post/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee | head -c 400
docker rm -f kc-web-test
```

Expected: first curl returns HTML containing the SPA bundle marker; second curl returns OG stub HTML (likely the generic card because the UUID is fake) with `og:image` pointing at `karma-community-kc.com/pwa-icon-512.png`. **Neither response should contain `supabase.co`.**

- [ ] **Step 10.3 — Commit**

```bash
git add Dockerfile
git commit -m "feat(infra): swap serve for hono runtime serving OG meta + SPA (FR-POST-023)"
```

---

## Task 11: Update `.env.example`

**Files:**
- Modify: `app/.env.example`

- [ ] **Step 11.1 — Add the new env**

At the top of `app/.env.example`, after the `EXPO_PUBLIC_SUPABASE_ANON_KEY` line, insert:

```
# Web host that serves the SPA + OG meta for shared posts (FR-POST-023).
# Used by the mobile app to build the share URL (`<host>/post/<id>`).
EXPO_PUBLIC_WEB_BASE_URL=https://karma-community-kc.com
```

- [ ] **Step 11.2 — Commit**

```bash
git add app/.env.example
git commit -m "chore: document EXPO_PUBLIC_WEB_BASE_URL (FR-POST-023)"
```

---

## Task 12: SSOT updates

**Files:**
- Modify: `docs/SSOT/spec/04_posts.md`
- Modify: `docs/SSOT/BACKLOG.md`
- Modify: `docs/SSOT/DECISIONS.md`

- [ ] **Step 12.1 — Replace FR-POST-023 in the posts spec**

In `docs/SSOT/spec/04_posts.md`, locate the existing FR-POST-023 section (if remnants survived the revert) or insert after FR-POST-022 / before the version table. Use this content:

```markdown
## FR-POST-023 — Share post via link with image preview

> **Status:** 🟡 In progress — ships under BACKLOG P2.33. Replaces the v0.9–v0.12 architecture (Supabase Edge Function) with a Hono web server on the same Railway service that serves the SPA — one canonical URL on `karma-community-kc.com`.

**Description.**
A signed-in viewer of a `Public`, `open` post may share a link to that post from the post-detail screen. The link is browsable to anyone (signed-in or not); social-media crawlers see an Open Graph card with the first post image, the post title, and the description; non-authenticated humans landing in the app are routed to the sign-in screen and, after sign-in, deep-linked back to the original post.

**Source.**
- Product request (2026-05-23). Re-scoped 2026-05-24 to eliminate the Supabase-domain leak observed in the prior shipped version.

**Acceptance Criteria.**
- AC1. The post-detail screen exposes a share affordance in the header — **in the trailing corner** (rightmost in RTL), with the existing ⋮ menu placed to its left — to **any** viewer (owner or third party) when `post.status === 'open'` AND `post.visibility === 'Public'`. Image presence is not required.
- AC2. Tapping the affordance opens the platform share sheet. The accompanying message body is composed per-post by `buildPostShareMessage` as a structured, scannable block of labeled lines (WhatsApp-style bold via `*…*`):
   1. `shareHeadlineGive` / `shareHeadlineRequest` (per-type cue) + blank line.
   2. `*כותרת:* <title>`.
   3. `*תיאור:* <description>` — truncated to 200 chars with `…`; whole line omitted when null/empty.
   4. `*קטגוריה:* <category>` — always included, even for `Other`.
   5. `*מיקום:* <address>` — `city`, `city + street`, or `city + street + number` per `locationDisplayLevel`.
   6. `*פורסם:* <relativeTime>` — date-fns relative format, Hebrew locale.
   7. Blank line, then `shareCtaGive` / `shareCtaRequest`.
   The share URL appears in the message body **exactly once** on every platform. iOS attaches the first image binary via the `url` field (`expo-file-system` cache download); Android never passes `url` (RN concatenates it onto EXTRA_TEXT, which is what caused the duplicated link in WhatsApp in the reverted version). Web uses `navigator.share({ files })` when Web Share Level 2 supports files; else `navigator.share({ title, text, url })`; else `navigator.clipboard.writeText(url)` with a Hebrew toast.
- AC3. The share URL is `https://karma-community-kc.com/post/<id>` — the same URL as the in-app deep link, the universal-link claim path, and the SPA route. There is **no** Supabase URL anywhere — neither as the user-visible URL, nor in a redirect chain, nor in WhatsApp's preview "via" line. Built from `EXPO_PUBLIC_WEB_BASE_URL` (defaults to `https://karma-community-kc.com` when unset).
- AC4. The Railway web service runs a Hono server (replaces `serve dist --single`) that, on `GET /post/:id` with a crawler UA, returns 200 `text/html` with `og:title`, `og:description`, `og:image`, `og:url`, `og:locale=he_IL`, `twitter:card=summary_large_image`. Non-`Public+open` posts, not-found, invalid UUIDs, and REST timeouts return a generic OG card pointing at the marketing landing — never the post's image or title.
- AC5. The same `GET /post/:id` from a human (UA not matching the BOT regex) returns the SPA `index.html`; Expo Router renders the post-detail screen.
- AC6. **Unauthenticated landing:** when an unauthenticated user follows `/post/<id>`, `AuthGate` captures the path before redirecting to `(auth)`, persists it in an in-memory store with a 10-minute TTL, and after sign-in / onboarding completion navigates to the captured path (`router.replace(pendingPath)`), then clears the intent. Refresh / app restart loses the intent, falling back to `(tabs)`.
- AC7. The OG image is the public Supabase Storage URL for `mediaAssets[0].path`. When the post has no media (e.g. Request posts without images), the OG image is `${APP_BASE_URL}/pwa-icon-512.png` (the 512×512 community logo bundled with the web app).
- AC8. The share action does not mutate post state, does not require a network round-trip on the client (the Hono server is hit only when the recipient opens the link), and emits no `audit_event` (read-only intent).

**Edge Cases.**
- Post deleted between share and link-open: crawler gets generic card (Hono REST filter excludes the row); human gets SPA → "not found" UX.
- Post closed between share and link-open: same as above (filter is `visibility=eq.Public&status=eq.open`).
- User offline at share time: OS share sheet still opens. Recipient's connectivity governs link resolution.
- Image download failure on iOS: fall back to URL-only share. OG preview on the recipient still renders the image.

**Related.** Screens: 2.3 (post detail). Domain: `Post.visibility`, `Post.status`. Cross-refs: `FR-POST-014` (viewer detail), `FR-AUTH-014` (guest entry), `TD-66` (deep-link manifests). Server: `app/apps/mobile/web-server/server.mjs`. Decision: `D-38`.
```

Then append a new row to the version table at the end of the file:

```markdown
| 0.13 | 2026-05-24 | `FR-POST-023` — re-architected to eliminate Supabase-domain leak. Hono server on the Railway web service replaces the Supabase Edge Function. One canonical URL `https://karma-community-kc.com/post/<id>` for share + deep link + SPA route. Share body adds `*פורסם:*` (relative time); category line is always included (incl. `Other`); address mirrors the post-detail screen's `locationDisplayLevel`. |
```

- [ ] **Step 12.2 — Update BACKLOG.md**

In `docs/SSOT/BACKLOG.md`, find the P2.33 row. Replace it with:

```markdown
| P2.33 | **Share post via link with image preview (FR-POST-023)** — header share button on post detail (Public + open); platform share via `Share.share` (native) / `navigator.share` + clipboard fallback (web); iOS attaches the first image binary via `expo-file-system`. Share URL is `https://karma-community-kc.com/post/<id>` — never `*.supabase.co`. Railway web service runs a Hono server that returns OG meta for crawlers on `/post/:id` and the SPA for humans, replacing `serve dist --single`. AuthGate captures pending deep-link before redirecting unauth users to `(auth)`, restores after sign-in. | agent-fullstack | ✅ Done | `spec/04_posts.md` FR-POST-023, `D-38` |
```

- [ ] **Step 12.3 — Add D-38 to DECISIONS.md**

Append to `docs/SSOT/DECISIONS.md`:

```markdown
## D-38 — Share-post OG meta is served by the Railway web server, not a Supabase Edge Function (2026-05-24)

**Decision.** The share URL is `https://karma-community-kc.com/post/<id>`, and the same URL serves both the OG meta stub (for crawler UAs) and the SPA `index.html` (for humans). The OG rendering logic lives in a Hono server that runs in the same Railway service as the existing web bundle, replacing `serve dist --single`. No Supabase Edge Function is involved in the share-link surface.

**Rationale.** The prior implementation (PRs #356–#366, reverted in `81b96d6`) routed crawlers + humans through `<ref>.supabase.co/functions/v1/share-post/<id>`. That URL appeared in user-visible share messages, in WhatsApp's preview-card "via" line, and in the redirect chain — undermining the "professional, branded" share UX the PM asked for. Layering a `kc.com/p/:id` 302-redirect on top via `serve.json` reduced the user-visible URL but did not eliminate the Supabase domain from the chain (or from the user-visible URL when `EXPO_PUBLIC_SHARE_BASE_URL` was misconfigured, which is what shipped). Moving OG rendering into the Railway server eliminates the entire class of bug at the architecture level: there is only one host, only one URL, and no redirect chain.

**Alternatives rejected.**
- *Supabase Custom Domain (Pro plan).* Requires paid plan; still ships with two URLs (share URL ≠ deep link) and a 302 redirect for humans.
- *Cloudflare Worker in front of Railway.* Adds a second deployment surface and depends on CF for the OG path. Overkill at current scale.
- *Pre-rendered static OG pages.* Would not survive post closure / deletion (stale OG card).

**Trade-offs accepted.** The Railway web service is now the critical path for `/post/<id>` crawler responses in addition to the SPA. Mitigated by the small Hono surface (one dynamic route), local + CI tests against the server, and the fact that any failure mode is the same as a general web-service outage (which is already monitored).
```

- [ ] **Step 12.4 — Commit**

```bash
git add docs/SSOT/spec/04_posts.md docs/SSOT/BACKLOG.md docs/SSOT/DECISIONS.md
git commit -m "docs(ssot): update FR-POST-023 + BACKLOG + DECISIONS for pro share-post (FR-POST-023)"
```

---

## Task 13: Full verification gate + PR

**Files:** none changed in this task.

- [ ] **Step 13.1 — Run the three gates from `app/`**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all three green. If `pnpm test` reports failures outside the new files, capture the failure and stop — do not push until they're green.

- [ ] **Step 13.2 — Run the server's node-native tests**

```bash
cd app/apps/mobile/web-server && node --test server.test.mjs
```

Expected: 7 tests pass.

- [ ] **Step 13.3 — Confirm no Supabase domain in any client-side code path**

```bash
cd /Users/navesarussi/Desktop/MVP-2
grep -rn "supabase\.co/functions\|SHARE_BASE_URL\|/p/:id" app/apps/mobile/src app/apps/mobile/app app/scripts || echo "clean"
```

Expected: prints `clean`. If anything matches, audit and remove.

- [ ] **Step 13.4 — Push and open PR**

```bash
git push -u origin HEAD
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(posts): pro share-post — canonical kc.com URL, no Supabase leak (FR-POST-023)" \
  --body-file - <<'EOF'
## Summary
Reimplements FR-POST-023 share-post from scratch with one canonical URL — `https://karma-community-kc.com/post/<id>` — for share, deep-link, universal-link, and SPA route. The reverted version (PRs #356–#366) exposed `<ref>.supabase.co/functions/v1/share-post/<id>` to WhatsApp recipients; this re-architecture eliminates the Supabase domain from every surface by moving OG rendering into a Hono server that runs in the same Railway service as the existing SPA.

## Mapped to spec
- FR-POST-023 — `docs/SSOT/spec/04_posts.md`
- D-38 — `docs/SSOT/DECISIONS.md`
- P2.33 — `docs/SSOT/BACKLOG.md`

## Changes
- New: `web-server/` (Hono entry, package, integration tests) replaces `serve dist --single` in the Dockerfile runtime stage.
- New: `buildPostShareUrl`, `buildPostShareMessage`, `sharePost`, `downloadPostImageForShare` libs with full vitest coverage.
- New: `redirectIntentStore` (Zustand, 10-min TTL) wired into `AuthGate` for post-login deep-link restore.
- New: `PostShareButton` in the post-detail header (trailing corner, ⋮ to its left), gated on `Public + open`.
- New: i18n keys `post.detail.share*` covering headlines, labels (incl. `sharePostedAt`), CTAs, toasts.
- New: `EXPO_PUBLIC_WEB_BASE_URL` env var; old `EXPO_PUBLIC_SHARE_BASE_URL` no longer referenced.
- New: `D-38` documenting the architecture choice.

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- `node --test web-server/server.test.mjs` ✅ (7 cases — UA branching, OG meta, static + SPA fallback, REST timeout)
- Manual: smoke on dev Railway after deploy — see SSOT spec §12 of the design doc for the manual checklist.

## SSOT updated
- [x] `BACKLOG.md` P2.33 → ✅ Done
- [x] `spec/04_posts.md` FR-POST-023 rewritten (v0.13)
- [x] `DECISIONS.md` D-38 added
- [x] `TECH_DEBT.md` — no new TDs

## Risk / rollout notes
The Railway web service now runs Hono instead of `serve`. Single dynamic route (`/post/:id`); everything else is static-file serving identical to today. Rollback = revert this PR. No DB migrations, no Supabase function changes.

## Screenshots
(Attach a WhatsApp screenshot from the manual smoke after the dev Railway deploy — see Step 13.5.)
EOF
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 13.5 — Manual smoke after CI green + dev deploy**

After the PR auto-merges and Railway redeploys the dev environment:

- Open a real `Public + open` post on a dev iOS build. Tap share. Send to a WhatsApp contact. Verify:
  - Preview shows the post image (or the community logo for no-media Request posts).
  - URL reads `https://karma-community-kc.com/post/<id>` — **not** `*.supabase.co`.
  - Link appears in the message body **exactly once**.
- Repeat on Android. Verify same.
- Open the same URL in a fresh incognito browser logged out → AuthGate redirects to `(auth)` → sign in → land on the post detail (not `(tabs)`).
- Tap the WhatsApp link on an iOS device with the app installed → universal link opens the app directly into the post.

If any of these fails, file a follow-up issue and patch in a follow-up PR.

---

## Self-Review Notes

**Spec coverage** — every AC in the spec maps to a task:
- AC1 (button placement + visibility) → Tasks 6, 7.
- AC2 (share invocation, message body, URL once) → Tasks 1, 2, 4.
- AC3 (URL on kc.com, no Supabase) → Tasks 1, 9, 10.
- AC4 (crawler OG meta) → Task 9.
- AC5 (human SPA) → Task 9.
- AC6 (unauth deep-link restore) → Tasks 5, 8.
- AC7 (image source) → Task 6 (caller), Task 9 (server).
- AC8 (no mutation, no network at share-time, no audit) → covered by sharePost's design (no Supabase writes, no API calls in the share path).

**Placeholder scan** — none.

**Type consistency** — `PostWithOwner` fields used: `postId`, `title`, `description`, `category`, `address`, `locationDisplayLevel`, `createdAt`, `mediaAssets`, `type`, `status`, `visibility`. All exist on the entity (Task 6.2 explicitly verifies via typecheck).

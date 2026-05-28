# Share Research Survey — Three-Surface Viral Channel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public research survey at `/research/alt-platforms-research` virally spreadable through three share surfaces (public thank-you page, public survey form header, in-app settings row), so non-registered users can forward the survey to other non-registered friends without forced signup.

**Architecture:** One shared utility `shareResearchSurvey.ts` (RN Share on native, Web Share API + clipboard fallback on web), called from three placements with different `?src=` values for funnel attribution. Mirrors the `sharePost.ts` discriminated-outcome pattern (FR-POST-023). No domain/application/infrastructure changes — pure FE addition.

**Tech Stack:** React Native + Expo Router, `Share.share` (native), `navigator.share` + `navigator.clipboard` (web), existing i18n modules (`research.ts`, `survey.ts`), vitest, existing analytics stub (TD-161).

**Design spec:** `docs/superpowers/specs/2026-05-28-in-app-share-research-survey-design.md`

**Mapped FR-IDs:** **FR-RESEARCH-004** — Share affordance for public research survey (three surfaces).

---

## File map (create / modify)

| Layer | Create | Modify |
|-------|--------|--------|
| SSOT | — | `docs/SSOT/spec/16_public_research.md` (add FR-RESEARCH-004), `docs/SSOT/BACKLOG.md` (new row) |
| Mobile lib | `app/apps/mobile/src/lib/shareResearchSurvey.ts`, `app/apps/mobile/src/lib/__tests__/shareResearchSurvey.test.ts` | `app/apps/mobile/src/lib/analytics.ts` (extend event union) |
| Mobile components | `app/apps/mobile/src/components/survey/ShareResearchRow.tsx` | — |
| Mobile routes | — | `app/apps/mobile/app/settings/surveys.tsx` (mount Row), `app/apps/mobile/app/research/thanks.web.tsx` (primary CTA), `app/apps/mobile/app/research/[slug].web.tsx` (header button) |
| Mobile i18n | — | `app/apps/mobile/src/i18n/locales/he/modules/research.ts` (new `share` sub-tree), `app/apps/mobile/src/i18n/locales/he/modules/survey.ts` (new `shareResearch` sub-tree) |

---

## Constraints (CLAUDE.md highlights)

- File-size cap ≤300 lines, indentation ≤3 levels (§5).
- No inline Hebrew strings — all user-visible text via `t('research.share.*')` or `t('survey.shareResearch.*')` (§8).
- Tests beside code in `__tests__/` directory using vitest (§5).
- The shared URL **must** include `?src=<placement-src>` for funnel attribution per `public.public_research_responses.source` CHECK constraint regex `^[a-z0-9_-]{1,32}$`. The three placement-src values: `share-thanks` (12 chars), `share-during-survey` (19 chars), `in-app-share-settings` (21 chars).
- Pre-push gates from `app/`: `pnpm typecheck && pnpm test && pnpm lint`. All must pass.
- Branch: `docs/FR-RESEARCH-004-share-design` already created off `origin/dev` with the spec commit on top. Implementation commits go on this branch.

---

### Task 1: SSOT — add FR-RESEARCH-004 block

**Files:**
- Modify: `docs/SSOT/spec/16_public_research.md` (append one FR block)
- Modify: `docs/SSOT/BACKLOG.md` (new row, status `🟡 In progress`)

- [ ] **Step 1: Add FR-RESEARCH-004 to `16_public_research.md`**

Open `docs/SSOT/spec/16_public_research.md`. After the FR-RESEARCH-003 block (which ends with the `AC4. Thank-you page...` line), append:

```markdown

---

## FR-RESEARCH-004 — Share affordance for public research survey

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. On `/research/thanks` (web-only), a share button labeled "שתפו את הסקר עם חבר/ה" renders as a primary CTA, visible immediately on page load (not gated by the 5-second visit-CTA reveal timer), alongside the existing "Visit Karma site" CTA.
- AC2. On `/research/[slug]` (web-only), a small share affordance — icon + label "שתפו" — renders in the screen header area, visible from page load, positioned so the question rows remain the visual focus.
- AC3. A row "שתפו את מחקר השוק עם חברים" renders at the top of `/settings/surveys` (all platforms), above the active-surveys list and above the free-feedback entry.
- AC4. Share flow: native iOS/Android uses `Share.share` (placement 3 only); web with `navigator.share` uses the Web Share API; web without uses `navigator.clipboard.writeText`. The flow never throws — it returns one of `{ kind: 'shared' | 'copied' | 'dismissed' | 'failed' }`.
- AC5. Shared URL is `${webBaseUrl}/research/alt-platforms-research?src=<placement-src>` where `<placement-src>` ∈ {`share-thanks`, `share-during-survey`, `in-app-share-settings`}. All three pass the CHECK regex `^[a-z0-9_-]{1,32}$`.
- AC6. The URL appears in the share message body exactly once on every platform (mirrors the FR-POST-023 fix).
- AC7. Recipients can open the link and submit answers without registration, login, or app install (already guaranteed by FR-RESEARCH-001 AC1-AC2; this AC asserts the invariant survives the new entry paths).
- AC8. Status feedback: `shared` → "הקישור שותף" (2.2s success), `copied` → "הקישור הועתק" (2.2s success), `failed` → "לא הצלחנו לשתף, נסה/י שוב" (2.2s error), `dismissed` → silent. On web placements 1 and 2 where no toast host is mounted, an inline status line below the button (auto-clearing after 2.2s) is acceptable.
- AC9. `track('research_share_initiated', { src, outcome })` fires on every share attempt. Production-noop today per TD-161; will produce data once analytics ingest lands.
```

- [ ] **Step 2: Update file-level status note in `16_public_research.md`**

The file's top status header currently reads `🟡 Code complete, post-merge QA pending`. Below that line, add:

```markdown
> **In progress:** FR-RESEARCH-004 (share affordance) — three viral surfaces (public thank-you page, public survey header, in-app Settings row) to make the survey self-spreading among non-registered users.
```

- [ ] **Step 3: Add BACKLOG row**

Open `docs/SSOT/BACKLOG.md`. Find the P1 priority block (where P1.7 `FR-RESEARCH-001..003` lives). Pick the next free `P1.NN` (likely `P1.8`). Append, matching the existing column count and format of the P1.7 row:

```
| P1.8 | FR-RESEARCH-004 — Share affordance for public research survey (3 surfaces: thanks page primary CTA, survey form header button, in-app Settings row; 3 ?src= values for attribution) | agent-fe | 🟡 In progress | spec/16_public_research.md; design: superpowers/specs/2026-05-28-in-app-share-research-survey-design.md | Extends FR-RESEARCH-001..003 |
```

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/spec/16_public_research.md docs/SSOT/BACKLOG.md
git commit -m "$(cat <<'EOF'
docs(ssot): add FR-RESEARCH-004 share affordance — three viral surfaces

Mapped to spec: FR-RESEARCH-004. Refactor logged: NA.

Adds the spec for three share surfaces on the public market-research
survey. The anonymous-fill side (FR-RESEARCH-001..003) is already
shipped; this FR covers the share affordances that make the survey
spread among non-registered users.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `shareResearchSurvey` utility + tests (TDD)

**Files:**
- Create: `app/apps/mobile/src/lib/shareResearchSurvey.ts`
- Create: `app/apps/mobile/src/lib/__tests__/shareResearchSurvey.test.ts`

Mirrors `app/apps/mobile/src/lib/sharePost.ts` shape: never throws, returns a discriminated-union outcome. Takes `src` as input so attribution is set by the caller.

- [ ] **Step 1: Write the failing test file**

Create `app/apps/mobile/src/lib/__tests__/shareResearchSurvey.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockShare = vi.fn();
const mockSharedAction = 'sharedAction';
const mockDismissedAction = 'dismissedAction';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Share: {
    share: (...args: unknown[]) => mockShare(...args),
    sharedAction: mockSharedAction,
    dismissedAction: mockDismissedAction,
  },
}));

import {
  shareResearchSurvey,
  buildResearchShareUrl,
  RESEARCH_SHARE_SRC_THANKS,
  RESEARCH_SHARE_SRC_DURING_SURVEY,
  RESEARCH_SHARE_SRC_SETTINGS,
  RESEARCH_SHARE_SLUG,
} from '../shareResearchSurvey';

describe('shareResearchSurvey — constants', () => {
  it('exposes all three src constants matching the source CHECK regex', () => {
    const re = /^[a-z0-9_-]{1,32}$/;
    expect(RESEARCH_SHARE_SRC_THANKS).toBe('share-thanks');
    expect(RESEARCH_SHARE_SRC_DURING_SURVEY).toBe('share-during-survey');
    expect(RESEARCH_SHARE_SRC_SETTINGS).toBe('in-app-share-settings');
    expect(re.test(RESEARCH_SHARE_SRC_THANKS)).toBe(true);
    expect(re.test(RESEARCH_SHARE_SRC_DURING_SURVEY)).toBe(true);
    expect(re.test(RESEARCH_SHARE_SRC_SETTINGS)).toBe(true);
  });

  it('uses the public research slug', () => {
    expect(RESEARCH_SHARE_SLUG).toBe('alt-platforms-research');
  });
});

describe('buildResearchShareUrl', () => {
  it('composes the URL with slug and src', () => {
    const url = buildResearchShareUrl('https://example.com', 'share-thanks');
    expect(url).toBe('https://example.com/research/alt-platforms-research?src=share-thanks');
  });

  it('trims trailing slashes from the base URL', () => {
    const url = buildResearchShareUrl('https://example.com///', 'share-thanks');
    expect(url).toBe('https://example.com/research/alt-platforms-research?src=share-thanks');
  });

  it('respects the src parameter for each placement', () => {
    expect(buildResearchShareUrl('https://ex.com', RESEARCH_SHARE_SRC_THANKS)).toContain('?src=share-thanks');
    expect(buildResearchShareUrl('https://ex.com', RESEARCH_SHARE_SRC_DURING_SURVEY)).toContain('?src=share-during-survey');
    expect(buildResearchShareUrl('https://ex.com', RESEARCH_SHARE_SRC_SETTINGS)).toContain('?src=in-app-share-settings');
  });
});

describe('shareResearchSurvey — native (Platform.OS=ios)', () => {
  beforeEach(() => {
    mockShare.mockReset();
  });

  it('returns kind: "shared" when sharedAction', async () => {
    mockShare.mockResolvedValue({ action: mockSharedAction });
    const result = await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: 'T',
      message: 'M',
    });
    expect(result).toEqual({ kind: 'shared' });
  });

  it('returns kind: "dismissed" when dismissedAction', async () => {
    mockShare.mockResolvedValue({ action: mockDismissedAction });
    const result = await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: 'T',
      message: 'M',
    });
    expect(result).toEqual({ kind: 'dismissed' });
  });

  it('returns kind: "failed" when Share.share throws', async () => {
    mockShare.mockRejectedValue(new Error('os refused'));
    const result = await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: 'T',
      message: 'M',
    });
    expect(result).toEqual({ kind: 'failed', reason: 'os refused' });
  });

  it('includes the URL exactly once in the share message body', async () => {
    mockShare.mockResolvedValue({ action: mockSharedAction });
    await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: 'T',
      message: 'מלא/י את הסקר',
    });
    const arg = mockShare.mock.calls[0][0];
    const url = 'https://example.com/research/alt-platforms-research?src=in-app-share-settings';
    const escaped = url.replace(/[.?*+]/g, '\\$&');
    const occurrences = (arg.message.match(new RegExp(escaped, 'g')) || []).length;
    expect(occurrences).toBe(1);
  });

  it('respects the src parameter in the URL passed to Share.share', async () => {
    mockShare.mockResolvedValue({ action: mockSharedAction });
    await shareResearchSurvey({
      webBaseUrl: 'https://example.com',
      src: RESEARCH_SHARE_SRC_THANKS,
      title: 'T',
      message: 'M',
    });
    const arg = mockShare.mock.calls[0][0];
    expect(arg.message).toContain('?src=share-thanks');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm --filter @kc/mobile test -- shareResearchSurvey
```

Expected: `Failed to resolve import "../shareResearchSurvey"` or similar — the module does not exist yet.

- [ ] **Step 3: Implement the minimal utility**

Create `app/apps/mobile/src/lib/shareResearchSurvey.ts`:

```typescript
// FR-RESEARCH-004 — share the public market-research survey from inside the
// app (Settings row) and from the public web surfaces (thanks page, survey
// form header). Mirrors sharePost.ts for FR-POST-023: never throws, returns
// a discriminated-union outcome. URL composition is centralized so the
// ?src= attribution can't drift across call sites.

import { Platform, Share } from 'react-native';

export const RESEARCH_SHARE_SLUG = 'alt-platforms-research';
export const RESEARCH_SHARE_SRC_THANKS = 'share-thanks';
export const RESEARCH_SHARE_SRC_DURING_SURVEY = 'share-during-survey';
export const RESEARCH_SHARE_SRC_SETTINGS = 'in-app-share-settings';

export type ResearchShareInput = Readonly<{
  webBaseUrl: string;
  src: string;
  title: string;
  /** Short Hebrew copy that goes before the URL in the message body. */
  message: string;
}>;

export type ShareResearchOutcome =
  | { kind: 'shared' }
  | { kind: 'dismissed' }
  | { kind: 'copied' }
  | { kind: 'failed'; reason: string };

type WebShareNavigator = {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};

export function buildResearchShareUrl(webBaseUrl: string, src: string): string {
  const trimmed = webBaseUrl.replace(/\/+$/, '');
  return `${trimmed}/research/${RESEARCH_SHARE_SLUG}?src=${src}`;
}

function composeMessage(message: string, url: string): string {
  return `${message.trim()}\n\n${url}`;
}

async function shareWeb(
  url: string,
  title: string,
  body: string,
): Promise<ShareResearchOutcome> {
  const nav = (globalThis as { navigator?: WebShareNavigator }).navigator;
  if (!nav) return { kind: 'failed', reason: 'no_navigator' };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title, text: body, url });
      return { kind: 'shared' };
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === 'AbortError') return { kind: 'dismissed' };
    }
  }
  if (nav.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(url);
      return { kind: 'copied' };
    } catch (err) {
      return { kind: 'failed', reason: (err as Error).message };
    }
  }
  return { kind: 'failed', reason: 'no_share_or_clipboard' };
}

async function shareNative(
  title: string,
  body: string,
): Promise<ShareResearchOutcome> {
  try {
    const result = await Share.share({ message: body, title });
    if (result.action === Share.sharedAction) return { kind: 'shared' };
    if (result.action === Share.dismissedAction) return { kind: 'dismissed' };
    return { kind: 'failed', reason: `unknown_action_${result.action}` };
  } catch (err) {
    return { kind: 'failed', reason: (err as Error).message };
  }
}

export async function shareResearchSurvey(
  input: ResearchShareInput,
): Promise<ShareResearchOutcome> {
  const url = buildResearchShareUrl(input.webBaseUrl, input.src);
  const body = composeMessage(input.message, url);

  if (Platform.OS === 'web') return shareWeb(url, input.title, body);
  return shareNative(input.title, body);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm --filter @kc/mobile test -- shareResearchSurvey
```

Expected: all tests PASS (3 describe blocks, 11 tests total).

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/src/lib/shareResearchSurvey.ts app/apps/mobile/src/lib/__tests__/shareResearchSurvey.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile): shareResearchSurvey utility with three placement src values

Mapped to spec: FR-RESEARCH-004. Refactor logged: NA.

OS share sheet on native, Web Share API + clipboard fallback on web,
never throws, returns a discriminated-union outcome. Takes src as
input so attribution is set at the call site. Mirrors sharePost.ts
(FR-POST-023). Three exported src constants — share-thanks,
share-during-survey, in-app-share-settings — all pass the source
CHECK regex.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Analytics event + i18n strings (both locale modules)

**Files:**
- Modify: `app/apps/mobile/src/lib/analytics.ts` (extend `SurveyAnalyticsEvent` union)
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/research.ts` (new `share` sub-tree)
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/survey.ts` (new `shareResearch` sub-tree)

- [ ] **Step 1: Extend the analytics event union**

Open `app/apps/mobile/src/lib/analytics.ts`. Find the `SurveyAnalyticsEvent` union (it currently ends with `'feedback_submitted'`). Add a new line:

```typescript
export type SurveyAnalyticsEvent =
  | 'survey_opened'
  | 'survey_question_answered'
  | 'survey_completed'
  | 'survey_prompt_snoozed'
  | 'feedback_submitted'
  | 'research_share_initiated';
```

No other changes — the `track()` function already accepts arbitrary `EventProperties` so no per-event payload typing is needed.

- [ ] **Step 2: Add the `share` sub-tree to `research.ts`**

Open `app/apps/mobile/src/i18n/locales/he/modules/research.ts`. After the `thanksVisitCta` key (last in the object), add:

```typescript
  // FR-RESEARCH-004 — share affordance copy for public surfaces (placements 1 + 2)
  share: {
    // Placement 1 — thank-you page primary CTA
    thanksTitle: 'שתפו את הסקר עם חבר/ה',
    thanksHelp: 'עזרו לקול שלכם להגיע גם לאחרים שעוד לא באפליקציה',

    // Placement 2 — small button in survey form header
    duringSurveyLabel: 'שתפו',
    duringSurveyAria: 'שתפו את הסקר עם חבר/ה',

    // Web-platform OS share-sheet title
    shareTitle: 'מחקר שוק קארמה',

    // Body of the share message — identical to in-app variant
    shareMessage:
      'אנחנו בונים אפליקציה ישראלית לנתינה בחינם, בלי הבלגן של הקבוצות. ' +
      'שאלון אנונימי קצר, בלי הרשמה — התשובות שלך משנות איך זה ייראה בפועל.',

    // Status feedback (inline status line per AC8)
    statusShared: 'הקישור שותף',
    statusCopied: 'הקישור הועתק',
    statusFailed: 'לא הצלחנו לשתף, נסה/י שוב',
  },
```

- [ ] **Step 3: Add the `shareResearch` sub-tree to `survey.ts`**

Open `app/apps/mobile/src/i18n/locales/he/modules/survey.ts`. Inside the `surveyHe` object, after the last existing key (likely the free-feedback section), add:

```typescript
  // FR-RESEARCH-004 — in-app Settings → Surveys row (placement 3)
  shareResearch: {
    rowTitle: 'שתפו את מחקר השוק עם חברים',
    rowSubtitle: 'עוזרים לנו להבין מה אנשים שלא באפליקציה צריכים — אנונימי, בלי הרשמה',
    shareTitle: 'מחקר שוק קארמה',
    shareMessage:
      'אנחנו בונים אפליקציה ישראלית לנתינה בחינם, בלי הבלגן של הקבוצות. ' +
      'שאלון אנונימי קצר, בלי הרשמה — התשובות שלך משנות איך זה ייראה בפועל.',
    toastShared: 'הקישור שותף',
    toastCopied: 'הקישור הועתק',
    toastFailed: 'לא הצלחנו לשתף, נסה/י שוב',
  },
```

- [ ] **Step 4: Run typecheck to verify nothing broke**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm typecheck
```

Expected: all green. The new event union member and the locale-module additions are pure data; no consumer references them yet, so typecheck should pass.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/src/lib/analytics.ts \
        app/apps/mobile/src/i18n/locales/he/modules/research.ts \
        app/apps/mobile/src/i18n/locales/he/modules/survey.ts
git commit -m "$(cat <<'EOF'
feat(mobile): i18n keys + analytics event for FR-RESEARCH-004

Mapped to spec: FR-RESEARCH-004. Refactor logged: NA.

Adds research.share.* (public-web placements) and survey.shareResearch.*
(in-app placement) locale sub-trees, plus research_share_initiated
in the SurveyAnalyticsEvent union. No consumers yet — wired up in
subsequent commits.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `ShareResearchRow` in-app component + mount in Settings

**Files:**
- Create: `app/apps/mobile/src/components/survey/ShareResearchRow.tsx`
- Modify: `app/apps/mobile/app/settings/surveys.tsx` (mount Row at top of ScrollView)

- [ ] **Step 1: Find the toast helper used by the surveys hub**

The existing screens use `useFeedSessionStore`'s `showEphemeralToast` for toasts. Verify the import path and the function signature:

```bash
grep -n "showEphemeralToast" /Users/navesarussi/Desktop/MVP-2/app/apps/mobile/src/store/feedSessionStore.ts | head -5
```

If the function exists with signature `(message: string, kind: 'success' | 'error', durationMs: number) => void`, proceed. If signature differs, adjust the calls in Step 2 accordingly. If no toast store is available in this repo, fall back to no-op (just log via `track`) — the experiment can still measure DB rows without the toast UX.

- [ ] **Step 2: Build the row component**

Create `app/apps/mobile/src/components/survey/ShareResearchRow.tsx`:

```typescript
// FR-RESEARCH-004 — entry row in /settings/surveys (placement 3) that opens
// the share sheet for the public research survey. The only in-app surface
// for FR-RESEARCH-004; placements 1 and 2 live on the public web pages.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, radius, spacing, typography } from '@kc/ui';
import {
  shareResearchSurvey,
  RESEARCH_SHARE_SRC_SETTINGS,
} from '../../lib/shareResearchSurvey';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';
import { webTextRtl, webViewRtl } from '../../lib/webRtlStyle';
import { track } from '../../lib/analytics';
import { useFeedSessionStore } from '../../store/feedSessionStore';

const WEB_BASE_URL =
  (process.env.EXPO_PUBLIC_WEB_BASE_URL as string | undefined) ??
  'https://mvp-2-dev.up.railway.app';

export function ShareResearchRow(): React.JSX.Element {
  const { t } = useTranslation();
  const styles = useShareResearchRowStyles();
  const showToast = useFeedSessionStore((s) => s.showEphemeralToast);

  const onPress = async () => {
    const outcome = await shareResearchSurvey({
      webBaseUrl: WEB_BASE_URL,
      src: RESEARCH_SHARE_SRC_SETTINGS,
      title: t('survey.shareResearch.shareTitle'),
      message: t('survey.shareResearch.shareMessage'),
    });

    track('research_share_initiated', {
      slug: 'alt-platforms-research',
      src: RESEARCH_SHARE_SRC_SETTINGS,
      outcome: outcome.kind,
    });

    if (outcome.kind === 'shared') {
      showToast(t('survey.shareResearch.toastShared'), 'success', 2200);
    } else if (outcome.kind === 'copied') {
      showToast(t('survey.shareResearch.toastCopied'), 'success', 2200);
    } else if (outcome.kind === 'failed') {
      showToast(t('survey.shareResearch.toastFailed'), 'error', 2200);
    }
    // 'dismissed' → silent (no toast)
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title}>{t('survey.shareResearch.rowTitle')}</Text>
        <Text style={styles.subtitle}>{t('survey.shareResearch.rowSubtitle')}</Text>
      </View>
    </Pressable>
  );
}

const useShareResearchRowStyles = makeUseStyles(({ colors }) => ({
  row: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...webViewRtl,
  },
  rowPressed: { opacity: 0.7 },
  textBlock: { gap: 4 },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    ...webTextRtl,
  },
}));
```

- [ ] **Step 3: Mount the row at the top of the surveys hub**

Open `app/apps/mobile/app/settings/surveys.tsx`. Add the import near the top (alongside the other `../../src/components/...` imports):

```typescript
import { ShareResearchRow } from '../../src/components/survey/ShareResearchRow';
```

Find the `<ScrollView contentContainerStyle={styles.scrollContent}>` block (around line 110 of the original). The current content is: `{surveys.length === 0 ? <Empty /> : <List />}` then the feedback row.

Insert `<ShareResearchRow />` as the **first child** inside the ScrollView, above the empty/list conditional:

```tsx
<ScrollView contentContainerStyle={styles.scrollContent}>
  <ShareResearchRow />
  {surveys.length === 0 ? (
    <Text style={styles.empty}>{t('survey.emptyState')}</Text>
  ) : (
    <View style={styles.list}>
      {surveys.map((item) => (
        <SurveyRow ... />
      ))}
    </View>
  )}

  <Pressable ... feedback row />
</ScrollView>
```

The existing `styles.scrollContent` has `gap: spacing.sm`, so vertical spacing between the new row and the surveys list is already correct.

- [ ] **Step 4: Run typecheck**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm typecheck
```

Expected: all green.

- [ ] **Step 5: Run tests**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm test -- shareResearchSurvey
```

Expected: all green (no new tests, but verify nothing regressed).

- [ ] **Step 6: Commit**

```bash
git add app/apps/mobile/src/components/survey/ShareResearchRow.tsx \
        app/apps/mobile/app/settings/surveys.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): in-app share research row in Settings hub (FR-RESEARCH-004 P3)

Mapped to spec: FR-RESEARCH-004. Refactor logged: NA.

Placement 3 of 3 — adds the row "שתפו את מחקר השוק עם חברים" at the
top of /settings/surveys for registered users. Uses shareResearchSurvey
utility with src=in-app-share-settings for attribution. Emits
research_share_initiated analytics event with outcome label.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Thank-you page primary share CTA (placement 1)

**Files:**
- Modify: `app/apps/mobile/app/research/thanks.web.tsx`

The thank-you page currently has a card with heading + line + email opt-in note + "Visit Karma" CTA (revealed after 5s). The share button becomes the **primary** CTA and is visible immediately.

- [ ] **Step 1: Add imports and helpers to `thanks.web.tsx`**

Open `app/apps/mobile/app/research/thanks.web.tsx`. Replace the import block (lines 7-12) with:

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography, useTheme } from '@kc/ui';
import { webTextRtl, webViewRtl } from '../../src/lib/webRtlStyle';
import { rtlTextAlignStart } from '../../src/lib/rtlTextAlignStart';
import {
  shareResearchSurvey,
  RESEARCH_SHARE_SRC_THANKS,
  type ShareResearchOutcome,
} from '../../src/lib/shareResearchSurvey';
import { track } from '../../src/lib/analytics';
```

- [ ] **Step 2: Add share state + handler inside the component**

Inside `ResearchThanksScreen`, just after the existing `showVisitLink` state declaration (line ~22), add:

```typescript
  const [shareStatus, setShareStatus] = useState<ShareResearchOutcome['kind'] | null>(null);
```

Then, just before the `useEffect` for the auto-redirect timer, add the share handler:

```typescript
  const handleShare = useCallback(async () => {
    const origin =
      typeof window !== 'undefined' && window.location
        ? window.location.origin
        : (process.env.EXPO_PUBLIC_WEB_BASE_URL as string | undefined) ?? '';

    const outcome = await shareResearchSurvey({
      webBaseUrl: origin,
      src: RESEARCH_SHARE_SRC_THANKS,
      title: t('research.share.shareTitle'),
      message: t('research.share.shareMessage'),
    });

    track('research_share_initiated', {
      slug: 'alt-platforms-research',
      src: RESEARCH_SHARE_SRC_THANKS,
      outcome: outcome.kind,
    });

    if (outcome.kind !== 'dismissed') {
      setShareStatus(outcome.kind);
      setTimeout(() => setShareStatus(null), 2200);
    }
  }, [t]);
```

- [ ] **Step 3: Render the primary share CTA + status line**

Inside the `<View style={styles.card}>` block, between the email opt-in note (`</View>` closing `optInNote`) and the `{showVisitLink ? ...}` block, insert:

```tsx
        {/* FR-RESEARCH-004 placement 1 — primary share CTA */}
        <Pressable
          style={styles.shareBtn}
          onPress={handleShare}
          accessibilityRole="button"
        >
          <Text style={styles.shareBtnText}>{t('research.share.thanksTitle')}</Text>
        </Pressable>
        <Text style={styles.shareHelp}>{t('research.share.thanksHelp')}</Text>

        {shareStatus !== null ? (
          <Text
            style={[
              styles.shareStatus,
              shareStatus === 'failed' && styles.shareStatusError,
            ]}
          >
            {shareStatus === 'shared' && t('research.share.statusShared')}
            {shareStatus === 'copied' && t('research.share.statusCopied')}
            {shareStatus === 'failed' && t('research.share.statusFailed')}
          </Text>
        ) : null}
```

- [ ] **Step 4: Add the new styles to the `useStyles` block**

Inside the existing `useStyles = makeUseStyles(({ colors }) => ({ ... }))` style object, append before the closing `}))`:

```typescript
  shareBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  shareBtnText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '700',
    ...webTextRtl,
  },
  shareHelp: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.xs,
    ...webTextRtl,
  },
  shareStatus: {
    ...typography.bodySmall,
    color: colors.success ?? colors.primary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.xs,
    ...webTextRtl,
  },
  shareStatusError: {
    color: colors.error,
  },
```

(Note: if your theme tokens don't include `colors.success`, the fallback `colors.primary` keeps the success status readable in green-ish brand color.)

- [ ] **Step 5: Run typecheck + tests**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm typecheck && pnpm test -- shareResearchSurvey
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add app/apps/mobile/app/research/thanks.web.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): primary share CTA on research thanks page (FR-RESEARCH-004 P1)

Mapped to spec: FR-RESEARCH-004. Refactor logged: NA.

Placement 1 of 3 — primary "שתפו את הסקר עם חבר/ה" CTA on
/research/thanks (web-only). Visible immediately on page load,
alongside the existing "Visit Karma" secondary CTA. Uses
shareResearchSurvey utility with src=share-thanks for attribution.
Inline status line auto-clears after 2.2s.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Survey form header share button (placement 2)

**Files:**
- Modify: `app/apps/mobile/app/research/[slug].web.tsx`

The survey form page has a `SurveyIntroBlock` at the top of the ScrollView, then the `ResearchRunner`. The share button goes at the top-right of the intro block area, visible from page load. It is intentionally small and non-distracting to avoid pulling focus from filling the survey.

- [ ] **Step 1: Add imports**

Open `app/apps/mobile/app/research/[slug].web.tsx`. Replace the existing import block (lines 1-18) with:

```typescript
// Web-only public research form — FR-RESEARCH-001, FR-RESEARCH-002, FR-RESEARCH-003.
// FR-RESEARCH-004 placement 2 — small share button in intro block header.
// .web.tsx extension: file is excluded from iOS/Android bundles entirely.
// Heavy sub-components extracted: ResearchRunner.tsx, ResearchQuestionPanel.tsx.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, spacing, typography, useTheme } from '@kc/ui';
import { container } from '../../src/lib/container';
import { webTextRtl, webViewRtl } from '../../src/lib/webRtlStyle';
import { rtlTextAlignStart } from '../../src/lib/rtlTextAlignStart';
import { ResearchRunner, errorKey, type AnswerEntry } from './ResearchRunner';
import {
  shareResearchSurvey,
  RESEARCH_SHARE_SRC_DURING_SURVEY,
  type ShareResearchOutcome,
} from '../../src/lib/shareResearchSurvey';
import { track } from '../../src/lib/analytics';
```

- [ ] **Step 2: Modify `SurveyIntroBlock` to render the share button**

Replace the entire `SurveyIntroBlock` function (lines 37-49) with:

```typescript
function SurveyIntroBlock() {
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [shareStatus, setShareStatus] = useState<ShareResearchOutcome['kind'] | null>(null);

  const handleShare = useCallback(async () => {
    const origin =
      typeof window !== 'undefined' && window.location
        ? window.location.origin
        : (process.env.EXPO_PUBLIC_WEB_BASE_URL as string | undefined) ?? '';

    const outcome = await shareResearchSurvey({
      webBaseUrl: origin,
      src: RESEARCH_SHARE_SRC_DURING_SURVEY,
      title: t('research.share.shareTitle'),
      message: t('research.share.shareMessage'),
    });

    track('research_share_initiated', {
      slug: 'alt-platforms-research',
      src: RESEARCH_SHARE_SRC_DURING_SURVEY,
      outcome: outcome.kind,
    });

    if (outcome.kind !== 'dismissed') {
      setShareStatus(outcome.kind);
      setTimeout(() => setShareStatus(null), 2200);
    }
  }, [t]);

  return (
    <View style={[styles.introBlock, webViewRtl]}>
      <View style={styles.introTopRow}>
        <Text style={styles.introHeading}>{t('research.introHeading')}</Text>
        <Pressable
          style={({ pressed }) => [styles.shareBtnSmall, pressed && styles.shareBtnSmallPressed]}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel={t('research.share.duringSurveyAria')}
        >
          <Text style={styles.shareBtnSmallText}>{t('research.share.duringSurveyLabel')}</Text>
        </Pressable>
      </View>
      <Text style={styles.introLine}>{t('research.introLine1')}</Text>
      <Text style={styles.introLine}>{t('research.introLine2')}</Text>
      <Text style={styles.introLine}>{t('research.introLine3')}</Text>

      {shareStatus !== null ? (
        <Text
          style={[
            styles.shareStatusLine,
            shareStatus === 'failed' && styles.shareStatusLineError,
          ]}
        >
          {shareStatus === 'shared' && t('research.share.statusShared')}
          {shareStatus === 'copied' && t('research.share.statusCopied')}
          {shareStatus === 'failed' && t('research.share.statusFailed')}
        </Text>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 3: Add the new styles to `useScreenStyles`**

Inside the existing `useScreenStyles = makeUseStyles(...)` style object, append before the closing `}))`:

```typescript
  introTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  shareBtnSmall: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareBtnSmallPressed: { opacity: 0.6 },
  shareBtnSmallText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    ...webTextRtl,
  },
  shareStatusLine: {
    ...typography.caption,
    color: colors.success ?? colors.primary,
    textAlign: rtlTextAlignStart,
    marginTop: spacing.xs,
    ...webTextRtl,
  },
  shareStatusLineError: {
    color: colors.error,
  },
```

- [ ] **Step 4: Run typecheck + tests + lint**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm typecheck && pnpm test -- shareResearchSurvey && pnpm lint
```

Expected: all green. If lint complains about the file size approaching 300 lines, check the diff — the file was at 221 lines before; this change adds ~70 lines; should stay under 300.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/app/research/[slug].web.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): small share button in survey form header (FR-RESEARCH-004 P2)

Mapped to spec: FR-RESEARCH-004. Refactor logged: NA.

Placement 2 of 3 — small "שתפו" button + icon in the survey form's
intro block, visible from page load. Intentionally compact to avoid
pulling focus from completing the survey. Captures non-completers
who think a friend should also fill. Uses shareResearchSurvey utility
with src=share-during-survey for attribution.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Final verification + SSOT status flip + PR

**Files:**
- Modify: `docs/SSOT/spec/16_public_research.md` (flip FR-RESEARCH-004 status)
- Modify: `docs/SSOT/BACKLOG.md` (flip P1.8 status)

- [ ] **Step 1: Run all pre-push gates from `app/`**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm typecheck && pnpm test && pnpm lint
```

Expected: all three green.

- [ ] **Step 2: Manual matrix (deferred to post-merge QA — record intent here)**

Document the manual matrix in the PR body. The matrix to run on dev once merged:

| Case | Expected |
|------|----------|
| Open `/settings/surveys` on iOS | Share row visible at top; tap → native share sheet appears with Hebrew message + URL |
| Open `/settings/surveys` on Android | Same as iOS — native share sheet, URL appears exactly once in body |
| Open `/settings/surveys` on web Chrome (has navigator.share) | Tap → Web Share dialog opens with text + url |
| Open `/settings/surveys` on web Safari desktop (no navigator.share) | Tap → URL copied to clipboard, success toast shown |
| Open `/research/alt-platforms-research` on web | Small share button visible in intro block; tap → Web Share or clipboard fallback |
| Open `/research/thanks` on web after submission | Primary "שתפו את הסקר" CTA visible immediately (no 5s gate); tap → Web Share or clipboard fallback |
| Recipient opens shared link from any of the three placements | Lands on `/research/alt-platforms-research?src=<placement-src>`, form renders, submit works without auth |
| Inspect `public.public_research_responses` after a friend submits | New row exists with `source` ∈ {`share-thanks`, `share-during-survey`, `in-app-share-settings`} matching the originating placement |

- [ ] **Step 3: Flip SSOT statuses**

In `docs/SSOT/spec/16_public_research.md`, change FR-RESEARCH-004 status from `⏳ Planned` to `🟡 Code complete, post-merge QA pending`. Do **not** flip to ✅ until the manual matrix in Step 2 passes on the deployed dev environment.

In `docs/SSOT/BACKLOG.md`, flip the P1.8 row's status column to `🟡 Code complete, post-merge QA pending` (matching the wording used by P1.7).

- [ ] **Step 4: Commit the status flip**

```bash
git add docs/SSOT/spec/16_public_research.md docs/SSOT/BACKLOG.md
git commit -m "$(cat <<'EOF'
chore(ssot): flip FR-RESEARCH-004 to code-complete pending QA

Mapped to spec: FR-RESEARCH-004. Refactor logged: NA.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Push the branch and open the PR**

```bash
cd /Users/navesarussi/Desktop/MVP-2
git push -u origin docs/FR-RESEARCH-004-share-design
```

Then create the PR targeting `dev`:

```bash
gh pr create --base dev --head docs/FR-RESEARCH-004-share-design \
  --title "feat(mobile): three viral share surfaces for public research survey (FR-RESEARCH-004)" \
  --body "$(cat <<'EOF'
## Summary
Adds three share surfaces on the public market-research survey so it can spread virally among non-registered users: a primary CTA on the thank-you page, a small button in the survey form header, and an in-app row in Settings → Surveys. Each placement uses a distinct `?src=` value so we can attribute fills back to the originating surface and learn which channel converts.

## Mapped to spec
- FR-RESEARCH-004 — Share affordance for public research survey ([spec/16_public_research.md](../blob/dev/docs/SSOT/spec/16_public_research.md))
- Design doc: [docs/superpowers/specs/2026-05-28-in-app-share-research-survey-design.md](../blob/dev/docs/superpowers/specs/2026-05-28-in-app-share-research-survey-design.md)

## Changes
- New `src/lib/shareResearchSurvey.ts` utility (RN Share / Web Share / clipboard fallback, discriminated outcome)
- New `ShareResearchRow` component mounted at top of `/settings/surveys` (placement 3, in-app)
- Primary share CTA on `/research/thanks` web-only page (placement 1)
- Small share button in `/research/[slug]` survey-form intro block (placement 2)
- Hebrew locale keys: `research.share.*` + `survey.shareResearch.*`
- Extends `SurveyAnalyticsEvent` union with `research_share_initiated`

## Tests
- `pnpm typecheck` ✅
- `pnpm test` ✅ (11 new tests for the utility — happy path + dismissed + failed + URL-once invariant + src parameter respect)
- `pnpm lint` ✅
- Manual matrix: deferred to post-merge QA on dev (see PR description below)

## SSOT updated
- [x] `BACKLOG.md` status set to 🟡 In progress → 🟡 Code complete, post-merge QA pending
- [x] `spec/16_public_research.md` FR-RESEARCH-004 added; status 🟡 Code complete, post-merge QA pending
- [ ] `TECH_DEBT.md` — no closures / no new TDs

## Risk / rollout notes
Low risk. No DB migration, no Edge Function changes, no auth surface changes. Pure FE addition layered on FR-RESEARCH-001..003. Rollback by revert of this PR.

## Post-merge QA matrix
| Case | Expected |
|------|----------|
| iOS share row in Settings | native share sheet, URL once in body |
| Android share row in Settings | native share sheet, URL once in body |
| Web Chrome share (any of 3 placements) | Web Share dialog opens with text + url |
| Web Safari desktop (no navigator.share) | URL copied to clipboard, toast/status line shown |
| Recipient submission lands in DB | `source` matches the originating placement src value |

## Decision rule at +14 days
```sql
select source, count(*) from public.public_research_responses
where source in ('share-thanks', 'share-during-survey', 'in-app-share-settings')
group by source order by count(*) desc;
```
- Σ ≥ 10 → channel viable; identify dominant surface
- 3-9 → extend window 14 more days
- 0-2 → deprecate all three; log to DECISIONS.md
EOF
)"
```

- [ ] **Step 6: Enable auto-merge after CI passes**

```bash
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

Expected: CI passes within ~10 minutes; PR auto-merges to `dev`; branch deleted.

---

## Spec self-review

| Check | Result |
|-------|--------|
| Spec coverage AC1 (primary CTA on thanks page) | Task 5 |
| AC2 (small button on survey form header) | Task 6 |
| AC3 (row at top of /settings/surveys) | Task 4 |
| AC4 (share flow: native / Web Share / clipboard, discriminated outcome) | Task 2 (utility implementation) |
| AC5 (`?src=<placement-src>` for all three, regex-compliant) | Task 2 constants + Task 4/5/6 callers |
| AC6 (URL appears exactly once) | Task 2 step 1 test + `composeMessage` |
| AC7 (recipients fill without registering) | Covered by FR-RESEARCH-001 AC1-AC2; no plan changes needed |
| AC8 (status feedback) | Task 4 toast (in-app), Task 5/6 inline status line (web) |
| AC9 (`research_share_initiated` analytics) | Task 3 event union + Task 4/5/6 `track()` calls |
| No placeholders | All code blocks complete; no TBD / TODO; commit messages use the project's `Co-Authored-By` footer per CLAUDE.md §6 |
| File-size cap | All new files <100 LOC; `[slug].web.tsx` grows from 221 → ~290, still under 300 |
| Architecture invariant | Utility lives at the same layer as `sharePost.ts` (UX glue); no `@kc/application` / `@kc/domain` changes |
| URL attribution survives DB CHECK | All three src values match `^[a-z0-9_-]{1,32}$` (verified: 12, 19, 21 chars; lowercase + dashes only) |
| Hebrew strings only in `i18n/locales/he/` | Task 3 — all UI strings in `research.ts` or `survey.ts` modules; no inline Hebrew in `.tsx` or `.ts` |
| Type consistency | Same `ShareResearchOutcome` discriminated union used across utility + callers; `RESEARCH_SHARE_SRC_*` constants exported once and consumed in all 3 callers |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-28-share-research-survey-three-surfaces.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review, fast iteration
2. **Inline Execution** — execute in this session via `executing-plans` with checkpoints

**Which approach?**

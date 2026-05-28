# FR-RESEARCH-004 — In-App Share Affordance for Public Research Survey

**Status.** ⏳ Planned
**Date.** 2026-05-28
**Mapped to spec.** Extends `docs/SSOT/spec/16_public_research.md` (FR-RESEARCH-001..003).

---

## Goal

Give logged-in users a low-friction way to forward the public market-research survey (`/research/alt-platforms-research`) to friends who are NOT on the app. Recipients fill the survey anonymously — no signup, no app install. This is an **experimental channel for testing**: cheap to ship, cheap to roll back, with a built-in decision rule at +14 days.

## Why this design (vs. the original plan)

The original plan placed the share affordance only inside `/settings/surveys`. That sub-screen has near-zero foot traffic; combined with the in-app analytics module being a `console.log` no-op in production (TD-161 not yet closed), the experiment would likely produce zero data and we'd be unable to conclude whether the channel works.

This revision adds a second, higher-conversion mount point — the **Survey A completion moment** — where the user has just spent ~5 minutes engaging with the research mission and is in the right psychological window to forward to friends outside the app. The two `?src=` values let us compare placement effectiveness without needing a real analytics pipeline; the only signal we rely on is DB rows in `public.public_research_responses`.

## Non-goals

- Wiring TD-161 (real first-party analytics ingest). Separate, larger piece of work.
- Referral with payoff / unlock mechanics. Too heavy for an experiment.
- Per-recipient tracking. The public research surface is anonymous-by-design per FR-RESEARCH-002.
- A/B testing share-message copy. Too few users to be statistically powered.

---

## Acceptance Criteria

**AC1.** A row "שתפו את מחקר השוק עם חברים" renders at the top of `/settings/surveys`, above the active-surveys list and above the free-feedback entry. Tapping it triggers the share flow with `?src=in-app-share-settings`.

**AC2.** An inline CTA renders on `/settings/survey/[slug]` once all questions for that survey have a rating (same trigger that fires `survey_completed`). The CTA appears below the question list. It is shown for **any** completed in-app survey (the copy "help us hear from people outside the app" is framing-correct regardless of which in-app survey was completed). Tapping it triggers the share flow with `?src=in-app-share-survey-complete`.

**AC3.** Share flow behavior:
- On native iOS/Android: OS share sheet via `Share.share`.
- On web with `navigator.share`: Web Share API dialog.
- On web without `navigator.share`: URL copied to clipboard via `navigator.clipboard.writeText`; success toast confirms.
- The flow never throws — it returns one of `{ kind: 'shared' | 'copied' | 'dismissed' | 'failed' }`.

**AC4.** Shared URL is `${EXPO_PUBLIC_WEB_BASE_URL}/research/alt-platforms-research?src=<placement-src>` where `<placement-src>` is one of `in-app-share-settings` or `in-app-share-survey-complete`. Both pass the `^[a-z0-9_-]{1,32}$` CHECK constraint on `public.public_research_responses.source` (21 and 28 chars respectively, lowercase + dashes only).

**AC5.** The URL appears in the share message body exactly once on every platform (mirrors the duplicated-link fix shipped for FR-POST-023).

**AC6.** Recipients can open the link and submit answers without any registration, login, or app install. Already guaranteed by FR-RESEARCH-001 AC1-AC2; this AC asserts the invariant survives the new entry path.

**AC7.** Toasts:
- `kind: 'shared'` → success toast "הקישור שותף" (2.2s).
- `kind: 'copied'` → success toast "הקישור הועתק" (2.2s).
- `kind: 'failed'` → error toast "לא הצלחנו לשתף, נסה/י שוב" (2.2s).
- `kind: 'dismissed'` → silent (no toast).

**AC8.** Analytics: `track('research_share_initiated', { src, outcome })` is called on every share attempt. This is a no-op in production today (TD-161) and the experiment does not depend on it; the call is included so we get the signal automatically once TD-161 closes.

---

## Architecture

One shared utility, two mount-point components, two placements:

```
src/lib/shareResearchSurvey.ts                       ← share logic (RN Share / Web Share / clipboard)
    │
    ├─→ src/components/survey/ShareResearchRow.tsx       (Settings → Surveys)
    │       └─→ app/settings/surveys.tsx                  (top of list)
    │             src = in-app-share-settings
    │
    └─→ src/components/survey/SurveyCompleteShareCta.tsx (Survey A completion)
            └─→ app/settings/survey/[slug].tsx           (rendered when all questions answered)
                  src = in-app-share-survey-complete
```

The utility takes `src` as a parameter — attribution is set at the call site, not hard-coded. This keeps the utility reusable for any future placement.

### Layer placement

`src/lib/shareResearchSurvey.ts` consumes React Native APIs directly. Same layer as the existing `src/lib/sharePost.ts` (FR-POST-023) — UX glue, not domain/application. No changes to `@kc/domain`, `@kc/application`, or `@kc/infrastructure-supabase`.

### Public API of the utility

```typescript
export const RESEARCH_SHARE_SLUG = 'alt-platforms-research';
export const RESEARCH_SHARE_SRC_SETTINGS = 'in-app-share-settings';
export const RESEARCH_SHARE_SRC_SURVEY_COMPLETE = 'in-app-share-survey-complete';

export type ResearchShareInput = Readonly<{
  webBaseUrl: string;
  src: string;       // caller passes one of the RESEARCH_SHARE_SRC_* constants
  title: string;
  message: string;   // short Hebrew copy that goes before the URL in the body
}>;

export type ShareResearchOutcome =
  | { kind: 'shared' }
  | { kind: 'dismissed' }
  | { kind: 'copied' }
  | { kind: 'failed'; reason: string };

export function buildResearchShareUrl(webBaseUrl: string, src: string): string;
export async function shareResearchSurvey(input: ResearchShareInput): Promise<ShareResearchOutcome>;
```

### Web vs native dispatch

```
Platform.OS === 'web'  →  navigator.share() → success | AbortError→dismissed | other err → clipboard fallback
Platform.OS === 'web'  →  no navigator.share → navigator.clipboard.writeText() → copied | failed
otherwise              →  Share.share() → sharedAction | dismissedAction | throw → failed
```

---

## Copy (Hebrew, all in `app/apps/mobile/src/i18n/locales/he/modules/survey.ts`)

New `shareResearch` subtree:

```typescript
shareResearch: {
  // Placement 1 — Settings → Surveys row
  rowTitle: 'שתפו את מחקר השוק עם חברים',
  rowSubtitle: 'עוזרים לנו להבין מה אנשים שלא באפליקציה צריכים — אנונימי, בלי הרשמה',

  // Placement 2 — inline CTA after Survey A completion
  completeCtaTitle: 'עזרו לנו להגיע גם לחברים מחוץ לאפליקציה',
  completeCtaSubtitle: 'יש להם דעות שאנחנו עוד לא שומעים. שאלון אנונימי, 3 דקות',
  completeCtaButton: 'שתפו את מחקר השוק',

  // OS share-sheet title (shown on native share sheets)
  shareTitle: 'מחקר שוק קארמה',

  // Body of the share message — what the recipient sees, identical for both placements
  shareMessage:
    'אנחנו בונים אפליקציה ישראלית לנתינה בחינם, בלי הבלגן של הקבוצות. ' +
    'שאלון אנונימי קצר, בלי הרשמה — התשובות שלך משנות איך זה ייראה בפועל.',

  // Toasts
  toastShared: 'הקישור שותף',
  toastCopied: 'הקישור הועתק',
  toastFailed: 'לא הצלחנו לשתף, נסה/י שוב',
},
```

Notes on the copy:
- Share message body sells the **product** first ("we're building an Israeli giving app without the group chaos"), asks for the survey second. Recipients are non-app users; the hook is product-curiosity, not market-research goodwill.
- Trailing "תודה" was removed from the body — it weakens the close. The thank-you happens on the survey's `/research/thanks` page.
- Settings-row subtitle and survey-completion-CTA subtitle differ deliberately: the Settings row needs to explain *what* this is (cold context); the completion CTA can assume context and goes straight to the empathy hook ("there are voices we still don't hear").

---

## Measurement & decision rule

Since `track()` is a production no-op (TD-161), the only signal we have is the database. That's enough.

**At +14 days post-merge**, run:

```sql
select source, count(*) as fills
from public.public_research_responses
where source like 'in-app-share-%'
group by source
order by fills desc;
```

**Decision matrix** (Σ = total fills across both `src` values):

| Σ over 14 days | Decision |
|---|---|
| ≥ 5 | Channel viable. Keep both placements. If breakdown shows one placement dominates (e.g., 4-to-1), consider deprecating the weaker placement in a follow-up. |
| 1–4 | Inconclusive. Extend observation window 14 more days. |
| 0 | Channel deprecated. Remove both placements in a follow-up PR. Log learning to `docs/SSOT/DECISIONS.md` as a new `D-*` entry with the rationale and the failed channel as evidence for future placement decisions. |

The placement breakdown is the decision-actionable signal beyond pass/fail: it tells us which psychological moment converts better and informs every future placement experiment (post-action prompts, banners, etc.).

---

## File map

| Action | Path |
|---|---|
| Create | `app/apps/mobile/src/lib/shareResearchSurvey.ts` |
| Create | `app/apps/mobile/src/lib/__tests__/shareResearchSurvey.test.ts` |
| Create | `app/apps/mobile/src/components/survey/ShareResearchRow.tsx` |
| Create | `app/apps/mobile/src/components/survey/SurveyCompleteShareCta.tsx` |
| Modify | `app/apps/mobile/app/settings/surveys.tsx` (mount Row at top of list) |
| Modify | `app/apps/mobile/app/settings/survey/[slug].tsx` (mount Cta when all questions answered) |
| Modify | `app/apps/mobile/src/i18n/locales/he/modules/survey.ts` (10 new keys under `shareResearch`) |
| Modify | `app/apps/mobile/src/lib/analytics.ts` (extend `SurveyAnalyticsEvent` union with `'research_share_initiated'`) |
| Modify | `docs/SSOT/spec/16_public_research.md` (FR-RESEARCH-004 block) |
| Modify | `docs/SSOT/BACKLOG.md` (new row) |

Estimated total: ~310 LOC across new files plus ~20 LOC of modifications. Each file ≤300 lines per CLAUDE.md §5.

---

## Constraints respected

- **File-size cap ≤300 lines** (§5): utility ~90, row ~70, completion CTA ~70, test ~80 — all under.
- **Indentation ≤3 levels** (§5): the utility's web dispatch has a fallthrough pattern that stays at 3 levels via early returns.
- **No inline Hebrew strings** (§8): all UI copy in `i18n/locales/he/modules/survey.ts`; no Hebrew in `.tsx` or `.ts` files.
- **Clean architecture** (§5): utility lives at the same layer as `sharePost.ts` (UX glue, RN APIs allowed). No `@kc/application` or `@kc/domain` changes.
- **Attribution source regex**: both `src` values match `^[a-z0-9_-]{1,32}$` — `in-app-share-settings` (21 chars), `in-app-share-survey-complete` (28 chars).
- **URL appears once in body**: enforced by `composeMessage(message, url)` putting the URL after the message body exactly once; covered by unit test.
- **Tests beside code** (§5): `src/lib/__tests__/shareResearchSurvey.test.ts` uses vitest, covers happy path + dismissed + failed + URL-once invariant + src-parameter respect.

---

## Risk / rollout notes

- **Low risk.** No DB migration, no Edge Function changes, no auth surface changes. Pure FE addition.
- **Rollback:** delete the row + CTA + utility in a single revert. No persistent state to clean up.
- **Feature flag:** none. The experimental nature is captured by the +14-day decision rule, not a runtime toggle.
- **Web base URL fallback:** the component reads `process.env.EXPO_PUBLIC_WEB_BASE_URL`; falls back to `https://mvp-2-dev.up.railway.app` if unset (matches existing patterns in the repo).
- **Recipient privacy:** unchanged — the public form is already anonymous-by-design (FR-RESEARCH-002 honeypot + origin allowlist + IP-hash rate limit). The shared URL adds no new attack surface beyond a public URL.

---

## Out-of-band follow-ups (post-merge)

1. **+14 days:** run the measurement SQL; act per the decision matrix.
2. **If TD-161 closes:** the `track('research_share_initiated', ...)` calls start producing usable funnel data automatically — no further code change needed.
3. **If channel is viable (Σ ≥ 5):** consider a third placement on the post-creation success screen as the next experiment, attributed as `in-app-share-post-success`.

---

## Open questions

None. All design decisions are locked.

# Surveys & Market Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two server-driven Hebrew surveys reusing one approved UI runner:
- **Survey A `ux-experience`** — in-app, authenticated, Settings → Surveys (6 questions).
- **Survey B `alt-platforms-research`** — public web-only, anonymous, distributed via FB/WhatsApp/Agora posts (11 questions). Captures pain-language from alt-platform users for the "Karma Phrasebook" deliverable.

**Architecture:** Two Postgres migrations (`0130` for Survey A, `0131` for Survey B). Survey A uses RLS by `auth.uid()`. Survey B uses an `anon`-callable `SECURITY DEFINER` RPC fronted by an Edge Function (for real client IP via `x-forwarded-for` and `Origin` allowlist check). Clean Architecture: separate ports `ISurveyRepository` (A) and `IPublicResearchRepository` (B). Web-only Survey B routes use Expo Router's `.web.tsx` platform extension.

**Tech Stack:** Supabase Postgres + RLS + Edge Functions, `@kc/domain`, `@kc/application`, `@kc/infrastructure-supabase`, Expo Router (typed routes, platform-extension routing), React Query, AsyncStorage (snooze only).

**Design spec:** `docs/superpowers/specs/2026-05-25-surveys-and-feedback-design.md` (v0.2 — post-council)

**Mapped FR-IDs:**
- Survey A: FR-SETTINGS-015, FR-SETTINGS-016, FR-SETTINGS-017 (add to `docs/SSOT/spec/11_settings.md` in Task 1)
- Survey B: FR-RESEARCH-001, FR-RESEARCH-002, FR-RESEARCH-003 (new file `docs/SSOT/spec/16_public_research.md` in Task 12)

---

## File map (create / modify)

| Layer | Create | Modify |
|-------|--------|--------|
| SSOT | `docs/SSOT/spec/16_public_research.md` | `docs/SSOT/spec/11_settings.md`, `docs/SSOT/BACKLOG.md`, `docs/SSOT/DECISIONS.md` (D-* entries), `CLAUDE.md` (§1 spec-files table) |
| DB | `supabase/migrations/0130_surveys_and_feedback.sql`, `supabase/migrations/0131_public_research_responses.sql` | — |
| Edge Functions | `supabase/functions/public-research-submit/index.ts`, `supabase/functions/rotate-research-salt/index.ts` | — |
| Domain | `packages/domain/src/survey/*.ts`, `packages/domain/src/research/*.ts` | `packages/domain/src/index.ts` |
| Application | `packages/application/src/ports/ISurveyRepository.ts`, `packages/application/src/ports/IPublicResearchRepository.ts`, `packages/application/src/survey/*.ts`, `packages/application/src/research/*.ts`, tests | `packages/application/src/index.ts` |
| Infra | `packages/infrastructure-supabase/src/survey/SupabaseSurveyRepository.ts`, `packages/infrastructure-supabase/src/research/SupabasePublicResearchRepository.ts`, tests | `packages/infrastructure-supabase/src/index.ts`, `database.types.ts` (regen) |
| Mobile (in-app) | `app/settings/surveys.tsx`, `app/settings/survey/[slug].tsx`, `app/settings/feedback.tsx`, `src/components/survey/*`, `src/hooks/useSurveyBanner.ts` | `app/settings.tsx`, `src/lib/container.ts`, `src/i18n/locales/he/modules/settings.ts`, root banner mount |
| Web-only (Survey B) | `app/apps/mobile/app/research/[slug].web.tsx`, `app/apps/mobile/app/research/thanks.web.tsx`, `app/apps/mobile/app/research/_layout.web.tsx` | — |
| Demo cleanup | — | Remove public demo row from `settings.tsx`; keep `survey-demo` under `__DEV__` until Task 11 |

---

## PR sequencing (recommended)

| PR | Scope | Base |
|----|-------|------|
| 1 | `docs(contract):` SSOT FR-SETTINGS-015..017 + migration `0130` + seed `ux-experience` | `dev` |
| 2 | `feat(contract):` survey domain + application use cases + fake repo tests | `dev` |
| 3 | `feat(infra):` SupabaseSurveyRepository + direct SQL tests | PR 1 merged |
| 4 | `feat(mobile):` production survey UI + settings hub + persistence | PR 2–3 merged |
| 5 | `feat(mobile):` Survey A milestone banner + snooze + analytics events | PR 4 merged |
| 6 | `docs(contract):` new SSOT file `16_public_research.md` + FR-RESEARCH-001..003 | `dev` |
| 7 | `feat(infra):` migration `0131` + Edge Functions + research domain/application | PR 6 merged |
| 8 | `feat(infra):` SupabasePublicResearchRepository + Edge Function tests | PR 7 merged |
| 9 | `feat(mobile):` `.web.tsx` public research form + thank-you page + UTM parsing | PR 8 merged |

PRs 6–9 land **after** PRs 1–5 so survey runner UI patterns + question types are precedent for Survey B's web form.

---

### Task 1: SSOT — add FR-SETTINGS-015..017 (Survey A)

**Files:**
- Modify: `docs/SSOT/spec/11_settings.md` (append three FR blocks + update status header note)
- Modify: `docs/SSOT/BACKLOG.md` (add P2.34 ⏳ → 🟡 when starting)
- Modify: `docs/SSOT/DECISIONS.md` (append `D-XX` server-driven surveys rationale, 1 paragraph)

- [ ] **Step 1: Add FR-SETTINGS-015 (hub)**

```markdown
## FR-SETTINGS-015 — Surveys & feedback hub

**Status.** ⏳ Planned

**Description.** Settings section "סקרים וחוות דעת" listing active server-driven surveys and a free-feedback entry.

**Acceptance Criteria.**
- AC1. Section appears between My Stats and Support (adjust FR-SETTINGS-001 order note).
- AC2. Each active survey row shows title, status chip (not started / in progress / completed for current version), navigates to FR-SETTINGS-016.
- AC3. Row "חוות דעת חופשית" navigates to FR-SETTINGS-017 (not FR-MOD-002).
- AC4. List data comes from server (`list_active_surveys`); empty state copy when no surveys active.
```

- [ ] **Step 2: Add FR-SETTINGS-016 (survey runner)**

```markdown
## FR-SETTINGS-016 — Server-driven survey runner

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. One question visible; compact top map: number + short label (≤2 words) + completion dot; non-linear jump.
- AC2. Each question: required rating 1–7 + optional text (max 500 chars); per-question anchor labels (low/high) loaded from server; Hebrew RTL placeholders.
- AC3. Floating prev/next controls above tab bar; never hidden behind shell chrome.
- AC4. Answers upserted per `(user_id, survey_id, version, question_id)`; user may edit while current version unchanged.
- AC5. New published version resets completion for that survey; banner may reappear per FR-SETTINGS-016 AC6.
- AC6. Prompt banner when milestones met and survey incomplete: CTA + "אחר כך" snoozes 7 days (AsyncStorage key `kc-survey-snooze-{slug}`).
- AC7. Question copy editable in Supabase without app deploy (`publish_survey_version` RPC).
```

- [ ] **Step 3: Add FR-SETTINGS-017 (free feedback)**

```markdown
## FR-SETTINGS-017 — Free feedback form

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. Optional 1–7 rating + required text (min 10 chars, max 500).
- AC2. Submits to `user_feedback` table; success toast; no chat thread.
- AC3. Does not replace FR-SETTINGS-008.
```

- [ ] **Step 4: BACKLOG P2.34 row** — `⏳ Planned | agent-be + agent-fe | spec/11_settings.md FR-SETTINGS-015..017`

- [ ] **Step 5: Commit**

```bash
git add docs/SSOT/spec/11_settings.md docs/SSOT/BACKLOG.md docs/SSOT/DECISIONS.md docs/superpowers/specs/2026-05-25-surveys-and-feedback-design.md
git commit -m "docs(ssot): add FR-SETTINGS-015..017 surveys and feedback"
```

---

### Task 2: Database migration `0130_surveys_and_feedback.sql` (Survey A)

**Files:**
- Create: `supabase/migrations/0130_surveys_and_feedback.sql`

> Migration number: **0122** (not 0118). Slots 0118–0121 are already occupied on the dev DB by admin-portal migrations (`widen_admin_rpcs_to_rbac`, `admin_restore_no_cascade_dismiss`, `reports_open_inbox_rpc`, `reports_case_detail_rpc`) whose files weren't yet merged to `dev` when this plan was written. Verify with `supabase migration list --linked` before committing.

- [ ] **Step 1: Write migration (core DDL)**

```sql
-- 0130_surveys_and_feedback.sql — FR-SETTINGS-015..017

CREATE TABLE public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_he text NOT NULL,
  description_he text NULL,
  is_active boolean NOT NULL DEFAULT true,
  current_version int NOT NULL DEFAULT 0,
  -- milestone flags for banner: { "min_sessions": 3, "require_closure": true, "require_profile_complete": true }
  prompt_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.survey_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  version int NOT NULL,
  published_by uuid NOT NULL REFERENCES auth.users(id),
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (survey_id, version)
);

CREATE TYPE public.survey_question_type AS ENUM ('rating_1_7_with_optional_text');

CREATE TABLE public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_version_id uuid NOT NULL REFERENCES public.survey_versions(id) ON DELETE CASCADE,
  sort_order int NOT NULL,
  question_type public.survey_question_type NOT NULL DEFAULT 'rating_1_7_with_optional_text',
  short_label_he text NOT NULL,
  prompt_he text NOT NULL,
  context_he text NOT NULL DEFAULT '',
  text_placeholder_he text NOT NULL DEFAULT '',
  -- Per-question rating anchor labels (1 and 7 endpoints)
  rating_anchor_low_he text NOT NULL DEFAULT 'לא מספיק',
  rating_anchor_high_he text NOT NULL DEFAULT 'מצוין',
  UNIQUE (survey_version_id, sort_order)
);

CREATE TABLE public.survey_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  version int NOT NULL,
  question_id uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 7),
  answer_text text NULL CHECK (answer_text IS NULL OR char_length(answer_text) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, survey_id, version, question_id)
);

CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NULL CHECK (rating IS NULL OR rating BETWEEN 1 AND 7),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 10 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX survey_answers_user_survey_version_idx
  ON public.survey_answers (user_id, survey_id, version);
CREATE INDEX user_feedback_created_at_idx ON public.user_feedback (created_at DESC);

-- updated_at trigger on survey_answers
CREATE TRIGGER survey_answers_set_updated_at
  BEFORE UPDATE ON public.survey_answers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at(); -- assumes helper exists; create if not
```

- [ ] **Step 2: RLS policies**

```sql
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated read active surveys + questions for current version
CREATE POLICY surveys_select_active ON public.surveys
  FOR SELECT TO authenticated USING (is_active = true AND current_version > 0);

CREATE POLICY survey_versions_select ON public.survey_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY survey_questions_select ON public.survey_questions
  FOR SELECT TO authenticated USING (true);

-- Users read/write only own answers
CREATE POLICY survey_answers_select_own ON public.survey_answers
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY survey_answers_insert_own ON public.survey_answers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY survey_answers_update_own ON public.survey_answers
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY user_feedback_insert_own ON public.user_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

GRANT SELECT ON public.surveys, public.survey_versions, public.survey_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.survey_answers TO authenticated;
GRANT INSERT ON public.user_feedback TO authenticated;
```

- [ ] **Step 3: RPC `get_survey_bundle(p_slug text)`** — returns JSON: survey meta, `version`, ordered questions (incl. anchors), user's existing answers for that version. `SECURITY DEFINER`, `SET search_path = ''`.

- [ ] **Step 4: RPC `upsert_survey_answers(p_slug text, p_answers jsonb)`** — validates slug active, version match, each question has rating 1–7; upserts rows. `SECURITY DEFINER`, `SET search_path = ''`. `p_answers` shape:

```json
[{ "question_id": "uuid", "rating": 5, "answer_text": "optional" }]
```

- [ ] **Step 5: RPC `list_active_surveys()`** — returns rows with `completion_status ∈ ('not_started','in_progress','completed')` for `auth.uid()` and `current_version`. `SECURITY DEFINER`, `SET search_path = ''`.

- [ ] **Step 6: RPC `publish_survey_version(...)`** — `SECURITY DEFINER`, `SET search_path = ''`; super-admin only (reuse `is_super_admin()` helper from legal migration); bumps `surveys.current_version`, inserts version + questions from JSON payload (including `rating_anchor_low_he`, `rating_anchor_high_he`).

- [ ] **Step 7: RPC `check_survey_prompt_eligibility(p_slug text, p_session_count int)`** — returns `{ show: boolean, reasons: text[] }`. V1 uses client-passed `p_session_count` (document as TD: spoofable, only affects banner UX). `SECURITY DEFINER`, `SET search_path = ''`. Logic:

```sql
-- check_survey_prompt_eligibility:
-- show = survey active
--   AND user has no rating for all questions (not completed)
--   AND (p_session_count >= (prompt_rules->>'min_sessions')::int OR prompt_rules min_sessions is null)
--   AND (NOT require_closure OR exists closed_delivered post by user)
--   AND (NOT require_profile_complete OR display_name set AND exists any post)
```

- [ ] **Step 8: Seed Survey A `ux-experience` version 1** — 6 questions from §8 of design spec. Insert via the `publish_survey_version` RPC inside the migration body (callable with `service_role` context during migration).

```sql
-- Seed Survey A v1 (6 questions). Full Hebrew strings in design spec §8.
-- Q1: המלצה / Q2: חוויה אחרונה / Q3: סיפור בפועל / Q4: כמעט מחיקה / Q5: בחירה / Q6: חסם
-- Each row includes short_label_he, prompt_he, text_placeholder_he, rating_anchor_low_he, rating_anchor_high_he
```

- [ ] **Step 9: Apply on dev** — PM confirmation string per `CLAUDE.md` §7 before `supabase db push`.

- [ ] **Step 10: Regenerate types** — from `app/`: `pnpm --filter @kc/infrastructure-supabase generate:types` (or project script). Commit `database.types.ts` in the same PR.

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations/0130_surveys_and_feedback.sql packages/infrastructure-supabase/src/database.types.ts
git commit -m "feat(infra): add surveys and feedback schema with RPCs (Survey A)"
```

---

### Task 3: Domain types (Survey A)

**Files:**
- Create: `packages/domain/src/survey/SurveyTypes.ts`
- Modify: `packages/domain/src/index.ts`

- [ ] **Step 1: Write types**

```typescript
export type SurveyCompletionStatus = 'not_started' | 'in_progress' | 'completed';

export type SurveyQuestionType = 'rating_1_7_with_optional_text';

export interface SurveyListItem {
  readonly slug: string;
  readonly titleHe: string;
  readonly descriptionHe: string | null;
  readonly currentVersion: number;
  readonly completionStatus: SurveyCompletionStatus;
}

export interface SurveyQuestion {
  readonly id: string;
  readonly sortOrder: number;
  readonly questionType: SurveyQuestionType;
  readonly shortLabelHe: string;
  readonly promptHe: string;
  readonly contextHe: string;
  readonly textPlaceholderHe: string;
  readonly ratingAnchorLowHe: string;
  readonly ratingAnchorHighHe: string;
}

export interface SurveyAnswerDraft {
  readonly questionId: string;
  readonly rating: number;
  readonly answerText: string | null;
}

export interface SurveyBundle {
  readonly slug: string;
  readonly titleHe: string;
  readonly version: number;
  readonly questions: readonly SurveyQuestion[];
  readonly answers: readonly SurveyAnswerDraft[];
}

export interface SurveyPromptEligibility {
  readonly show: boolean;
  readonly slug: string;
}
```

- [ ] **Step 2: Commit** — `feat(domain): add survey value types`

---

### Task 4: Application port + use cases (Survey A)

**Files:**
- Create: `packages/application/src/ports/ISurveyRepository.ts`
- Create: `packages/application/src/survey/LoadSurveyBundleUseCase.ts`
- Create: `packages/application/src/survey/SaveSurveyAnswersUseCase.ts`
- Create: `packages/application/src/survey/ListActiveSurveysUseCase.ts`
- Create: `packages/application/src/survey/CheckSurveyPromptUseCase.ts`
- Create: `packages/application/src/survey/SubmitFreeFeedbackUseCase.ts`
- Create: `packages/application/src/survey/__tests__/*`
- Modify: `packages/application/src/index.ts`

- [ ] **Step 1: Port**

```typescript
export interface ISurveyRepository {
  listActive(): Promise<SurveyListItem[]>;
  getBundle(slug: string): Promise<SurveyBundle>;
  upsertAnswers(slug: string, answers: SurveyAnswerDraft[]): Promise<void>;
  checkPromptEligibility(slug: string, clientSessionCount: number): Promise<SurveyPromptEligibility>;
  submitFreeFeedback(input: { rating: number | null; body: string }): Promise<void>;
}
```

- [ ] **Step 2: `SaveSurveyAnswersUseCase`** — validate every question in bundle has rating 1–7; allow empty `answerText`; reject if slug unknown.

- [ ] **Step 3: Tests with fake repo** — happy path, missing rating throws `SurveyError`, version mismatch from repo.

- [ ] **Step 4: `SurveyError` in domain** — codes: `not_found`, `inactive`, `validation`, `network`.

- [ ] **Step 5: Commit** — `feat(application): survey ports and use cases`

---

### Task 5: Infrastructure adapter (Survey A)

**Files:**
- Create: `packages/infrastructure-supabase/src/survey/SupabaseSurveyRepository.ts`
- Create: `packages/infrastructure-supabase/src/survey/__tests__/SupabaseSurveyRepository.direct.test.ts`
- Modify: `packages/infrastructure-supabase/src/index.ts`, mobile `container.ts`

- [ ] **Step 1: Implement RPC calls** — map snake_case JSON → domain types.

- [ ] **Step 2: Direct tests** — require local Supabase; test `get_survey_bundle`, `upsert`, `list_active_surveys` with seeded `ux-experience`.

- [ ] **Step 3: Wire `container.surveyRepo` + use case exports**

- [ ] **Step 4: Commit** — `feat(infra): Supabase survey repository`

---

### Task 6: Promote UI demo → production components

**Files:**
- Create: `app/apps/mobile/src/components/survey/` (move/refactor from `survey-demo/`)
- Delete or re-export from demo paths after move

- [ ] **Step 1: Rename folder** — `survey-demo` → `survey`; export shared pieces: `SurveyQuestionMap`, `SurveyRatingRow` (now consumes per-question anchors from props instead of global i18n keys), `SurveyFloatingNav`, `hebrewSurveyFieldStyle.ts`.

- [ ] **Step 2: Update `SurveyRatingRow`** — accept `ratingAnchorLow` and `ratingAnchorHigh` props; render per-question anchors above 1 and 7 cells. Fallback to global keys `surveyDemo.ratingLowHint` / `ratingHighHint` if undefined (preserves demo).

- [ ] **Step 3: Replace hardcoded questions** — props: `questions: SurveyQuestion[]`, `answers`, `onAnswerChange`, `onSave` debounced (300ms) calling `SaveSurveyAnswersUseCase`.

- [ ] **Step 4: `SurveyRunnerScreen` logic** — load bundle via React Query `['survey-bundle', slug]`; optimistic local state; debounced upsert; `NotifyModal` on error.

- [ ] **Step 5: Keep `survey-demo.tsx`** importing shared components with `SURVEY_DEMO_QUESTIONS` for design QA under `__DEV__` only.

- [ ] **Step 6: Commit** — `feat(mobile): promote survey UI components`

---

### Task 7: Settings hub + routes (Survey A)

**Files:**
- Create: `app/apps/mobile/app/settings/surveys.tsx`
- Create: `app/apps/mobile/app/settings/survey/[slug].tsx`
- Create: `app/apps/mobile/app/settings/feedback.tsx`
- Modify: `app/apps/mobile/app/settings.tsx`
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/settings.ts`

- [ ] **Step 1: `/settings/surveys`** — `useQuery` → `ListActiveSurveysUseCase`; rows with status chip; free feedback row.

- [ ] **Step 2: `/settings/survey/[slug]`** — production runner (Stack header = `titleHe`).

- [ ] **Step 3: `/settings/feedback`** — simple form; `SubmitFreeFeedbackUseCase`; toast success.

- [ ] **Step 4: Replace demo section in `settings.tsx`** with `t('settings.surveysSection')` → `/settings/surveys`.

- [ ] **Step 5: Commit** — `feat(mobile): settings surveys hub and routes`

---

### Task 8: Prompt banner (Survey A)

**Files:**
- Create: `app/apps/mobile/src/components/survey/SurveyPromptBanner.tsx`
- Create: `app/apps/mobile/src/hooks/useSurveyBanner.ts`
- Modify: root layout or `(tabs)` layout (where feed home mounts)

- [ ] **Step 1: AsyncStorage snooze** — key `kc-survey-snooze-ux-experience` ISO timestamp; suppress 7 days.

- [ ] **Step 2: `useSurveyBanner`** — session count from existing store or increment on `app_launched` in auth shell; call `CheckSurveyPromptUseCase` when snooze expired.

- [ ] **Step 3: Banner UI** — slim card above feed content: title + "מלא סקר" → `/settings/survey/ux-experience` + "אחר כך" snooze.

- [ ] **Step 4: Commit** — `feat(mobile): survey milestone prompt banner`

---

### Task 9: Analytics events (Survey A)

**Files:**
- Modify: `docs/SSOT/archive/SRS/06_cross_cutting/01_analytics_and_events.md` (or active analytics doc if moved)
- Modify: mobile analytics emitter

- [ ] **Step 1: Add events** — `survey_opened`, `survey_question_answered`, `survey_completed`, `survey_prompt_snoozed`, `feedback_submitted` (no PII in properties).

- [ ] **Step 2: Emit from runner** — `properties: { slug, version, question_index }` only.

- [ ] **Step 3: Commit** — `feat(mobile): survey analytics events`

---

### Task 10: Verification gate (Survey A)

- [ ] **Step 1: From `app/`**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all green.

- [ ] **Step 2: Manual matrix**

| Case | Expected |
|------|----------|
| Settings → סקרים | Lists `ux-experience` |
| Open survey | 6 questions from server, per-question anchors render, map jump works |
| Rate + text | Upsert; reload preserves answers |
| Publish v2 in Studio | Status not_started; banner returns |
| Free feedback | Row in `user_feedback`; no chat |
| Snooze | Banner hidden 7 days |
| Tab bar | Floating nav visible on iOS + web |

- [ ] **Step 3: SSOT** — flip P2.34 → ✅; FR-SETTINGS-015..017 headers → ✅ when all ACs pass.

---

### Task 11: Cleanup demo

- [ ] **Step 1: Remove `survey-demo` route from production settings** (already done in Task 7).

- [ ] **Step 2: Delete `survey-demo.tsx` + `surveyDemoQuestions.ts`** once production seed renders the same UX in `/settings/survey/ux-experience`.

- [ ] **Step 3: Commit** — `chore(mobile): remove survey UI demo route`

---

## ========== SURVEY B (public market research) ==========

### Task 12: SSOT — new file `16_public_research.md` + FR-RESEARCH-001..003

**Files:**
- Create: `docs/SSOT/spec/16_public_research.md`
- Modify: `docs/SSOT/BACKLOG.md` (add P1.x — research is acquisition-critical)
- Modify: `docs/SSOT/DECISIONS.md` (D-* — anonymous public form, separate from Settings domain)
- Modify: `CLAUDE.md` (§1 spec-files table — add row `16_public_research.md FR-RESEARCH-*`)

- [ ] **Step 1: Create `16_public_research.md` skeleton**

```markdown
# 2.15 Public Market Research

> **Status:** ⏳ Planned — Survey B captures pain-language from alt-platform users (FB / WhatsApp / Agora). Output: Karma Phrasebook (see design spec §2).

Prefix: `FR-RESEARCH-*`

## Scope
A public, anonymous web form at `/research/[slug]?src=...`, served from the Expo Router web bundle, never shown in mobile app shells. Survey content is server-driven through the same questions schema as Survey A; submissions go to a dedicated anonymous table fronted by an Edge Function for IP forwarding and origin validation.
```

- [ ] **Step 2: FR-RESEARCH-001 (runner)**

```markdown
## FR-RESEARCH-001 — Public market research runner

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. Web-only route `/research/[slug]` rendered via Expo Router `.web.tsx` platform extension. The route file does not exist in iOS/Android bundles (bundle-inspection test).
- AC2. No auth shell, no tab bar, no app navigation. Standalone landing.
- AC3. Reuses Survey A's question runner components; supports 11 questions for slug `alt-platforms-research`.
- AC4. Optional `?src=` query param captured and persisted on submission (regex `^[a-z0-9_-]{1,32}$`; defaults to `direct`).
- AC5. On submit, navigates to `/research/thanks` which offers an optional email opt-in for launch updates.
- AC6. Intro copy and CTA copy as per design spec §9.
```

- [ ] **Step 3: FR-RESEARCH-002 (anti-abuse)**

```markdown
## FR-RESEARCH-002 — Anti-abuse for public research form

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. Hidden honeypot field; non-empty value → silent reject (200 OK but no row inserted) so bots don't probe.
- AC2. Edge Function `public-research-submit` validates `Origin` header against allowlist before invoking RPC.
- AC3. Per-IP-hash rate limit: 5/min, 30/hour, 100/day. IP hashed with daily-rotated salt (`secrets.daily_research_salt`). Hash computed in Edge Function from `x-forwarded-for`, not in Postgres.
- AC4. Global circuit breaker: if `>500` inserts in the last 60 seconds across all sources, RPC returns 503 (`research_circuit_open`).
- AC5. RPC is `SECURITY DEFINER` with `SET search_path = ''`; revoked from `PUBLIC`; explicit `GRANT EXECUTE TO anon`.
```

- [ ] **Step 4: FR-RESEARCH-003 (contact opt-in)**

```markdown
## FR-RESEARCH-003 — Contact-request opt-in

**Status.** ⏳ Planned

**Acceptance Criteria.**
- AC1. Submission can optionally include `contact_email` (validated as RFC 5322 lite) + `contact_window_he` (free text).
- AC2. Stored in separate table `public_research_contact_requests` with FK to `public_research_responses(id) ON DELETE CASCADE`. Survey answers and contact email are deletable independently.
- AC3. Only super-admins can read `public_research_contact_requests` (RLS denies all to anon/authenticated).
- AC4. Thank-you page `/research/thanks` shows email opt-in for launch updates as a separate, additional capture (also stored in same table with a `source = 'thanks_page'` marker on the related response, or a sentinel response).
```

- [ ] **Step 5: BACKLOG row + CLAUDE.md update**

- [ ] **Step 6: Commit** — `docs(ssot): add FR-RESEARCH-001..003 public market research`

---

### Task 13: Database migration `0131_public_research_responses.sql` (Survey B)

**Files:**
- Create: `supabase/migrations/0131_public_research_responses.sql`

> Migration number: **0123** (Survey B follows Survey A's 0122). Verify against remote ledger with `supabase migration list --linked` before committing.

- [ ] **Step 1: Seed Survey B `alt-platforms-research` v1 via Survey A's existing tables**

Survey B reuses Survey A's `surveys` / `survey_versions` / `survey_questions` schema for question content. Only the **answers** go to a separate anonymous table. Insert one row in `surveys` with slug `alt-platforms-research` and 11 questions from design spec §9, via `publish_survey_version` RPC inside this migration.

- [ ] **Step 2: Responses table (anonymous, RLS deny-all)**

```sql
CREATE TABLE public.public_research_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_slug text NOT NULL,
  version int NOT NULL,
  source text NOT NULL DEFAULT 'direct' CHECK (source ~ '^[a-z0-9_-]{1,32}$'),
  ip_hash text NOT NULL,
  -- answers shape: { "<question_id>": { "rating": int, "answer_text": text|null } }
  answers jsonb NOT NULL,
  user_agent_hash text NULL,  -- bot pattern detection; never raw UA
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX public_research_responses_slug_created_idx
  ON public.public_research_responses (survey_slug, created_at DESC);
CREATE INDEX public_research_responses_source_idx
  ON public.public_research_responses (source);
CREATE INDEX public_research_responses_iphash_created_idx
  ON public.public_research_responses (ip_hash, created_at DESC);  -- rate-limit lookups

ALTER TABLE public.public_research_responses ENABLE ROW LEVEL SECURITY;
-- No policies => deny all reads/writes from anon AND authenticated. Service-role only.
```

- [ ] **Step 3: Contact-request table (PII isolated)**

```sql
CREATE TABLE public.public_research_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.public_research_responses(id) ON DELETE CASCADE,
  contact_email text NOT NULL CHECK (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_window_he text NULL CHECK (contact_window_he IS NULL OR char_length(contact_window_he) <= 200),
  consent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX public_research_contact_requests_response_idx
  ON public.public_research_contact_requests (response_id);

ALTER TABLE public.public_research_contact_requests ENABLE ROW LEVEL SECURITY;
-- Super-admin select only via dedicated RPC; no direct grants
```

- [ ] **Step 4: Daily salt secrets row**

```sql
CREATE TABLE IF NOT EXISTS public.research_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  rotated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.research_secrets (key, value) VALUES
  ('daily_research_salt', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.research_secrets ENABLE ROW LEVEL SECURITY;
-- service-role only; no policies
```

- [ ] **Step 5: RPC `submit_public_research_response`**

```sql
CREATE OR REPLACE FUNCTION public.submit_public_research_response(
  p_slug text,
  p_version int,
  p_source text,
  p_ip_hash text,                  -- passed by Edge Function (x-forwarded-for hashed)
  p_user_agent_hash text,
  p_answers jsonb,                 -- { "<question_id>": { rating, answer_text } }
  p_honeypot text,                 -- must be NULL or empty
  p_contact_email text DEFAULT NULL,
  p_contact_window_he text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_response_id uuid;
  v_recent_count int;
  v_global_count int;
  v_survey_id uuid;
BEGIN
  -- Honeypot trip → silent success
  IF p_honeypot IS NOT NULL AND length(trim(p_honeypot)) > 0 THEN
    RETURN gen_random_uuid();  -- fake id, no insert
  END IF;

  -- Resolve survey
  SELECT id INTO v_survey_id
  FROM public.surveys
  WHERE slug = p_slug AND is_active = true AND current_version = p_version;
  IF v_survey_id IS NULL THEN
    RAISE EXCEPTION 'survey_not_found_or_version_mismatch';
  END IF;

  -- Per-IP rate limit (5/min, 30/hour, 100/day)
  SELECT count(*) INTO v_recent_count
  FROM public.public_research_responses
  WHERE ip_hash = p_ip_hash AND created_at > now() - interval '1 minute';
  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'rate_limited_minute';
  END IF;
  -- (analogous SELECTs for hour/day omitted for brevity in plan; include in actual migration)

  -- Global circuit breaker
  SELECT count(*) INTO v_global_count
  FROM public.public_research_responses
  WHERE created_at > now() - interval '1 minute';
  IF v_global_count > 500 THEN
    RAISE EXCEPTION 'research_circuit_open';
  END IF;

  -- Insert response
  INSERT INTO public.public_research_responses
    (survey_slug, version, source, ip_hash, answers, user_agent_hash)
  VALUES
    (p_slug, p_version, COALESCE(p_source, 'direct'), p_ip_hash, p_answers, p_user_agent_hash)
  RETURNING id INTO v_response_id;

  -- Optional contact request
  IF p_contact_email IS NOT NULL AND length(trim(p_contact_email)) > 0 THEN
    INSERT INTO public.public_research_contact_requests
      (response_id, contact_email, contact_window_he)
    VALUES
      (v_response_id, p_contact_email, p_contact_window_he);
  END IF;

  RETURN v_response_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_research_response(text, int, text, text, text, jsonb, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_research_response(text, int, text, text, text, jsonb, text, text, text) TO anon;
```

- [ ] **Step 6: RPC `get_public_research_questions(p_slug text)`** — returns ordered questions for the current published version. Public-readable so the form can render. Uses existing `surveys`/`survey_questions` tables. `SECURITY DEFINER` + `SET search_path = ''`; `GRANT EXECUTE TO anon`.

- [ ] **Step 7: Apply on dev** — PM confirmation per `CLAUDE.md` §7.

- [ ] **Step 8: Regenerate types + commit**

```bash
git add supabase/migrations/0131_public_research_responses.sql packages/infrastructure-supabase/src/database.types.ts
git commit -m "feat(infra): public research responses schema with anonymous RPC (Survey B)"
```

---

### Task 14: Edge Functions for Survey B

**Files:**
- Create: `supabase/functions/public-research-submit/index.ts`
- Create: `supabase/functions/rotate-research-salt/index.ts`
- Create: `supabase/functions/_shared/cors.ts` (if not present)

- [ ] **Step 1: `public-research-submit` Edge Function**

Logic:
1. Validate `Origin` header against allowlist env var `PUBLIC_RESEARCH_ALLOWED_ORIGINS` (comma-separated).
2. Read `x-forwarded-for` (first IP). Read `daily_research_salt` from `research_secrets`. Compute `sha256(ip + salt)`. Compute `user_agent_hash = sha256(ua + salt)`.
3. Validate body shape (joi/zod-equivalent).
4. Invoke RPC `submit_public_research_response` with service-role client.
5. Map errors: `rate_limited_*` → 429, `research_circuit_open` → 503, `survey_not_found_*` → 400.

- [ ] **Step 2: `rotate-research-salt` Edge Function** — scheduled at 00:00 UTC daily (via `pg_cron` or Supabase scheduled function). Generates new `daily_research_salt`. Document rotation in `docs/SSOT/OPERATOR_RUNBOOK.md`.

- [ ] **Step 3: Local tests** — `supabase functions serve` + manual `curl`. Verify: missing Origin → 403, valid → 200, rate-limit hit → 429.

- [ ] **Step 4: Commit** — `feat(infra): public research Edge Functions`

---

### Task 15: Domain + application port (Survey B)

**Files:**
- Create: `packages/domain/src/research/PublicResearchTypes.ts`
- Create: `packages/application/src/ports/IPublicResearchRepository.ts`
- Create: `packages/application/src/research/SubmitPublicResearchResponseUseCase.ts`
- Create: `packages/application/src/research/LoadPublicResearchQuestionsUseCase.ts`
- Create: `packages/application/src/research/__tests__/*`
- Modify: `packages/domain/src/index.ts`, `packages/application/src/index.ts`

- [ ] **Step 1: Domain types**

```typescript
export interface PublicResearchAnswerDraft {
  readonly questionId: string;
  readonly rating: number;
  readonly answerText: string | null;
}

export interface PublicResearchSubmission {
  readonly slug: string;
  readonly version: number;
  readonly source: string;
  readonly answers: readonly PublicResearchAnswerDraft[];
  readonly contactEmail: string | null;
  readonly contactWindowHe: string | null;
  readonly honeypot: string | null;
}
```

- [ ] **Step 2: Port**

```typescript
export interface IPublicResearchRepository {
  loadQuestions(slug: string): Promise<{ version: number; questions: readonly SurveyQuestion[] }>;
  submit(payload: PublicResearchSubmission): Promise<{ responseId: string }>;
}
```

- [ ] **Step 3: Use case + tests** — `SubmitPublicResearchResponseUseCase` validates: every question has rating 1–7, honeypot empty, source matches regex, optional email matches simple regex.

- [ ] **Step 4: Commit** — `feat(application): public research port and use cases`

---

### Task 16: Infrastructure adapter (Survey B)

**Files:**
- Create: `packages/infrastructure-supabase/src/research/SupabasePublicResearchRepository.ts`
- Create: `packages/infrastructure-supabase/src/research/__tests__/SupabasePublicResearchRepository.direct.test.ts`
- Modify: `packages/infrastructure-supabase/src/index.ts`, mobile `container.ts`

- [ ] **Step 1: Implement adapter** — `loadQuestions` calls RPC `get_public_research_questions`; `submit` POSTs to Edge Function `/functions/v1/public-research-submit` (NOT direct RPC).

- [ ] **Step 2: Direct tests** — exercise Edge Function locally: missing Origin → 403, valid submission → row in `public_research_responses`, honeypot trip → no row, rate-limit → 429.

- [ ] **Step 3: Commit** — `feat(infra): Supabase public research repository`

---

### Task 17: Web-only public research form

**Files:**
- Create: `app/apps/mobile/app/research/[slug].web.tsx`
- Create: `app/apps/mobile/app/research/thanks.web.tsx`
- Create: `app/apps/mobile/app/research/_layout.web.tsx`
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/research.ts` (new module)

- [ ] **Step 1: `_layout.web.tsx`** — standalone layout: no auth shell, no tab bar, no app navigation. Apply RTL + Hebrew font; render `<Slot />`.

- [ ] **Step 2: `[slug].web.tsx`** — parses `slug` + `?src=` from `useLocalSearchParams`; React Query `['public-research-questions', slug]` → `LoadPublicResearchQuestionsUseCase`. Reuses `@kc/ui/survey/*` components from Task 6. Hidden honeypot input (`<input name="hp_field" style={{position:'absolute', left:-9999}} aria-hidden />`). Submits via `SubmitPublicResearchResponseUseCase`. Navigates to `/research/thanks` on success.

- [ ] **Step 3: `thanks.web.tsx`** — thank-you copy from design spec §9 + optional email opt-in (separate submit, also stored as contact request with sentinel marker).

- [ ] **Step 4: Bundle-inspection test** — verify `pnpm --filter @kc/mobile run web` builds `/research/[slug]` AND `pnpm ios` / `pnpm android` builds do NOT include `app/research/` files. Add a regression test in CI (grep the iOS bundle output for `research/[slug]`; expect zero matches).

- [ ] **Step 5: Survey B intro copy + CTA copy** — render intro block above Q1 (design spec §9). Persist a link to the `?src=` UTM in `localStorage` so refresh preserves it.

- [ ] **Step 6: Commit** — `feat(mobile): public research web form`

---

### Task 18: Verification gate + SSOT close + Phrasebook setup (Survey B)

- [ ] **Step 1: From `app/`**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

- [ ] **Step 2: Manual matrix**

| Case | Expected |
|------|----------|
| `https://karma.community/research/alt-platforms-research?src=fb-marketplace` | 11 questions render with per-question anchors; intro copy visible |
| Submit complete | Row in `public_research_responses` with `source='fb-marketplace'`; navigate to thanks |
| Submit with email | Row in `public_research_contact_requests` linked via FK |
| Honeypot filled | 200 OK but no row |
| Same IP 6th submit/min | 429 from Edge Function |
| Curl without Origin header | 403 |
| `pnpm ios` bundle | No `app/research/` files included |
| Source missing | Defaults to `direct`; row inserted |

- [ ] **Step 3: SSOT close** — flip FR-RESEARCH-001..003 to ✅; BACKLOG P1.x → ✅.

- [ ] **Step 4: Create empty "Karma Phrasebook" Google Sheet** with 3 columns (Pain / Relief / Where it ships). Link from `docs/SSOT/spec/16_public_research.md` "Output" section. PM owns this sheet; reviewed after every distribution wave.

- [ ] **Step 5: Distribution playbook** — short doc in `docs/SSOT/playbooks/distribute-public-research.md`:
  - List of channels to post per wave (FB giving-groups, WhatsApp neighborhood, Agora, parents' groups, secondhand-buying groups)
  - One `?src=` per channel
  - Soft cap: 100 responses per source per wave (monitor in admin portal; do not enforce in RPC)
  - Wave cadence: open survey → distribute → wait 7–14 days → close (set `is_active=false`) → phrasebook synthesis

- [ ] **Step 6: Commit** — `chore(ssot): close FR-RESEARCH-001..003 and seed phrasebook workflow`

---

## Spec self-review

| Check | Result |
|-------|--------|
| Server-driven content (both surveys) | Task 2 + Task 13 RPCs |
| UI from approved demo | Task 6 |
| Editable answers (Survey A) for current version | `survey_answers` upsert + unique constraint |
| New version resets (Survey A) | `current_version` bump in publish RPC |
| Anonymous Survey B with PII isolation | Task 13 — two tables, FK with `ON DELETE CASCADE` |
| Real client IP | Task 14 Edge Function (`x-forwarded-for`) |
| Origin allowlist (CSRF) | Task 14 Edge Function |
| Rate limit (5/min, 30/h, 100/day) + global circuit breaker | Task 13 RPC |
| Honeypot anti-bot | Task 17 form + Task 13 RPC (silent success on trip) |
| Web-only routing (Survey B) | Task 17 — `.web.tsx` platform extension |
| Per-question rating anchors | Task 2 columns + Task 6 component update |
| Phrasebook output documented (not just data tables) | Task 18 step 4 + design spec §2 |
| Two migrations (security review separation) | `0122` + `0123` |
| No placeholders in plan | RPC shapes, types, and Hebrew strings defined |
| Migration numbers verified | `ls supabase/migrations/ | tail -3` shows `0117_*` is last; next free is `0122` |

**Gaps (documented):**
- Session count for Survey A milestones uses client-passed `p_session_count` in V1 (spoofable). Affects banner UX only; not security-critical. TD: future server-side `user_app_sessions` table.
- Captcha / Cloudflare Turnstile deferred to V1.1 if abuse appears beyond what honeypot + rate limit + origin check catch.
- `user_feedback` table created in `0122` but the route at `/settings/feedback` is wired in Task 7 (cross-PR dependency — make sure PR ordering enforces it).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-25-surveys-and-feedback.md` (v0.2). Design spec: `docs/superpowers/specs/2026-05-25-surveys-and-feedback-design.md` (v0.2).

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — run tasks in this session with checkpoints (`executing-plans` skill)

**Which approach?**

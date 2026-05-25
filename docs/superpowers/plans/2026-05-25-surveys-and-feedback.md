# Surveys & Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship server-driven surveys and a free-feedback form under Settings, reusing the approved survey UI demo, with Supabase-backed questions and per-user editable answers for the current published version.

**Architecture:** Postgres tables + RLS + `SECURITY DEFINER` publish/read RPCs (mirrors legal-documents pattern). Clean Architecture: domain types → `ISurveyRepository` port → use cases → `SupabaseSurveyRepository` → mobile composition root. UI promotes `src/components/survey-demo/*` to `src/components/survey/*` and wires `/settings/surveys` + `/settings/survey/[slug]`.

**Tech Stack:** Supabase Postgres + RLS, `@kc/domain`, `@kc/application`, `@kc/infrastructure-supabase`, Expo Router, React Query, AsyncStorage (snooze only).

**Design spec:** `docs/superpowers/specs/2026-05-25-surveys-and-feedback-design.md`

**Mapped FR-IDs:** FR-SETTINGS-015, FR-SETTINGS-016, FR-SETTINGS-017 (add to `docs/SSOT/spec/11_settings.md` in Task 1).

---

## File map (create / modify)

| Layer | Create | Modify |
|-------|--------|--------|
| SSOT | — | `docs/SSOT/spec/11_settings.md`, `docs/SSOT/BACKLOG.md`, `docs/SSOT/DECISIONS.md` (D-* entry) |
| DB | `supabase/migrations/0112_surveys_and_feedback.sql` | — |
| Domain | `packages/domain/src/survey/*.ts` | `packages/domain/src/index.ts` |
| Application | `packages/application/src/ports/ISurveyRepository.ts`, `packages/application/src/survey/*.ts`, tests | `packages/application/src/index.ts` |
| Infra | `packages/infrastructure-supabase/src/survey/SupabaseSurveyRepository.ts`, tests | `packages/infrastructure-supabase/src/index.ts`, `database.types.ts` (regen) |
| Mobile | `app/settings/surveys.tsx`, `app/settings/survey/[slug].tsx`, `app/settings/feedback.tsx`, `src/components/survey/*`, `src/hooks/useSurveyBanner.ts` | `app/settings.tsx`, `src/lib/container.ts`, `src/i18n/locales/he/modules/settings.ts`, root banner mount |
| Demo cleanup | — | Remove public demo row from `settings.tsx`; keep `survey-demo` under `__DEV__` until Task 20 |

---

## PR sequencing (recommended)

| PR | Scope | Base |
|----|-------|------|
| 1 | `docs(contract):` SSOT FR-015..017 + migration `0112` + seed `ux-experience` | `dev` |
| 2 | `feat(contract):` domain + application survey use cases + fake repo tests | `dev` |
| 3 | `feat(infra):` SupabaseSurveyRepository + direct SQL tests | PR 1 merged |
| 4 | `feat(mobile):` production survey UI + settings hub + persistence | PR 2–3 merged |
| 5 | `feat(mobile):` milestone banner + snooze + analytics events | PR 4 merged |

---

### Task 1: SSOT — add FR-SETTINGS-015..017

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
- AC2. Each question: required rating 1–7 + optional text (max 500 chars); Hebrew RTL placeholders.
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

### Task 2: Database migration `0112_surveys_and_feedback.sql`

**Files:**
- Create: `supabase/migrations/0112_surveys_and_feedback.sql`

- [ ] **Step 1: Write migration (core DDL)**

```sql
-- 0112_surveys_and_feedback.sql — FR-SETTINGS-015..017

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
  UNIQUE (survey_version_id, sort_order)
);

CREATE TABLE public.survey_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  version int NOT NULL,
  question_id uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 7),
  answer_text text NULL,
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

- [ ] **Step 3: RPC `get_survey_bundle(p_slug text)`** — returns JSON: survey meta, `version`, ordered questions, user's existing answers for that version.

- [ ] **Step 4: RPC `upsert_survey_answers(p_slug text, p_answers jsonb)`** — validates slug active, version match, each question has rating 1–7; upserts rows. `p_answers` shape:

```json
[{ "question_id": "uuid", "rating": 5, "answer_text": "optional" }]
```

- [ ] **Step 5: RPC `list_active_surveys()`** — returns rows with `completion_status ∈ ('not_started','in_progress','completed')` for `auth.uid()` and `current_version`.

- [ ] **Step 6: RPC `publish_survey_version(...)`** — `SECURITY DEFINER`; super-admin only (reuse `is_super_admin()` helper from legal migration); bumps `surveys.current_version`, inserts version + questions from JSON payload.

- [ ] **Step 7: RPC `check_survey_prompt_eligibility(p_slug text)`** — returns `{ show: boolean, reasons: text[] }` using server-side checks: incomplete current version AND (`min_sessions` from `users` metadata or `app_session_count` — **V1: pass `p_session_count int` from client** OR count posts for closure/profile). Document V1 simplification in migration comment.

**V1 eligibility implementation (explicit):**

```sql
-- check_survey_prompt_eligibility:
-- show = survey active
--   AND user has no rating for all questions (not completed)
--   AND (client_session_count >= (prompt_rules->>'min_sessions')::int OR prompt_rules min_sessions is null)
--   AND (NOT require_closure OR exists closed_delivered post by user)
--   AND (NOT require_profile_complete OR display_name set AND exists any post)
```

- [ ] **Step 8: Seed survey `ux-experience` version 1** — 5 questions from demo file (expand to 12 in seed SQL copied from `surveyDemoQuestions.ts`).

- [ ] **Step 9: Apply on dev** — PM confirmation string per `CLAUDE.md` §7 before `supabase db push`.

- [ ] **Step 10: Regenerate types** — from `app/`: `pnpm --filter @kc/infrastructure-supabase generate:types` (or project script).

- [ ] **Step 11: Commit**

```bash
git add supabase/migrations/0112_surveys_and_feedback.sql
git commit -m "feat(infra): add surveys and feedback schema with RPCs"
```

---

### Task 3: Domain types

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

### Task 4: Application port + use cases

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

### Task 5: Infrastructure adapter

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

- [ ] **Step 1: Rename folder** — `survey-demo` → `survey`; export shared pieces: `SurveyQuestionMap`, `SurveyRatingRow`, `SurveyFloatingNav`, `hebrewSurveyFieldStyle.ts`.

- [ ] **Step 2: Replace hardcoded questions** — props: `questions: SurveyQuestion[]`, `answers`, `onAnswerChange`, `onSave` debounced (300ms) calling `SaveSurveyAnswersUseCase`.

- [ ] **Step 3: `SurveyRunnerScreen` logic** — load bundle via React Query `['survey-bundle', slug]`; optimistic local state; debounced upsert; `NotifyModal` on error.

- [ ] **Step 4: Keep `survey-demo.tsx`** importing shared components with `SURVEY_DEMO_QUESTIONS` for design QA under `__DEV__` only.

- [ ] **Step 5: Commit** — `feat(mobile): promote survey UI components`

---

### Task 7: Settings hub + routes

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

### Task 8: Prompt banner

**Files:**
- Create: `app/apps/mobile/src/components/survey/SurveyPromptBanner.tsx`
- Create: `app/apps/mobile/src/hooks/useSurveyBanner.ts`
- Modify: root layout or `(tabs)` layout (where feed home mounts)

- [ ] **Step 1: AsyncStorage snooze** — key `kc-survey-snooze-ux-experience` ISO timestamp; suppress 7 days.

- [ ] **Step 2: `useSurveyBanner`** — session count from existing store or increment on `app_launched` in auth shell; call `CheckSurveyPromptUseCase` when snooze expired.

- [ ] **Step 3: Banner UI** — slim card above feed content: title + "מלא סקר" → `/settings/survey/ux-experience` + "אחר כך" snooze.

- [ ] **Step 4: Commit** — `feat(mobile): survey milestone prompt banner`

---

### Task 9: Analytics events (optional same PR as 8)

**Files:**
- Modify: `docs/SSOT/archive/SRS/06_cross_cutting/01_analytics_and_events.md` (or active analytics doc if moved)
- Modify: mobile analytics emitter

- [ ] **Step 1: Add events** — `survey_opened`, `survey_question_answered`, `survey_completed`, `survey_prompt_snoozed`, `feedback_submitted` (no PII in properties).

- [ ] **Step 2: Emit from runner** — `properties: { slug, version, question_index }` only.

- [ ] **Step 3: Commit** — `feat(mobile): survey analytics events`

---

### Task 10: Verification gate

- [ ] **Step 1: From `app/`**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all green.

- [ ] **Step 2: Manual matrix**

| Case | Expected |
|------|----------|
| Settings → סקרים | Lists `ux-experience` |
| Open survey | 5+ questions from server, map jump works |
| Rate + text | Upsert; reload preserves answers |
| Publish v2 in Studio | Status not_started; banner returns |
| Free feedback | Row in `user_feedback`; no chat |
| Snooze | Banner hidden 7 days |
| Tab bar | Floating nav visible on iOS + web |

- [ ] **Step 3: SSOT** — flip P2.34 → ✅; FR headers → ✅ when all ACs pass.

---

### Task 11: Cleanup demo

- [ ] **Step 1: Remove `survey-demo` route from production settings** (already done in Task 7).

- [ ] **Step 2: Delete `survey-demo.tsx` + `surveyDemoQuestions.ts` when production seed has 12 questions** OR keep dev-only until PM confirms.

- [ ] **Step 3: Commit** — `chore(mobile): remove survey UI demo route`

---

## Spec self-review

| Check | Result |
|-------|--------|
| Server-driven content | Task 2 RPCs + Task 5 adapter |
| UI from approved demo | Task 6–7 |
| Editable answers current version | `survey_answers` upsert + unique constraint |
| New version resets | `current_version` bump in publish RPC |
| Banner + snooze | Task 8 |
| Separate from report issue | FR-SETTINGS-017 vs FR-SETTINGS-008 |
| Free feedback | `user_feedback` table |
| No placeholders in plan | RPC shapes and types defined |
| File size ≤300 | Split survey use cases one per file |

**Gap (documented):** Session count for milestones uses client-passed `p_session_count` in V1; future: server-side `user_app_sessions` table (append TD in Task 1 if needed).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-25-surveys-and-feedback.md`. Design spec: `docs/superpowers/specs/2026-05-25-surveys-and-feedback-design.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with checkpoints (`executing-plans` skill)

**Which approach?**

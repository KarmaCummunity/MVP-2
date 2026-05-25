# Server-Driven Surveys & Feedback — Design

> **Status:** Approved (PM, 2026-05-25) — UI demo validated in `app/settings/survey-demo`.
> **Spec targets:** `docs/SSOT/spec/11_settings.md` — FR-SETTINGS-015..017 (to be added).
> **Backlog target:** P2.34 (to be added).
> **Pattern reference:** `docs/superpowers/specs/2026-05-24-server-driven-legal-documents-design.md` (server content, Studio publish, append-only answers).

---

## 1. Goal

Authenticated users can open **Settings → Surveys & feedback**, see active surveys loaded from Supabase, complete them in a native Hebrew RTL UI (validated demo), edit answers for the **current published version**, and submit optional free-text feedback. Product can publish new question sets without an app deploy via SQL/RPC in Supabase Studio. A gentle **prompt banner** appears after milestone criteria until the user completes the current version or snoozes for 7 days (device-local snooze only).

## 2. Non-goals (MVP)

- In-app admin UI to author surveys (Studio + `publish_survey_version` RPC).
- Multi-language (`language` column reserved, default `'he'`).
- External NPS link survey (KPI #8 stays out-of-product until a later FR).
- Anonymous / guest survey responses.
- Replacing **Report an issue** (`FR-SETTINGS-008` / `FR-MOD-002`) — support chat stays separate.

## 3. Product decisions (locked)

| Topic | Decision |
|-------|----------|
| Delivery | Native UI; questions/copy from server |
| Navigation | One question at a time + compact top map (number + 1–2 word label + status dot); non-linear jump |
| Question shape | Required rating 1–7 + optional free text per question |
| Completion | Always available in Settings; answers editable until a **new version** is published |
| Prompt | Banner after milestones + full screen in hub; snooze 7 days via AsyncStorage |
| Milestones (V1) | `sessions ≥ 3`, `first_closure` (≥1 `closed_delivered` post), `profile_complete` (`display_name` + ≥1 post) |

## 4. Routes (mobile)

| Route | Purpose |
|-------|---------|
| `/settings/surveys` | Hub: active surveys + "חוות דעת חופשית" |
| `/settings/survey/[slug]` | Survey runner (production; replaces demo) |
| `/settings/feedback` | Short free feedback form (rating optional + text) |

Demo route `/settings/survey-demo` removed from production settings list; keep behind `__DEV__` only until deleted.

## 5. Data model (summary)

See implementation plan `docs/superpowers/plans/2026-05-25-surveys-and-feedback.md` § Database for full DDL.

- `surveys` — slug, titles, `is_active`, `current_version`, prompt rules JSON
- `survey_versions` — immutable publish rows
- `survey_questions` — per version, ordered, Hebrew copy fields
- `survey_answers` — upsert per `(user_id, survey_id, version, question_id)`
- `user_feedback` — append-only free feedback rows (not chat)

## 6. FR-IDs (to add to `11_settings.md`)

- **FR-SETTINGS-015** — Surveys & feedback hub
- **FR-SETTINGS-016** — Server-driven survey runner (UX survey + future slugs)
- **FR-SETTINGS-017** — Free feedback form (DB only, no support thread)

---

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-25 | Initial design from brainstorming + approved UI demo |

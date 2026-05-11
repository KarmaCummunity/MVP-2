# Karma Community — Agent Bootstrap

> Workspace-level rule. Always loaded into context.

## You MUST read these before doing anything

1. **`docs/SSOT/spec/{domain}.md`** — the single source of truth per feature domain. Each file contains the full spec (FR-IDs, ACs, business rules) + a status header (✅/🟡/⏳). Read only the file relevant to your task.
2. **`docs/SSOT/BACKLOG.md`** — priority-ordered task queue (what's next, who owns it).
3. **`docs/SSOT/TECH_DEBT.md`** — active technical debt grouped by area. Scan items in the area you're touching before opening a PR; close adjacent debt opportunistically when scope is small.
4. **`docs/SSOT/DECISIONS.md`** — architecture & product decisions (D-* and EXEC-*). Check before proposing structural changes.

### Spec files (domain-per-file)

```
docs/SSOT/spec/
├── 01_auth_and_onboarding.md     FR-AUTH-*
├── 02_profile_and_privacy.md     FR-PROFILE-*
├── 03_following.md               FR-FOLLOW-*
├── 04_posts.md                   FR-POST-*
├── 05_closure_and_reopen.md      FR-CLOSURE-*
├── 06_feed_and_search.md         FR-FEED-*
├── 07_chat.md                    FR-CHAT-*
├── 08_moderation.md              FR-MOD-*
├── 09_notifications.md           FR-NOTIF-*
├── 10_statistics.md              FR-STATS-*
├── 11_settings.md                FR-SETTINGS-*
├── 12_super_admin.md             FR-ADMIN-*
└── 13_donations.md               FR-DONATE-*
```

## Spec Validation Gate (MANDATORY)

Before implementing ANY user request:

1. **Read** `docs/SSOT/spec/{relevant_domain}.md`
2. **Compare** the request against existing ACs
3. **If contradiction found** → STOP and report:
   > ⚠️ הבקשה שלך סותרת את האפיון:
   > - אפיון: [quote from spec]
   > - בקשה: [what you asked]
   > האם לעדכן את האפיון? (כן/לא)
   - If user approves → update spec FIRST, then implement
   - If user rejects → implement as-is, note deviation
4. **If new feature (not in spec)** → report: "הפיצ'ר הזה לא מופיע באפיון. להוסיף?"
5. **After implementation** → update status in spec: ⏳ → ✅

## Verification gate

Every response that includes code must begin with:

```
Mapped to spec: [FR-ID]. Refactor logged: [Yes/No/NA].
```

## You MUST follow these rules

- `.cursor/rules/srs-architecture.mdc` — Clean Architecture invariants, file-size caps, error handling.
- `.cursor/rules/project-status-tracking.mdc` — **mandatory** update of `BACKLOG.md` on every feature change.
- `.cursor/rules/git-workflow.mdc` — **mandatory** branch / commit / PR / merge workflow. Branches via `gh`, PRs auto-merge on green CI (squash). One-time machine setup: `SETUP_GIT_AGENT.md`.

## Parallel-agents protocol (when two agents are running)

Quick reference:

- **BE lane** owns `supabase/**` + `packages/infrastructure-supabase/**`.
- **FE lane** owns `apps/mobile/**` + `packages/ui/**`.
- **Shared contract** (`packages/{domain,application}/**`): FE leads domain types, BE leads port signatures. Contract changes ship as their own commit with `(contract)` scope (e.g. `feat(contract): add IPostRepository.list`).
- Branch naming: `<type>/<FR-id-or-scope>-<be|fe>-<slug>` (e.g. `feat/FR-POST-001-fe-feed-ui`).
- New tech-debt IDs: BE uses `TD-50..99`, FE uses `TD-100..149`.

## How to pick the next task (if none specified)

Open `docs/SSOT/BACKLOG.md` — pick the highest-priority `⏳ Planned` item. Move it to `🟡 In progress` before you start coding.

## Tech stack quick reference

- Monorepo: pnpm + turbo. `pnpm install` then `pnpm typecheck` / `pnpm test` / `pnpm ios` / `pnpm android` / `pnpm --filter @kc/mobile web`.
- Mobile: Expo + React Native + expo-router (typed routes), Hebrew RTL forced.
- Backend: Supabase (Auth, Postgres+RLS, Storage, Realtime, Edge Functions).
- Layers: `packages/{domain,application,infrastructure-supabase,ui}` + `apps/mobile`. Strict inward dependency direction.

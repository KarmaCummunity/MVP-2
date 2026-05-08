# Karma Community — Agent Bootstrap

> Workspace-level rule. Always loaded into context.

## You MUST read these before doing anything

1. **`docs/SSOT/PROJECT_STATUS.md`** — execution-state SSOT (where we are, what's done, what's next). Compact dashboard.
2. **`docs/SSOT/TECH_DEBT.md`** — active technical debt grouped by area. Scan items in the area you're touching before opening a PR; close adjacent debt opportunistically when scope is small.
3. **`docs/SSOT/SRS.md`** + the relevant `FR-*` file under `docs/SSOT/SRS/02_functional_requirements/` for the feature you're touching.
4. **`docs/SSOT/PRD_MVP_CORE_SSOT/`** — product intent (Hebrew).

> Historical feature log lives in `docs/SSOT/HISTORY.md` — read on demand, not every session.

## You MUST follow these rules

- `.cursor/rules/srs-architecture.mdc` — Clean Architecture invariants, file-size caps, error handling.
- `.cursor/rules/project-status-tracking.mdc` — **mandatory** update of `PROJECT_STATUS.md` on every feature change.
- `.cursor/rules/git-workflow.mdc` — **mandatory** branch / commit / PR / merge workflow. Branches via `gh`, PRs auto-merge on green CI (squash). One-time machine setup: `SETUP_GIT_AGENT.md`.

## Parallel-agents protocol (when two agents are running)

If you are one of two parallel agents (FE / BE), you MUST follow [`docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md`](docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md) — lane definitions, claim mechanism (draft PR = lock), contract-change rule, conflict tiebreakers.

Quick reference:

- **BE lane** owns `supabase/**` + `packages/infrastructure-supabase/**`.
- **FE lane** owns `apps/mobile/**` + `packages/ui/**`.
- **Shared contract** (`packages/{domain,application}/**`): FE leads domain types, BE leads port signatures. Contract changes ship as their own commit with `(contract)` scope (e.g. `feat(contract): add IPostRepository.list`).
- Branch naming: `<type>/<FR-id-or-scope>-<be|fe>-<slug>` (e.g. `feat/FR-POST-001-fe-feed-ui`).
- §3 Sprint Board rows use lane suffix (e.g. `P0.4-FE — Feed UI`); Owner is `agent-fe` or `agent-be`.
- New tech-debt IDs: BE uses `TD-50..99`, FE uses `TD-100..149`.

## Verification gate

Every response that includes code must begin with:

```
Mapped to SRS: [Requirement ID]. Refactor logged: [Yes/No/NA].
```

## How to pick the next task (if none specified)

Open `docs/SSOT/PROJECT_STATUS.md` §2 — pick the highest-priority `⏳ Planned` item. Move it to `🟡 In progress` before you start coding.

## Tech stack quick reference

- Monorepo: pnpm + turbo. `pnpm install` then `pnpm typecheck` / `pnpm test` / `pnpm ios` / `pnpm android` / `pnpm --filter @kc/mobile web`.
- Mobile: Expo + React Native + expo-router (typed routes), Hebrew RTL forced.
- Backend: Supabase (Auth, Postgres+RLS, Storage, Realtime, Edge Functions).
- Layers: `packages/{domain,application,infrastructure-supabase,ui}` + `apps/mobile`. Strict inward dependency direction.

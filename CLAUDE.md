# Karma Community — Agent Bootstrap

> Workspace-level rule. Always loaded into context.

## You MUST read these before doing anything

1. **`docs/SSOT/PROJECT_STATUS.md`** — execution-state SSOT (where we are, what's done, what's next).
2. **`docs/SSOT/SRS.md`** + the relevant `FR-*` file under `docs/SSOT/SRS/02_functional_requirements/` for the feature you're touching.
3. **`docs/SSOT/PRD_MVP_CORE_SSOT/`** — product intent (Hebrew).

## You MUST follow these rules

- `.cursor/rules/srs-architecture.mdc` — Clean Architecture invariants, file-size caps, error handling.
- `.cursor/rules/project-status-tracking.mdc` — **mandatory** update of `PROJECT_STATUS.md` on every feature change.

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

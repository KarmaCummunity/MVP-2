# Environments

> **Canonical source for branch ↔ Supabase ↔ Railway ↔ env-var mapping.**
> If another doc disagrees, this one wins. Last reviewed: 2026-05-22.

## TL;DR

| Concern | `main` (production) | `dev` (working branch) |
|---|---|---|
| Git branch | `main` | `dev` |
| Supabase project | `slxijdfvinbjmrsfgbzx` — https://slxijdfvinbjmrsfgbzx.supabase.co | `roeefqpdbftlndzsvhfj` — https://roeefqpdbftlndzsvhfj.supabase.co |
| Railway service env | `prod` (set `PROD_WEB_URL` in GitHub Actions variables — see [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)) | `dev` (`mvp-2-dev.up.railway.app`) |
| `EXPO_PUBLIC_ENVIRONMENT` | `production` | `development` |
| In-app dev banner | hidden | visible at top of every screen when the client bundle is dev (see below) |

## Branching rules

1. **`dev` is the working branch.** All feature/fix/refactor PRs target `dev`, not `main`.
2. **`dev` is never behind `main`.** Every push to `main` triggers `.github/workflows/sync-main-to-dev.yml`, which merges `main` into `dev`. If that workflow fails (merge conflict), resolving it is the operator's first priority.
3. **`main` is fast-forward only from `dev`.** Production releases happen by opening a PR from `dev` → `main` and squash-merging.
4. **Direct pushes to `main` are reserved for trivial doc/CI hotfixes** (see `CLAUDE.md` §6 "Change classes"). Whenever they happen, the sync workflow brings them into `dev` automatically.
5. **Never force-push to `main` or `dev`.** Never delete either branch. Branch-protection rules in GitHub enforce both.

## Required environment variables

All variables prefixed `EXPO_PUBLIC_*` are exposed to the client bundle by Expo's bundler. Variables without that prefix are server-only.

| Variable | `main` value | `dev` value | Where it's read |
|---|---|---|---|
| `EXPO_PUBLIC_ENVIRONMENT` | `production` | `development` | `apps/mobile/src/config/environment.ts` — drives the in-app dev banner |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://slxijdfvinbjmrsfgbzx.supabase.co` | `https://roeefqpdbftlndzsvhfj.supabase.co` | `packages/infrastructure-supabase/src/client.ts` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | (publishable key for prod project) | (publishable key for dev project) | `packages/infrastructure-supabase/src/client.ts` |

> **Pitfall:** Expo only exposes vars that start with `EXPO_PUBLIC_`. A var named `PUBLIC_ENVIRONMENT` (no `EXPO_` prefix) is invisible to the client bundle.
>
> **Docker / Railway web build:** The repo root `Dockerfile` builder stage must declare an `ARG` + `ENV` for each `EXPO_PUBLIC_*` value that must appear in the static web bundle. Service variables in the Railway UI are **not** visible inside `RUN pnpm build:web` unless they are wired through that stage (we ship `EXPO_PUBLIC_SUPABASE_*` and `EXPO_PUBLIC_ENVIRONMENT`). If the dev banner is missing on the hosted URL but variables look correct in Railway, redeploy after a Dockerfile fix or add the missing `ARG`/`ENV` pair.
>
> **Local Metro:** `pnpm ios` / `expo start` runs a `__DEV__` bundle, which shows the dev strip even without `EXPO_PUBLIC_ENVIRONMENT`. That variable is still required for **non-`__DEV__`** builds (e.g. `expo export` on CI) so testers see the strip without a debug client.

## Runbook: `dev` branch was deleted

If `git ls-remote --heads origin | grep dev` returns nothing (e.g. an agent accidentally deleted it), restore it from `main`:

```bash
git fetch origin main
git push origin refs/remotes/origin/main:refs/heads/dev
```

Then in Railway → service Settings → reconnect the dev environment to the `dev` branch. Then verify branch protection is back in place (Settings → Branches → `dev` → require PRs + disable force-push + disable deletion).

## Runbook: dev banner not showing on the dev deployment

Checklist in order:

0. If you are on **local Metro** (`expo start`) and still see no strip, you are likely running a **release** build (`__DEV__` off). Use a debug build or set `EXPO_PUBLIC_ENVIRONMENT=development` and rebuild.
1. **Railway + Docker:** In Railway Variables, confirm `EXPO_PUBLIC_ENVIRONMENT=development` (exact name). Confirm the repo `Dockerfile` builder passes that name into the build stage (`ARG`/`ENV`); without it, `expo export` never sees the variable even if Railway shows it.
2. Trigger a redeploy — env-var and Dockerfile changes require a **new image build**.
3. Open the dev URL in an incognito window (cached service worker can serve stale bundles).
4. In DevTools console: `process.env` is not present at runtime in Expo; instead inspect the bundle by searching for `'development'` in the JS bundle source, OR temporarily add `console.log('env', getAppEnvironment())` to verify the value reached the client.

## Sync workflow internals

`.github/workflows/sync-main-to-dev.yml`:

- Triggers: every push to `main`, plus manual `workflow_dispatch`.
- Concurrency: `sync-main-to-dev` group with `cancel-in-progress: false` — back-to-back pushes queue rather than skip.
- Strategy: `git merge --no-edit origin/main` on `dev`. Fast-forward when possible; merge commit otherwise.
- Failure mode: merge conflict → workflow fails, operator resolves manually. Do not auto-resolve.

## DB deploy automation

`.github/workflows/db-deploy.yml` trigger modes:

- **Auto** — on push to `dev` or `main` when any of these paths change: `supabase/migrations/**`, `supabase/seed.sql`, `supabase/config.toml`, or the workflow file. Pending migrations are applied via `supabase db push` to the matching GitHub Environment: `dev` → `supabase-dev` (`roeefqpdbftlndzsvhfj`); `main` → `supabase-prod` (`slxijdfvinbjmrsfgbzx`). PRs must keep **DB validate** (`.github/workflows/db-validate.yml`) green before merge — it applies all migrations on a fresh local stack.
- **Manual** — `workflow_dispatch` lets an operator target `supabase-prod` or `supabase-dev`. Defaults to dry-run; flip `apply` to true to push (useful for inspection, retries, or one-off applies).

Concurrency group `db-deploy-<environment>` (with `cancel-in-progress: false`) ensures back-to-back migration pushes queue rather than race.

**Prod apply gate (2026-05-28, `D-53`):** pushes to `main` (and manual `workflow_dispatch` applies targeting `supabase-prod`) run `supabase db push --dry-run` immediately before the real `db push`. No human reviewers on the `supabase-prod` environment — protection is automated CI only.

**Main release guard:** `.github/workflows/ci-main-guard.yml` on PRs to `main` enforces head branch `dev` and runs `scripts/check-migration-safety.mjs` over all migrations (blocks `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, unqualified `DELETE FROM` unless the line includes `migration-safety: allow`).

## Production release

Operator checklist: [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md).

**CI layout (2026-05-22):** PR/push checks are split by responsibility with path filters so unrelated work doesn't burn time:

- `.github/workflows/ci-frontend.yml` — `app/**`, `Dockerfile`, Hebrew scan. Jobs: `typecheck · test · lint`, `Hebrew source scan (no inline UI copy)`, `web export (production bundle)` (main-only).
- `.github/workflows/ci-backend.yml` — `supabase/**` + the migration chain script. Jobs: `migration chain lint`, then `apply migrations · rls · types · sql probes` against a fresh local Supabase stack (replaces the old `db-validate.yml`).
- `.github/workflows/ci-contract.yml` — infra/application/domain packages + migrations + locale + manifest script. Jobs: `rpc · table contract`, `coalesce mirror · layer invariants` (file-size + layer + domain-typed-error guard), `web manifest parity`.
- `.github/workflows/ci-pr.yml` — `pull_request` only, non-draft. Job: `PR hygiene` (Conventional Commits title + required `Mapped to spec` line).

Draft PRs skip every job except none (PR hygiene waits for `ready_for_review`). Branch protection on `main` requires the gates listed in [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md#merge-gates-automated--must-be-green).

**CI gates on `main` PRs:** `CI — frontend / web export (production bundle)` mirrors the Dockerfile builder (`EXPO_PUBLIC_*` + `pnpm build:web`).

**Post-merge smoke:** `.github/workflows/prod-smoke.yml` polls repository variable **`PROD_WEB_URL`** after app/Dockerfile changes on `main`. Set it under GitHub → Settings → Secrets and variables → Actions → Variables.

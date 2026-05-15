# Environments

> **Canonical source for branch ↔ Supabase ↔ Railway ↔ env-var mapping.**
> If another doc disagrees, this one wins. Last reviewed: 2026-05-15.

## TL;DR

| Concern | `main` (production) | `dev` (working branch) |
|---|---|---|
| Git branch | `main` | `dev` |
| Supabase project | `slxijdfvinbjmrsfgbzx` — https://slxijdfvinbjmrsfgbzx.supabase.co | `roeefqpdbftlndzsvhfj` — https://roeefqpdbftlndzsvhfj.supabase.co |
| Railway service env | `prod` | `dev` (`mvp-2-dev.up.railway.app`) |
| `EXPO_PUBLIC_ENVIRONMENT` | `production` | `development` |
| In-app dev banner | hidden | visible at top of every screen |

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

> **Pitfall:** Expo only exposes vars that start with `EXPO_PUBLIC_`. A var named `PUBLIC_ENVIRONMENT` (no `EXPO_` prefix) is invisible to the client bundle. If the dev banner doesn't appear, check the Railway env var name first.

## Runbook: `dev` branch was deleted

If `git ls-remote --heads origin | grep dev` returns nothing (e.g. an agent accidentally deleted it), restore it from `main`:

```bash
git fetch origin main
git push origin refs/remotes/origin/main:refs/heads/dev
```

Then in Railway → service Settings → reconnect the dev environment to the `dev` branch. Then verify branch protection is back in place (Settings → Branches → `dev` → require PRs + disable force-push + disable deletion).

## Runbook: dev banner not showing on the dev deployment

Checklist in order:

1. Railway dev service → Variables → confirm `EXPO_PUBLIC_ENVIRONMENT=development` exists with the **exact** name (not `PUBLIC_ENVIRONMENT`, not `EXPO_ENVIRONMENT`).
2. Trigger a redeploy — env-var changes don't apply to running builds.
3. Open the dev URL in an incognito window (cached service worker can serve stale bundles).
4. In DevTools console: `process.env` is not present at runtime in Expo; instead inspect the bundle by searching for `'development'` in the JS bundle source, OR temporarily add `console.log('env', getAppEnvironment())` to verify the value reached the client.

## Sync workflow internals

`.github/workflows/sync-main-to-dev.yml`:

- Triggers: every push to `main`, plus manual `workflow_dispatch`.
- Concurrency: `sync-main-to-dev` group with `cancel-in-progress: false` — back-to-back pushes queue rather than skip.
- Strategy: `git merge --no-edit origin/main` on `dev`. Fast-forward when possible; merge commit otherwise.
- Failure mode: merge conflict → workflow fails, operator resolves manually. Do not auto-resolve.

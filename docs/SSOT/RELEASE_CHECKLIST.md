# Production release checklist (`dev` → `main`)

> **Scope:** Web app on Railway + Supabase prod (`slxijdfvinbjmrsfgbzx`).
> **Branch topology:** [`ENVIRONMENTS.md`](./ENVIRONMENTS.md) · **DB/Functions runbook:** [`OPERATOR_RUNBOOK.md`](./OPERATOR_RUNBOOK.md)

Use this checklist for every production release. CI automates gates; the agent (CTO) executes the flow — no human approval on deploy environments (`D-53`).

---

## Before opening the release PR

- [ ] **`dev` is green** — latest `dev` commit passed CI (typecheck, test, lint, DB validate if migrations touched).
- [ ] **Dev smoke done** — auth, feed load, one write path (create/edit post), chat inbox open. Skip only for pure CI/docs hotfixes to `main`.
- [ ] **Migration review** — if `supabase/migrations/**` changed: read each new migration; confirm backward-compatible; note any manual operator steps in the PR body.
- [ ] **Edge Functions review** — if `supabase/functions/**` changed: note which functions changed; plan post-merge smoke (donation link edit — see OPERATOR_RUNBOOK § Edge Functions).
- [ ] **Release PR** — open **`dev` → `main`**, Conventional Commits title, PR body includes **Mapped to spec** and migration/rollout notes.

---

## Merge gates (automated — must be green)

Required on the release PR (GitHub branch protection on `main`):

| Check | Workflow | Job |
| --- | --- | --- |
| Quality | CI — frontend | `typecheck · test · lint` |
| i18n guard | CI — frontend | `Hebrew source scan (no inline UI copy)` |
| Web bundle | CI — frontend | `web export (production bundle)` |
| Migration chain | CI — backend | `migration chain lint` |
| DB + RLS + types | CI — backend | `apply migrations · rls · types · sql probes` |
| Contract | CI — contract | `rpc · table contract` |
| PR hygiene | CI — PR hygiene | `PR hygiene` |
| Main release guard | CI — main release guard | `release PR source is dev` + `migration destructive-op scan` |

> Path-filtered workflows: a release PR that only touches `docs/**` will not run the frontend/backend/contract workflows. Such PRs are rare; release PRs typically touch app + supabase paths and trigger the full set. `CI — PR hygiene` always runs on non-draft PRs.

Do **not** require post-merge deploy jobs on the PR rule (`DB deploy`, `Supabase Functions deploy`, `Prod smoke`).

---

## Immediately after squash-merge to `main`

Watch **Actions** on `main` (in order, as applicable):

1. **CI** — push workflow green.
2. **DB deploy** — when migration paths changed: **dry-run then apply** to `supabase-prod` (no human gate).
3. **Supabase Functions deploy** — runs when `supabase/functions/**` changed.
4. **Prod smoke** — polls `PROD_WEB_URL` after app, Dockerfile, migration, or function changes on `main`.
5. **Sync main → dev** — must succeed; if it fails (merge conflict), fix before any further `dev` work.

Watch **Railway → prod** — new deployment from `main` reaches **Success**.

---

## Post-deploy smoke (operator — ~5 min)

Automated **Prod smoke** only checks HTTP 200 on the prod URL. Complete these manually:

- [ ] **Prod URL loads** — incognito window, no dev banner.
- [ ] **Sign-in** — Google (web) or email OTP path you ship.
- [ ] **Feed** — home feed renders.
- [ ] **One write path** — e.g. edit profile or create draft post.
- [ ] **If migrations merged** — exercise the feature that migration enables; run SQL checks from OPERATOR_RUNBOOK for that migration if listed.
- [ ] **If functions merged** — donation link edit smoke (same row `id`, no duplicate insert).

---

## Rollback (if prod is broken)

| Layer | Action |
| --- | --- |
| **App (Railway)** | Railway → prod service → Deployments → redeploy previous successful image. |
| **DB** | **No auto-rollback.** Forward-fix with a new migration or manual SQL per OPERATOR_RUNBOOK. Prefer backward-compatible migrations. |
| **Edge Functions** | Redeploy from last known-good commit: `workflow_dispatch` on **Supabase Functions deploy**, or local `supabase functions deploy` from that commit. |
| **Git** | Do **not** force-push `main`. Forward-fix on `dev`, release again. |

---

## GitHub settings (one-time)

| Setting | Location | Value |
| --- | --- | --- |
| Branch protection on `main` | Settings → Branches → `main` | Block direct pushes; require status checks (table above) — **no required human reviewers** (`D-53`) |
| Required status checks | Same | Include **CI — main release guard** on `dev` → `main` PRs |
| `supabase-prod` environment | Settings → Environments → `supabase-prod` | Secrets only (`SUPABASE_*`); **do not** enable required reviewers |
| Prod web URL for smoke | Settings → Secrets and variables → Actions → **Variables** | `PROD_WEB_URL` = `https://<your-prod>.up.railway.app` |

Document the canonical prod URL in [`ENVIRONMENTS.md`](./ENVIRONMENTS.md) once confirmed.

---

## Quick reference — prod targets

| Concern | Value |
| --- | --- |
| Git branch | `main` |
| Supabase project | `slxijdfvinbjmrsfgbzx` |
| `EXPO_PUBLIC_ENVIRONMENT` | `production` |
| Railway service | `prod` (branch `main`) |

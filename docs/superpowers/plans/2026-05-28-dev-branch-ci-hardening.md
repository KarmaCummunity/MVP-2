# Dev Branch CI/CD Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the dev-vs-main protection gap by running migration destructive-op scans and DB dry-run before apply on `dev`, and document GitHub branch-protection required checks for the working branch.

**Architecture:** Add a dedicated `ci-dev-guard.yml` workflow (migration safety only — no `dev`→`main` release-source job). Extend `db-deploy.yml` so **all** auto/manual applies run `supabase db push --dry-run` first (dev and prod). Update SSOT + operator docs with the exact status-check names for `dev` branch protection. Do **not** copy prod-only gates (prod-smoke, functions deploy to prod, release-source enforcement).

**Tech Stack:** GitHub Actions, Node 22, `scripts/check-migration-safety.mjs`, Supabase CLI 2.99.0.

---

## File map

| File | Responsibility |
| --- | --- |
| `.github/workflows/ci-dev-guard.yml` | **Create** — migration destructive-op scan on every non-draft PR/push to `dev` |
| `.github/workflows/db-deploy.yml` | **Modify** — dry-run before apply for `supabase-dev` and `supabase-prod` |
| `app/package.json` | **Modify** — `check:migration-safety`, extend `check:backend-guards` + `test:scripts` |
| `docs/SSOT/ENVIRONMENTS.md` | **Modify** — dev merge gates + branch protection table |
| `docs/SSOT/RELEASE_CHECKLIST.md` | **Modify** — cross-link dev gates; keep main table unchanged |
| `docs/SSOT/DECISIONS.md` | **Modify** — add `D-54` |
| `docs/SSOT/BACKLOG.md` | **Modify** — `INFRA-DEV-CI-HARDENING` → ✅ Done |
| `SETUP_GIT_AGENT.md` | **Modify** — section for `dev` branch protection (operator UI) |

---

### Task 1: `ci-dev-guard` workflow

**Files:**
- Create: `.github/workflows/ci-dev-guard.yml`

- [ ] **Step 1: Create workflow**

```yaml
name: CI — dev guard

# Catches destructive migration SQL before merge/push to `dev` (parity with
# ci-main-guard migration-safety, without prod-only release-source job).

on:
  pull_request:
    branches: [dev]
  push:
    branches: [dev]
    paths:
      - 'supabase/migrations/**'
      - '.github/workflows/ci-dev-guard.yml'
      - 'scripts/check-migration-safety.mjs'

concurrency:
  group: ci-dev-guard-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  migration-safety:
    name: migration destructive-op scan
    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - name: Scan all migrations
        run: node scripts/check-migration-safety.mjs
```

- [ ] **Step 2: Validate YAML** — open PR or `actionlint` if installed locally.

---

### Task 2: DB deploy dry-run on dev

**Files:**
- Modify: `.github/workflows/db-deploy.yml`

- [ ] **Step 1: Change dry-run step `if`**

Replace prod-only condition:

```yaml
      - name: Dry-run push (before apply)
        if: >-
          github.event_name == 'push' ||
          (github.event_name == 'workflow_dispatch' && inputs.apply)
        run: supabase db push --dry-run --include-all --linked --yes
```

Remove `env.IS_PROD_TARGET` from that step (keep `IS_PROD_TARGET` env only if still used elsewhere — delete if unused).

- [ ] **Step 2: Update workflow header comment** — dry-run applies to both `supabase-dev` and `supabase-prod`.

---

### Task 3: Local script wiring

**Files:**
- Modify: `app/package.json`

- [ ] **Step 1: Add scripts**

```json
"check:migration-safety": "node ../scripts/check-migration-safety.mjs",
"check:backend-guards": "node ../scripts/check-migration-chain.mjs && node ../scripts/check-migration-safety.mjs && node ../scripts/check-rpc-contract.mjs",
"test:scripts": "node --test ../scripts/check-migration-chain.test.mjs ../scripts/check-migration-safety.test.mjs ../scripts/check-rpc-contract.test.mjs ../scripts/check-web-manifest.test.mjs"
```

- [ ] **Step 2: Run tests**

```bash
cd app && pnpm test:scripts
```

Expected: all PASS.

---

### Task 4: SSOT + operator docs

**Files:**
- Modify: `docs/SSOT/ENVIRONMENTS.md`, `docs/SSOT/RELEASE_CHECKLIST.md`, `docs/SSOT/DECISIONS.md`, `docs/SSOT/BACKLOG.md`, `SETUP_GIT_AGENT.md`

- [ ] Document dev required status checks (table matching GitHub job names).
- [ ] Add `D-54` decision (selective dev parity, not 1:1 main copy).
- [ ] Mark `INFRA-DEV-CI-HARDENING` done in BACKLOG.

---

### Task 5: GitHub branch protection (operator — manual)

**Files:** GitHub UI only — Settings → Branches → `dev`

- [ ] Require pull request before merging (0 approvals).
- [ ] Block force-push and branch deletion.
- [ ] Require status checks (names from ENVIRONMENTS.md dev table), including **CI — dev guard / migration destructive-op scan**.
- [ ] Do **not** add **CI — main release guard** checks to `dev`.

---

## Self-review

| Requirement | Task |
| --- | --- |
| Migration safety on `dev` PRs | Task 1 |
| DB dry-run before dev apply | Task 2 |
| Local `pnpm check:migration-safety` | Task 3 |
| Documented branch protection | Tasks 4–5 |
| No prod-smoke / release-source on dev | Explicitly excluded |

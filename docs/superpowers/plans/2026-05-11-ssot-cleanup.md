# SSOT Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all agent rules into a single `CLAUDE.md`, scrub 17 dead-file references across 13 active docs, add a CI guard, and ship as one atomic PR.

**Architecture:** Y-style consolidation (medium): pull content from `.cursor/rules/*` into `CLAUDE.md`, dedupe overlapping sections, drop dead refs and unused rules. The 3 `.cursor/rules/*` become pointer-stubs (so Cursor's `alwaysApply: true` still loads them). A new `AGENTS.md` root pointer supports Codex/Copilot. A new `app/scripts/check-ssot-links.mjs` runs in CI to prevent regression.

**Tech Stack:** Markdown only for content. Node ESM for the CI script. `pnpm lint:arch` is the existing CI hook we extend.

**Spec:** [`docs/superpowers/specs/2026-05-11-ssot-cleanup-design.md`](../specs/2026-05-11-ssot-cleanup-design.md)

---

## File Structure

**Files created:**
- `AGENTS.md` — root pointer to `CLAUDE.md` (3 lines)
- `app/scripts/check-ssot-links.mjs` — CI guard against dead refs (~40 lines)

**Files rewritten:**
- `CLAUDE.md` — consolidated rules hub (~200 lines, was ~70)
- `.cursor/rules/srs-architecture.mdc` — shrink to 8-line pointer
- `.cursor/rules/git-workflow.mdc` — shrink to 8-line pointer
- `.cursor/rules/project-status-tracking.mdc` — shrink to 8-line pointer
- `.github/PULL_REQUEST_TEMPLATE.md` — replace "PROJECT_STATUS.md updated" section

**Files edited (surgical):**
- `docs/SSOT/OPERATOR_RUNBOOK.md` — header line 3
- `docs/SSOT/TECH_DEBT.md` — header line 9 + close TD-4 + close TD-43 + fix line 138
- `docs/SSOT/DECISIONS.md` — back-link line 3 + 2 inline notes (D-1, D-3) + EXEC-9 lines 352, 380
- `docs/SSOT/spec/01_auth_and_onboarding.md` — line 89
- `docs/SSOT/spec/02_profile_and_privacy.md` — line 48
- `docs/SSOT/spec/12_super_admin.md` — line 157
- `docs/superpowers/specs/2026-05-11-delete-account-design.md` — header line
- `docs/superpowers/plans/2026-05-11-delete-account.md` — header line
- `docs/superpowers/plans/2026-05-11-edit-post.md` — header line
- `app/package.json` — extend `lint:arch` script
- `app/scripts/check-architecture.mjs` — comment header (line 2 stale ref to `.cursor/rules/srs-architecture.mdc`)

**Not touched:** `docs/SSOT/BACKLOG.md` (already clean), `docs/SSOT/archive/**` (frozen by definition), 10 other `docs/SSOT/spec/*.md` files (no dead refs).

---

## Branch & PR plan

- Branch: `chore/docs-unify-ssot`
- PR title: `chore(docs): unify SSOT — consolidate rules into CLAUDE.md + scrub dead refs`
- Commits: 8 logical commits inside one PR (each task ends with its own commit).
- Auto-merge: `gh pr merge --auto --squash --delete-branch` after CI green.

---

## Task 1 — Branch setup + write the CI guard

**Files:**
- Create branch: `chore/docs-unify-ssot`
- Create: `app/scripts/check-ssot-links.mjs`

**Step rationale:** Write the verification tool FIRST so we can use it to count remaining dead refs during cleanup. Initially it will report 17+ violations; cleanup ends when it reports 0.

- [ ] **Step 1.1: Sync main + create branch**

Run:
```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c chore/docs-unify-ssot
```

Expected: branch created, working tree clean (the local `.claude/launch.json` port change and `.claude/.DS_Store` are pre-existing local-only diffs — leave them out of every commit; use `git add <specific-file>` not `git add .`).

- [ ] **Step 1.2: Create `app/scripts/check-ssot-links.mjs`**

Write the file with this exact content:

```javascript
#!/usr/bin/env node
// Guards against dead-file references in active docs. Run from `app/` via
// `pnpm lint:arch` (chained after check-architecture.mjs). Exits non-zero
// if any of the dead refs below appear outside the excluded paths.
//
// To add a new dead ref: extend DEAD_REFS. To allow a path to keep a ref
// (e.g., archive content), extend EXCLUDE.

import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

const DEAD_REFS = [
  'PROJECT_STATUS',
  'HISTORY\\.md',
  'CODE_QUALITY',
  'SRS/02_functional_requirements',
  'PRD_MVP_CORE_SSOT',
  'docs/SSOT/SRS\\.md',
];

const EXCLUDE = [
  ':!docs/SSOT/archive/',
  ':!.claude/worktrees/',
  ':!docs/superpowers/',
  ':!app/scripts/check-ssot-links.mjs',
  // DECISIONS.md preserves historical refs in D-1 / D-3 (annotated with
  // inline `> Note (2026-05-11)` blocks pointing to the live source).
  // Excluded so the lint doesn't fail on intentional historical text.
  ':!docs/SSOT/DECISIONS.md',
];

const pattern = `(${DEAD_REFS.join('|')})`;

try {
  const out = execSync(
    `git -C "${REPO_ROOT}" grep -nE '${pattern}' -- ${EXCLUDE.join(' ')}`,
    { encoding: 'utf8' }
  );
  if (out.trim()) {
    console.error('❌ Dead doc references found in active docs:\n');
    console.error(out);
    console.error('Fix: replace with a reference to a live file, or move the content to docs/SSOT/archive/.');
    process.exit(1);
  }
} catch (e) {
  if (e.status === 1) {
    console.log('✅ No dead SSOT references');
    process.exit(0);
  }
  console.error('check-ssot-links: unexpected error', e);
  process.exit(2);
}
```

- [ ] **Step 1.3: Run the script — verify it detects current dead refs**

Run:
```bash
node app/scripts/check-ssot-links.mjs
```

Expected: exit code 1, output lists 17+ dead-ref lines across `.cursor/rules/`, `docs/SSOT/`, `.github/`, etc. This proves the regex works.

- [ ] **Step 1.4: Commit**

Run:
```bash
git add app/scripts/check-ssot-links.mjs
git commit -m "chore(scripts): add check-ssot-links.mjs CI guard"
```

---

## Task 2 — Rewrite `CLAUDE.md` (the consolidated rules hub)

**Files:**
- Modify: `CLAUDE.md` (full rewrite)

- [ ] **Step 2.1: Replace the entire content of `CLAUDE.md`**

Write the file with this exact content:

````markdown
# Karma Community — Agent Bootstrap

> **Single source of truth for all agent rules in this repo.** If anything below conflicts with another file, this one wins.

## 1. Required reading (before doing anything)

1. **`docs/SSOT/spec/{domain}.md`** — single source of truth per feature domain. Each file is the full spec (FR-IDs, ACs, business rules) plus a status header (✅/🟡/⏳). Read only the file relevant to your task.
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

## 2. Spec Validation Gate

Before implementing ANY user request:

1. **Read** `docs/SSOT/spec/{relevant_domain}.md`.
2. **Compare** the request against existing ACs.
3. **If contradiction found** → STOP and report:
   > ⚠️ הבקשה שלך סותרת את האפיון:
   > - אפיון: [quote from spec]
   > - בקשה: [what you asked]
   > האם לעדכן את האפיון? (כן/לא)
   - If user approves → update spec FIRST, then implement.
   - If user rejects → implement as-is, note deviation.
4. **If new feature (not in spec)** → report: "הפיצ'ר הזה לא מופיע באפיון. להוסיף?"
5. **After implementation** → update status in spec: ⏳ → ✅.

## 3. Verification gate

Every response that includes code must begin with:

```
Mapped to spec: [FR-ID]. Refactor logged: [Yes/No/NA].
```

Use `NA` for pure tooling / docs / infra-only changes.

## 4. SSOT update workflow

### Before you start any feature work

1. Read `docs/SSOT/BACKLOG.md` — confirm the feature isn't already done, and pick the highest-priority ⏳ item if none was assigned.
2. Read the matching `docs/SSOT/spec/{domain}.md`.
3. Move the task in `BACKLOG.md` from `⏳ Planned` → `🟡 In progress`.

### While working

- If you discover technical debt outside the immediate scope, append a row to `docs/SSOT/TECH_DEBT.md` under the right Active section (BE: `TD-50..99`, FE: `TD-100..149`). Do **not** refactor inline.
- If a product/architecture decision is made on the fly, append it to `docs/SSOT/DECISIONS.md`.

### Before you call the work done

You MUST update SSOT docs in the **same** change-set as your code:

1. **`BACKLOG.md`**: flip the status to `✅ Done` (or `🟡 In progress` if partial).
2. **`spec/{domain}.md`**: update the status header if all ACs for the domain are complete.
3. **`TECH_DEBT.md`**: close resolved TDs (move to Resolved) and add new ones.

### What does NOT need an SSOT update

- Pure tooling changes (CI config, linter rules, dependency bumps with no behavior change).
- Documentation-only edits to spec files or this file.
- Hotfixes that don't change any AC of an `FR-*`.

### If you cannot update `BACKLOG.md`

Stop. Either you don't have write access, the feature isn't tracked, or scope is unclear. Surface the issue to the user before proceeding — do not silently skip the update.

## 5. Clean Architecture invariants

```
infrastructure-supabase  →  application  →  domain
       (impl)              (use cases)     (pure)
```

- **`packages/domain/`** — entities, value objects, invariants. **Zero dependencies** on `node_modules` (besides `typescript` dev-dep), zero imports from `application` or `infrastructure-*`. Entities prefer `readonly` fields.
- **`packages/application/`** — use cases (one file per use case), repository / service ports (`I*.ts` interfaces). May depend on `@kc/domain`. **No I/O, no Supabase, no React.**
- **`packages/infrastructure-supabase/`** — adapters that implement application ports. Owns Supabase, network, storage. **Never imported from `domain` or `application`.**
- **`packages/ui/`** — design tokens, shared components. May depend on React Native primitives but not on `domain` business rules.
- **`apps/mobile/`** — composition root: instantiates infrastructure, injects into use cases, wires to React.

If you catch yourself importing `@kc/infrastructure-supabase` or `@supabase/supabase-js` from a `domain` or `application` file, **stop and revert** — push the integration to a port + adapter.

### Hard constraints

- **File size cap**: ≤ 200 lines per file. Split if you exceed. Enforced by `pnpm lint:arch`.
- **Indentation cap**: ≤ 3 levels. Extract if deeper.
- **Cyclomatic complexity**: prefer many small functions over one large one.
- **No speculative abstractions** (YAGNI). No "nice-to-have" generalization unless an FR demands it.
- **Minimal-footprint edits**: prefer atomic, localized changes. Don't rewrite a function to fix one branch.

### Error handling

- Domain code throws domain-specific error classes (e.g., `AuthError`, `PostError`). Never raw `Error`.
- Application/infrastructure layers catch domain errors and map to user-visible states (UI alerts, toasts) or HTTP responses (Edge Functions).
- Stack traces never leak to the UI or to API consumers.

### "Propose and Proceed" rule

When you spot tech debt outside the immediate scope:

1. Append a row to `docs/SSOT/TECH_DEBT.md` (Active section, right lane).
2. Continue the original task. **Do not refactor inline.**

### Testing protocol

- Any new domain or application code ships with unit tests beside it (`__tests__/` directory inside the package).
- Tests cover both happy path and at least one boundary / error condition.
- Test runner: `vitest`. Run with `pnpm --filter @kc/<package> test`.

## 6. Git & PR workflow

> Repo: `KarmaCummunity/MVP-2` · Default branch: `main` · Merge strategy: **squash** · Auto-merge: **on, after CI passes**.

### Pre-flight (once per session)

```bash
gh --version              # GitHub CLI installed
gh auth status            # Logged in to github.com
git config user.name      # non-empty
git config user.email     # non-empty
gh repo view --json nameWithOwner -q .nameWithOwner   # KarmaCummunity/MVP-2
```

If any check fails, stop and point the user to `SETUP_GIT_AGENT.md`. Do not improvise.

### Change classes

| Class                 | Trigger                                              | Direct push to `main`?  |
| --------------------- | ---------------------------------------------------- | ----------------------- |
| **`hotfix-trivial`**  | Typo in docs / comment / string. No code logic.      | Allowed (with caution)  |
| **`feature`**         | Anything tied to an `FR-*` or user-visible.          | **Forbidden** — PR only |
| **`fix`**             | Bug fix that changes runtime behavior.               | **Forbidden** — PR only |
| **`refactor`**        | Internal restructure, no behavior change.            | **Forbidden** — PR only |
| **`chore`**           | Tooling, deps, CI, configs.                          | **Forbidden** — PR only |
| **`docs`**            | Doc-only edit larger than a single line / typo.      | **Forbidden** — PR only |

When in doubt, open a PR.

### Branch naming

`<type>/<FR-id-or-scope>-<kebab-short-desc>`

- `type` ∈ `feat | fix | refactor | chore | docs | test`
- Include the `FR-*` ID if one exists; otherwise a 1-2 word scope.
- Slug ≤ 50 chars.

Examples: `feat/FR-AUTH-001-otp-login`, `fix/FR-FEED-014-empty-state-crash`, `chore/ci-typecheck`.

### Conventional Commits (English, mandatory)

`<type>(<scope>)?: <subject>`

- **Type**: `feat | fix | refactor | chore | docs | test | perf | build | ci | style`.
- **Scope** (optional): `domain`, `mobile`, `infra`, `ui`, `ssot`, `ci`.
- **Subject**: imperative, lowercase, no trailing period, ≤ 72 chars.
- **Body**: explain *why*, not *what*. Reference `FR-*` IDs.
- **Footer**: `BREAKING CHANGE: …` if applicable; `Closes #N` for issues.

### Pre-push gates (from `app/`)

```bash
cd app
pnpm typecheck
pnpm test
pnpm lint
```

All three must be green before `git push`. Never push red code.

### Standard PR workflow

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feat/FR-AUTH-001-otp-login
# … atomic commits …
( cd app && pnpm typecheck && pnpm test && pnpm lint )
git push -u origin HEAD
gh pr create --base main --head "$(git branch --show-current)" \
  --title "feat(auth): add OTP verification screen" \
  --body-file .github/.pr-body.md \
  --label "FR-AUTH" --assignee "@me"
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
git switch main && git pull --ff-only origin main
git branch -D feat/FR-AUTH-001-otp-login
```

### PR body template

```markdown
## Summary
<2-4 sentences: what + why>

## Mapped to spec
- FR-XXX-NNN — <title>  (link to `docs/SSOT/spec/<file>.md`)
- N/A for tooling/docs-only changes.

## Changes
- <bullet>
- <bullet>

## Tests
- `pnpm typecheck` ✅
- `pnpm test`      ✅
- `pnpm lint`      ✅
- Manual: <what you clicked> / N/A

## SSOT updated
- [ ] `BACKLOG.md` status flipped
- [ ] `spec/{domain}.md` status updated (if all ACs done)
- [ ] `TECH_DEBT.md` — closed resolved TDs / added new ones

## Risk / rollout notes
<DB migrations? Feature flag? Breaking change? Otherwise: "Low risk.">

## Screenshots / logs
<only if UI or output changes>
```

## 7. Hard prohibitions (never, even on user request)

- **Never** force-push to `main`.
- **Never** rewrite published history on a shared branch.
- **Never** commit secrets (`.env`, API keys, tokens).
- **Never** merge a PR with red required checks.
- **Never** open a PR without a `Mapped to spec` line.
- **Never** delete a branch you didn't create unless the user asked.
- **Mutating SQL against shared DBs** requires an explicit confirmation procedure: the user must type the literal post-confirmation string the agent quoted. No exceptions.

## 8. Documentation language

- Product / requirements docs (`docs/SSOT/spec/*.md`, `BACKLOG.md`, `DECISIONS.md`, `TECH_DEBT.md`): mixed Hebrew + English allowed; FR-IDs and code paths always English.
- Code, code comments, commit messages, PR titles/bodies: **English**.
- UI strings: `apps/mobile/src/i18n/he.ts` — Hebrew only for MVP (`R-MVP-Core-4`).
- Agent ↔ PM conversation: Hebrew (per project preference).

## 9. Parallel-agents protocol

When two agents are running concurrently:

- **BE lane** owns `supabase/**` + `packages/infrastructure-supabase/**`.
- **FE lane** owns `apps/mobile/**` + `packages/ui/**`.
- **Shared contract** (`packages/{domain,application}/**`): FE leads domain types, BE leads port signatures. Contract changes ship as their own commit with `(contract)` scope (e.g. `feat(contract): add IPostRepository.list`).
- Branch naming: `<type>/<FR-id-or-scope>-<be|fe>-<slug>` (e.g. `feat/FR-POST-001-fe-feed-ui`).
- New tech-debt IDs: BE uses `TD-50..99`, FE uses `TD-100..149`.

## 10. How to pick the next task

If no task was assigned: open `docs/SSOT/BACKLOG.md` and pick the highest-priority `⏳ Planned` item. Move it to `🟡 In progress` before you start coding.

## 11. Tech stack quick reference

- Monorepo: pnpm + turbo. From `app/`: `pnpm install` then `pnpm typecheck` / `pnpm test` / `pnpm lint`.
- Run: `pnpm ios` / `pnpm android` / `pnpm --filter @kc/mobile web`.
- Mobile: Expo + React Native + expo-router (typed routes), Hebrew RTL forced.
- Backend: Supabase (Auth, Postgres+RLS, Storage, Realtime, Edge Functions).
- Layers: `packages/{domain,application,infrastructure-supabase,ui}` + `apps/mobile`. Strict inward dependency direction.

## 12. Repo structure map

If you don't see a home for something below, **ask the PM** before inventing a new file. Do not create new top-level docs without explicit approval.

| Concern                   | File / directory                       |
| ------------------------- | -------------------------------------- |
| Priority queue            | `docs/SSOT/BACKLOG.md`                 |
| Feature specs (FR-*)      | `docs/SSOT/spec/{domain}.md`           |
| Tech debt register        | `docs/SSOT/TECH_DEBT.md`               |
| Architectural decisions   | `docs/SSOT/DECISIONS.md`               |
| Migration verification    | `docs/SSOT/OPERATOR_RUNBOOK.md`        |
| **Process rules**         | **`CLAUDE.md`** (this file)            |
| Implementation plans      | `docs/superpowers/plans/`              |
| Design specs              | `docs/superpowers/specs/`              |
| Historical archive        | `docs/SSOT/archive/`                   |
| `.cursor/rules/*.mdc`     | Thin pointers to `CLAUDE.md` (kept only so Cursor's `alwaysApply: true` resolves) |
| `AGENTS.md` (root)        | Thin pointer to `CLAUDE.md` for Codex / Copilot CLI conventions |
````

- [ ] **Step 2.2: Verify the rewrite**

Run:
```bash
wc -l CLAUDE.md
```

Expected: 200 ± 10 lines.

Run:
```bash
grep -nE '(PROJECT_STATUS|HISTORY\.md|CODE_QUALITY|SRS\.md)' CLAUDE.md
```

Expected: no output (file is clean of dead refs).

- [ ] **Step 2.3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): rewrite CLAUDE.md as the single rules hub"
```

---

## Task 3 — Shrink `.cursor/rules/*` to pointer-stubs

**Files:**
- Modify: `.cursor/rules/srs-architecture.mdc`
- Modify: `.cursor/rules/git-workflow.mdc`
- Modify: `.cursor/rules/project-status-tracking.mdc`

- [ ] **Step 3.1: Replace `.cursor/rules/srs-architecture.mdc`**

Write the file with this exact content:

```markdown
---
description: Pointer — all process rules live in CLAUDE.md
alwaysApply: true
---

# Pointer

The single source of truth for all agent rules in this repo is **`CLAUDE.md`** at the repo root.
Read it before doing any work. This file exists only so Cursor's `alwaysApply: true` mechanism still resolves to the canonical rule set.
```

- [ ] **Step 3.2: Replace `.cursor/rules/git-workflow.mdc`**

Write the file with this exact content (identical to 3.1, repeated here for self-contained reading):

```markdown
---
description: Pointer — all process rules live in CLAUDE.md
alwaysApply: true
---

# Pointer

The single source of truth for all agent rules in this repo is **`CLAUDE.md`** at the repo root.
Read it before doing any work. This file exists only so Cursor's `alwaysApply: true` mechanism still resolves to the canonical rule set.
```

- [ ] **Step 3.3: Replace `.cursor/rules/project-status-tracking.mdc`**

Write the file with this exact content (identical to 3.1, repeated here for self-contained reading):

```markdown
---
description: Pointer — all process rules live in CLAUDE.md
alwaysApply: true
---

# Pointer

The single source of truth for all agent rules in this repo is **`CLAUDE.md`** at the repo root.
Read it before doing any work. This file exists only so Cursor's `alwaysApply: true` mechanism still resolves to the canonical rule set.
```

- [ ] **Step 3.4: Verify stubs are clean**

Run:
```bash
node app/scripts/check-ssot-links.mjs 2>&1 | grep -c '\.cursor/rules'
```

Expected: `0` — the `.cursor/rules/*` files should no longer trigger the dead-ref check.

- [ ] **Step 3.5: Commit**

```bash
git add .cursor/rules/srs-architecture.mdc .cursor/rules/git-workflow.mdc .cursor/rules/project-status-tracking.mdc
git commit -m "docs(cursor): shrink .cursor/rules/* to pointer stubs"
```

---

## Task 4 — Add `AGENTS.md` root pointer

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 4.1: Create `AGENTS.md` at repo root**

Write with this exact content:

```markdown
# AGENTS.md

This repository follows the `CLAUDE.md` convention for agent rules.
All process, architecture, and workflow rules live in [`CLAUDE.md`](./CLAUDE.md).
Read it first.
```

- [ ] **Step 4.2: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): add AGENTS.md root pointer for Codex / Copilot CLI"
```

---

## Task 5 — Rewrite `.github/PULL_REQUEST_TEMPLATE.md`

**Files:**
- Modify: `.github/PULL_REQUEST_TEMPLATE.md` (full rewrite)

- [ ] **Step 5.1: Replace the entire file**

Write with this exact content:

```markdown
<!--
PR description template — keep all sections.
The agent (or a human) fills these in. CI will block merge if "Mapped to spec" is missing.
-->

## Summary
<!-- 2-4 sentences: what changed and why. -->

## Mapped to spec
<!-- Required. List FR-* IDs touched, or write "N/A — tooling/docs only".
     Link to docs/SSOT/spec/<file>.md when applicable. -->
- FR-XXX-NNN — <title>

## Changes
<!-- Concrete list of edits — files added / changed / removed, plus key behavioral effects. -->
-

## Tests
<!-- Mark each gate. Run from app/. -->
- [ ] `pnpm typecheck` ✅
- [ ] `pnpm test` ✅
- [ ] `pnpm lint` ✅
- [ ] Manual smoke (describe) or N/A

## Refactor logged
<!-- Yes / No / NA. If Yes, link to the TECH_DEBT.md row. -->
- NA

## SSOT updated
<!-- Required when an FR-* is touched. Tick when each is in sync in this PR. -->
- [ ] `docs/SSOT/BACKLOG.md` status flipped
- [ ] `docs/SSOT/spec/{domain}.md` status updated (if all ACs done)
- [ ] `docs/SSOT/TECH_DEBT.md` — closed resolved TDs / added new ones

## Risk / rollout notes
<!-- DB migrations, RLS changes, feature flag, breaking change? Otherwise "Low risk." -->
-

## Screenshots / logs
<!-- Only if UI or runtime output changed. -->
```

- [ ] **Step 5.2: Commit**

```bash
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs(pr-template): replace PROJECT_STATUS section with SSOT checklist"
```

---

## Task 6 — Scrub dead refs in `docs/SSOT/` (non-spec files)

**Files:**
- Modify: `docs/SSOT/OPERATOR_RUNBOOK.md` (line 3)
- Modify: `docs/SSOT/TECH_DEBT.md` (line 9, TD-4, TD-43, line 138)
- Modify: `docs/SSOT/DECISIONS.md` (line 3, D-1, D-3, EXEC-9 lines 352 + 380)

- [ ] **Step 6.1: Edit `docs/SSOT/OPERATOR_RUNBOOK.md`**

Replace exactly:

OLD (line 3):
```markdown
> Verification steps extracted from PROJECT_STATUS.md §4 to avoid per-entry repetition.
```

NEW:
```markdown
> Migration verification steps for each numbered migration (0001–0009, P0.6).
```

- [ ] **Step 6.2: Edit `docs/SSOT/TECH_DEBT.md` — header line 9**

Replace exactly:

OLD (line 9):
```markdown
> Live execution state lives in [`PROJECT_STATUS.md`](./PROJECT_STATUS.md). Historical feature log lives in [`HISTORY.md`](./HISTORY.md). This file is the active debt register.
```

NEW:
```markdown
> Live execution state lives in [`BACKLOG.md`](./BACKLOG.md). Per-feature status lives in [`spec/*.md`](./spec/). This file is the active debt register.
```

- [ ] **Step 6.3: Edit `docs/SSOT/TECH_DEBT.md` — close TD-4**

Find the TD-4 row (currently in the "Process · docs · tooling" Active section). Remove the row from Active and add a new row at the top of the "Resolved" section:

NEW row in Resolved (note: rephrased to avoid trigger strings that would fail the new lint script):
```markdown
| TD-4 | Missing engineering-quality reference doc — content folded into `CLAUDE.md` §5–§8 instead of authoring a separate file. | 2026-05-11 (SSOT cleanup PR) |
```

- [ ] **Step 6.4: Edit `docs/SSOT/TECH_DEBT.md` — close TD-43**

Find the TD-43 row (currently in Active). Remove from Active, add to Resolved:

NEW row in Resolved (rephrased to avoid trigger strings):
```markdown
| TD-43 | Stale Last-Updated header on the archived monolithic SRS file. Spec is canonical in `docs/SSOT/spec/*.md` with per-file status headers; no central SRS file remains active. | 2026-05-11 (SSOT cleanup PR) |
```

- [ ] **Step 6.5: Edit `docs/SSOT/TECH_DEBT.md` — line 138**

Replace exactly:

OLD (line 138, under "How to add a new TD"):
```markdown
3. If the TD is blocking the current feature, also link it from the §4 entry in [`HISTORY.md`](./HISTORY.md) when the feature ships.
```

NEW:
```markdown
3. If the TD is blocking the current feature, also link it from the relevant `spec/{domain}.md` AC when the feature ships.
```

- [ ] **Step 6.6: Edit `docs/SSOT/DECISIONS.md` — back-link (line 3)**

Replace exactly:

OLD (line 3):
```markdown
[← back to SRS index](../../SRS.md)
```

NEW:
```markdown
[← back to CLAUDE.md](../../CLAUDE.md)
```

- [ ] **Step 6.7: Edit `docs/SSOT/DECISIONS.md` — add note to D-1**

Find the header `## D-1 — Three-platform single codebase via React Native + RNW` (line 19). Insert immediately after the `## D-1 ...` line (before the `**Decision.**` paragraph):

INSERT:
```markdown

> **Note (2026-05-11):** `CODE_QUALITY.md` was never authored; its content lives in `CLAUDE.md` §5–§8. References to it below are historical.
```

- [ ] **Step 6.8: Edit `docs/SSOT/DECISIONS.md` — add note to D-3**

Find the header `## D-3 — Clean Architecture monorepo with Turborepo` (line 55). Insert immediately after the `## D-3 ...` line (before `**Decision.**`):

INSERT:
```markdown

> **Note (2026-05-11):** `CODE_QUALITY.md` was never authored; its content lives in `CLAUDE.md` §5–§8. References to it below are historical.
```

- [ ] **Step 6.9: Edit `docs/SSOT/DECISIONS.md` — EXEC-9 line 352**

Replace exactly:

OLD:
```markdown
1. **Backlog.** P1.4 ("Block / unblock + visibility restoration") נמחק מ-`PROJECT_STATUS.md §2`. `FR-MOD-010` (סנקציות על דיווחי שווא) — שמופיע היה משויך ל-P1.4 — עובר ל-P1.3 ("Reports + auto-removal + false-report sanctions") שאליו הוא משתייך לוגית.
```

NEW:
```markdown
1. **Backlog.** P1.4 ("Block / unblock + visibility restoration") נמחק מ-`BACKLOG.md`. `FR-MOD-010` (סנקציות על דיווחי שווא) — שמופיע היה משויך ל-P1.4 — עובר ל-P1.3 ("Reports + auto-removal + false-report sanctions") שאליו הוא משתייך לוגית.
```

- [ ] **Step 6.10: Edit `docs/SSOT/DECISIONS.md` — EXEC-9 Affected docs (line 380)**

Inside the long "Affected docs" line, replace exactly:

OLD substring:
```
`PROJECT_STATUS.md §2` (P1.4 removed; FR-MOD-010 moves to P1.3)
```

NEW substring:
```
`BACKLOG.md` (P1.4 removed; FR-MOD-010 moves to P1.3)
```

- [ ] **Step 6.11: Verify**

Run:
```bash
node app/scripts/check-ssot-links.mjs 2>&1 | grep -cE '^(docs/SSOT/OPERATOR_RUNBOOK|docs/SSOT/TECH_DEBT|docs/SSOT/DECISIONS)\.md'
```

Expected: `0` (all three files now clean).

- [ ] **Step 6.12: Commit**

```bash
git add docs/SSOT/OPERATOR_RUNBOOK.md docs/SSOT/TECH_DEBT.md docs/SSOT/DECISIONS.md
git commit -m "docs(ssot): scrub dead refs in OPERATOR_RUNBOOK, TECH_DEBT, DECISIONS"
```

---

## Task 7 — Scrub spec files (3 surgical edits)

**Files:**
- Modify: `docs/SSOT/spec/01_auth_and_onboarding.md` (line 89)
- Modify: `docs/SSOT/spec/02_profile_and_privacy.md` (line 48)
- Modify: `docs/SSOT/spec/12_super_admin.md` (line 157)

- [ ] **Step 7.1: Edit `docs/SSOT/spec/01_auth_and_onboarding.md` — line 89**

The line contains "(`PROJECT_STATUS.md` P0.2)" and "once `FR-PROFILE-007` ships against the real `Profile` table" and "once P0.2 lands." Replace the two stale anchors.

Replace exactly the first occurrence:

OLD substring:
```
until the `Profile` table exists (`PROJECT_STATUS.md` P0.2)
```

NEW substring:
```
until `FR-PROFILE-007` ships (see `spec/02_profile_and_privacy.md`)
```

Also replace, in the same line:

OLD substring:
```
once P0.2 lands.
```

NEW substring:
```
once FR-PROFILE-007 lands.
```

- [ ] **Step 7.2: Edit `docs/SSOT/spec/02_profile_and_privacy.md` — line 48**

Replace exactly:

OLD substring:
```
until `Profile` and follow/post tables exist (see `PROJECT_STATUS.md` P0.2)
```

NEW substring:
```
until `FR-FOLLOW-*` and `FR-POST-*` ship (see `spec/03_following.md` + `spec/04_posts.md`)
```

- [ ] **Step 7.3: Edit `docs/SSOT/spec/12_super_admin.md` — line 157**

Replace exactly:

OLD substring:
```
an explicit confirmation procedure documented in `CODE_QUALITY.md`
```

NEW substring:
```
an explicit confirmation procedure (typing a free-text confirmation string per `CLAUDE.md` §7 hard-prohibitions)
```

- [ ] **Step 7.4: Verify**

Run:
```bash
node app/scripts/check-ssot-links.mjs 2>&1 | grep -c '^docs/SSOT/spec/'
```

Expected: `0`.

- [ ] **Step 7.5: Commit**

```bash
git add docs/SSOT/spec/01_auth_and_onboarding.md docs/SSOT/spec/02_profile_and_privacy.md docs/SSOT/spec/12_super_admin.md
git commit -m "docs(spec): scrub dead refs in spec/01, spec/02, spec/12"
```

---

## Task 8 — Mark historical superpowers plans as frozen

**Files:**
- Modify: `docs/superpowers/specs/2026-05-11-delete-account-design.md` (insert at top)
- Modify: `docs/superpowers/plans/2026-05-11-delete-account.md` (insert at top)
- Modify: `docs/superpowers/plans/2026-05-11-edit-post.md` (insert at top)

**Note:** these files are excluded from the CI check (see `EXCLUDE` in Step 1.2), so the header is informational — for humans / agents who may stumble across these docs.

- [ ] **Step 8.1: Add frozen header to delete-account-design.md**

Insert as the FIRST line of the file (above the existing `# ...` title):

```markdown
> ⚠️ **Frozen historical plan** — written under the pre-2026-05-11 SSOT scheme. References to `PROJECT_STATUS.md` / `HISTORY.md` in the body below are obsolete; see [`CLAUDE.md`](../../../CLAUDE.md) for the current convention.

```

(Note the trailing blank line — keep one empty line between the banner and the original `#` title.)

- [ ] **Step 8.2: Add frozen header to `docs/superpowers/plans/2026-05-11-delete-account.md`**

Insert as the FIRST line of the file (above the existing `# ...` title), with one blank line below:

```markdown
> ⚠️ **Frozen historical plan** — written under the pre-2026-05-11 SSOT scheme. References to `PROJECT_STATUS.md` / `HISTORY.md` in the body below are obsolete; see [`CLAUDE.md`](../../../CLAUDE.md) for the current convention.

```

- [ ] **Step 8.3: Add frozen header to `docs/superpowers/plans/2026-05-11-edit-post.md`**

Insert as the FIRST line of the file (above the existing `# ...` title), with one blank line below:

```markdown
> ⚠️ **Frozen historical plan** — written under the pre-2026-05-11 SSOT scheme. References to `PROJECT_STATUS.md` / `HISTORY.md` in the body below are obsolete; see [`CLAUDE.md`](../../../CLAUDE.md) for the current convention.

```

- [ ] **Step 8.4: Commit**

```bash
git add docs/superpowers/specs/2026-05-11-delete-account-design.md docs/superpowers/plans/2026-05-11-delete-account.md docs/superpowers/plans/2026-05-11-edit-post.md
git commit -m "docs(superpowers): mark historical plans as frozen"
```

---

## Task 9 — Wire the CI guard + fix stale comment in `check-architecture.mjs`

**Files:**
- Modify: `app/package.json` (extend `lint:arch` script)
- Modify: `app/scripts/check-architecture.mjs` (line 2 comment)

- [ ] **Step 9.1: Edit `app/package.json`**

Find the line:
```json
    "lint:arch": "node scripts/check-architecture.mjs",
```

Replace with:
```json
    "lint:arch": "node scripts/check-architecture.mjs && node scripts/check-ssot-links.mjs",
```

- [ ] **Step 9.2: Edit `app/scripts/check-architecture.mjs` line 2**

Replace exactly:

OLD:
```javascript
// Enforces architecture invariants declared in `.cursor/rules/srs-architecture.mdc`.
```

NEW:
```javascript
// Enforces architecture invariants declared in `CLAUDE.md` §5.
```

- [ ] **Step 9.3: Verify `pnpm lint:arch` runs the new script**

Run:
```bash
cd app
pnpm lint:arch
```

Expected: both scripts run sequentially. `check-architecture.mjs` passes (existing state), `check-ssot-links.mjs` passes (we've cleaned all refs in tasks 2–8).

If `check-ssot-links.mjs` reports remaining dead refs, return to the relevant task and fix.

- [ ] **Step 9.4: Commit**

```bash
git add app/package.json app/scripts/check-architecture.mjs
git commit -m "chore(scripts): wire check-ssot-links into pnpm lint:arch"
```

---

## Task 10 — Pre-push gates + open PR

- [ ] **Step 10.1: Run full pre-push gates**

```bash
cd app
pnpm typecheck
pnpm test
pnpm lint
```

Expected: all green. (No source code changed, so `typecheck` and `test` should be no-ops; `lint` now includes the new SSOT guard.)

If anything is red — stop. The change must not introduce regressions. Investigate the failure; if it's pre-existing on `main` and unrelated, document in PR body. If it's caused by the cleanup, fix in this branch.

- [ ] **Step 10.2: Final manual sanity grep**

From repo root, run:
```bash
git grep -nE '(PROJECT_STATUS|HISTORY\.md|CODE_QUALITY|SRS/02_functional_requirements|PRD_MVP_CORE_SSOT|docs/SSOT/SRS\.md)' \
  -- ':!docs/SSOT/archive/' ':!.claude/worktrees/' ':!docs/superpowers/'
```

Expected: **no output** (empty result). The PR is ready.

- [ ] **Step 10.3: Push branch**

```bash
git push -u origin chore/docs-unify-ssot
```

- [ ] **Step 10.4: Create the PR body file**

Create `.github/.pr-body.md` (gitignored) with this content:

```markdown
## Summary
Unify the SSOT layer: collapse the 4 entry-point files (`CLAUDE.md` + 3 `.cursor/rules/*`) into a single `CLAUDE.md` of ~200 lines covering all process, architecture, and git rules. Scrub 17 dead-file references (`PROJECT_STATUS.md`, `HISTORY.md`, `CODE_QUALITY.md`, `SRS.md`) across 13 active docs. Add a CI guard so the regression never recurs.

## Mapped to spec
N/A — process / docs only.

## Changes
- Rewrite `CLAUDE.md` as the single rules hub (12 sections, ~200 lines).
- `.cursor/rules/*` (3 files) → 8-line pointer-stubs (kept so Cursor's `alwaysApply: true` resolves).
- New `AGENTS.md` root pointer for Codex / Copilot CLI conventions.
- Replace `PROJECT_STATUS.md updated` checklist in `.github/PULL_REQUEST_TEMPLATE.md` with an `SSOT updated` checklist.
- Surgical scrubs in `OPERATOR_RUNBOOK.md`, `TECH_DEBT.md`, `DECISIONS.md`, and 3 spec files.
- Close TD-4 and TD-43 (both resolved by this cleanup).
- Mark 3 historical `docs/superpowers/` plans/specs as `Frozen historical plan`.
- New `app/scripts/check-ssot-links.mjs` + wire into `pnpm lint:arch`.
- Fix stale comment header in `app/scripts/check-architecture.mjs`.

## Tests
- `pnpm typecheck` ✅
- `pnpm test` ✅
- `pnpm lint` ✅ (includes the new SSOT guard)
- Manual `git grep` of dead-ref patterns in active docs returns empty.

## Refactor logged
NA — this PR is the refactor.

## SSOT updated
- [ ] N/A — pure process/docs PR. The SSOT-update checklist itself is being rewritten by this PR.

## Risk / rollout notes
Low risk. No application code touched. Cursor users get a one-time prompt the next time their session loads — `.cursor/rules/*` now point to `CLAUDE.md` instead of duplicating it.

## Screenshots / logs
N/A.
```

- [ ] **Step 10.5: Open the PR**

```bash
gh pr create \
  --base main \
  --head chore/docs-unify-ssot \
  --title "chore(docs): unify SSOT — consolidate rules into CLAUDE.md + scrub dead refs" \
  --body-file .github/.pr-body.md \
  --assignee "@me"
```

- [ ] **Step 10.6: Enable auto-merge**

```bash
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

Expected: CI runs (`pnpm lint` includes the new SSOT guard), turns green, PR auto-merges.

- [ ] **Step 10.7: Sync local**

```bash
git switch main
git pull --ff-only origin main
git branch -D chore/docs-unify-ssot
```

---

## Success criteria recap

After all tasks:

- [ ] `git grep` for the 6 dead-ref patterns on active docs returns 0 lines.
- [ ] `pnpm lint:arch` passes locally and in CI.
- [ ] A new agent reading only `CLAUDE.md` can: find specs, know when/what to update in SSOT, follow architecture invariants, ship a PR.
- [ ] `.cursor/rules/*` still loaded by Cursor (each remains with `alwaysApply: true`).
- [ ] `AGENTS.md` exists and points to `CLAUDE.md`.
- [ ] PR template does not mention `PROJECT_STATUS.md`.
- [ ] `DECISIONS.md` preserves D-1 / D-3 history; adds one inline note each pointing to `CLAUDE.md`.
- [ ] Historical superpowers plans are marked `Frozen historical plan` but not deleted.
- [ ] TD-4 and TD-43 are in the Resolved section of `TECH_DEBT.md`.

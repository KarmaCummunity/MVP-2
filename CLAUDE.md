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
> **Working branch: `dev`.** All PRs target `dev`. `main` is updated by squash-merging `dev` → `main`. Full topology in [`docs/SSOT/ENVIRONMENTS.md`](docs/SSOT/ENVIRONMENTS.md).

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

- Product / requirements docs (`docs/**/*.md`, including `docs/SSOT/spec/*.md`, `BACKLOG.md`, `DECISIONS.md`, `TECH_DEBT.md`): **English only**; FR-IDs and code paths stay English.
- Code, code comments, commit messages, PR titles/bodies: **English**. User-visible strings belong in locale files (for example `apps/mobile/src/i18n/locales/he/` — Hebrew only for MVP, `R-MVP-Core-4`), not inline in general source.
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
| Environment topology      | `docs/SSOT/ENVIRONMENTS.md`            |
| **Process rules**         | **`CLAUDE.md`** (this file)            |
| `docs/AGENTS.md`          | Thin pointer to `CLAUDE.md` (browse from `docs/`) |
| Implementation plans      | `docs/superpowers/plans/`              |
| Design specs              | `docs/superpowers/specs/`              |
| Historical archive        | `docs/SSOT/archive/`                   |
| `.cursor/rules/*.mdc`     | Thin pointers to `CLAUDE.md` (kept only so Cursor's `alwaysApply: true` resolves) |
| `AGENTS.md` (root)        | Thin pointer to `CLAUDE.md` for Codex / Copilot CLI conventions |

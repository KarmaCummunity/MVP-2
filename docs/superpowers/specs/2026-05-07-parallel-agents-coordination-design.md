# Design — Parallel Agents Coordination Protocol

| Field | Value |
| ----- | ----- |
| Date | 2026-05-07 |
| Status | Draft — pending user review |
| SRS touched | None — process/coordination doc |
| Project status impact | Affects how every subsequent feature is claimed, branched, and merged. Not a `PROJECT_STATUS.md` backlog item itself. |

---

## 1. Problem

The user is running two Claude Code agents in parallel against two clones of the same repo. Without explicit rules, the agents will collide on shared files (`packages/domain`, `packages/application`, `docs/SSOT/PROJECT_STATUS.md`), produce contradictory changes to the same port, and erode the Clean Architecture boundary that `srs-architecture.mdc` enforces.

This document defines the lanes, claim mechanism, contract-change rule, and conflict-avoidance discipline that let both agents work concurrently without stepping on each other.

## 2. Goals

- Preserve Clean Architecture: every file lives in exactly one layer; no agent writes outside its lane.
- Maximize parallel velocity: most P0 features split into a backend slice and a frontend slice that can run concurrently.
- Make the active work discoverable from a single place (`gh pr list`) — no out-of-band coordination needed for routine claims.
- Keep `PROJECT_STATUS.md` (the execution SSOT) free of merge conflicts under realistic concurrent load.
- Provide a deterministic tiebreaker when both agents need to change shared files.

## 3. Non-goals

- Replacing the existing `git-workflow.mdc` rules (squash merge, auto-merge on green CI, branch naming, conventional commits). This protocol layers on top.
- Defining workflows for more than two agents.
- Real-time messaging between agents (no chat layer; coordination is asynchronous via PRs and the status file).

## 4. Lanes (file ownership)

Each path on disk is owned by exactly one lane. "Owned" means: only the owning lane may write into it. Reading across lanes is always allowed.

| Lane | Owns (exclusive write) |
| ---- | ---------------------- |
| **Backend (BE)** | `supabase/**` (migrations, RLS, seed, config), `packages/infrastructure-supabase/**` (incl. generated `database.types.ts`), Edge Functions (when added) |
| **Frontend (FE)** | `apps/mobile/**`, `packages/ui/**` |
| **Shared contract** | `packages/domain/**`, `packages/application/**` (ports, use cases, domain types). Either lane may write — see §6 for the contract-change rule. |
| **Shared docs** | `docs/SSOT/**` (incl. `PROJECT_STATUS.md`, SRS, PRD), `docs/superpowers/**`. Either lane may write — see §7 for the conflict-avoidance discipline. |
| **Root configs** | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.*` — coordinate inline via PR comments before editing. |

The BE lane owns the **full implementation loop** from the database upward to the TypeScript adapter. The FE lane owns UI, navigation, state, and the wiring from screens down to the application port.

## 5. Slice naming

Most P0 features split cleanly into a backend slice (DB + adapter) and a frontend slice (use case wiring + UI). Each slice gets a lane suffix:

- `P0.4-BE — Posts adapter + storage upload`
- `P0.4-FE — Feed + create-post UI`
- `P0.5-BE — Chat repository + Realtime fan-out`
- `P0.5-FE — Inbox + thread screens`

A slice is the unit of claim, branch, and PR. If a feature genuinely cannot be split (rare), one agent owns the whole feature for that pass and the other agent picks a different feature.

## 6. Contract hierarchy

Two zones inside `packages/{domain,application}` have different default owners. This prevents the two agents from racing each other on the same lines.

### 6.1 Domain types — FE leads

`packages/domain/src/**` defines business entities (`Post`, `User`, `Chat`, `Message`, etc.) — the vocabulary the UI speaks.

The FE agent leads here. Reason: if BE defines domain types, they tend to mirror DB row shapes, which leaks the persistence model into the UI. The FE agent shapes domain entities around what the screens need; BE adapters then *map* DB rows into those domain entities.

The BE agent may add fields when a use case clearly needs them, but should default to opening a PR comment requesting the addition rather than editing the type unilaterally.

### 6.2 Port signatures — BE leads

`packages/application/src/ports/I*.ts` defines repository / service interfaces (method names, parameters, return types).

The BE agent leads here. Reason: port signatures must be implementable under Supabase + RLS constraints (e.g. RLS-friendly batch shapes, idempotency requirements, server-time semantics). If FE defines signatures, they may not survive contact with the database.

The FE agent may add a method signature when the screen demands it, but should default to opening a PR comment requesting the addition rather than editing the port unilaterally.

### 6.3 Use cases — first consumer wires

`packages/application/src/<feature>/*.ts` (e.g. `SignInWithGoogle.ts`, `CompleteBasicInfoUseCase.ts`) are pure orchestration over ports.

Whoever wires the first consumer writes the use case. In practice this is usually the FE agent (the screen calls the use case), but BE may write a use case if the adapter ships before the screen.

### 6.4 The contract-change commit rule

Whenever a slice changes any file under `packages/domain/**` or `packages/application/**`:

1. **The contract change is its own commit at the head of the slice's PR**, using `(contract)` as the Conventional Commits scope — e.g. `feat(contract): add IPostRepository.list method`, `refactor(contract): tighten Post.imageUrl to string`. Body lists the touched files. Type follows `git-workflow.mdc` §3.
2. **The PR description includes a `## Contract changes` section** with the file list, so the other agent can scan `gh pr view` quickly.
3. **Merge order**: contract commits merge first; consumers rebase onto the new contract. If both agents have already pushed concurrent contract changes that touch the same file → resolve via the §9 tiebreaker (BE wins on port signatures, FE wins on domain types). The losing agent rebases.

Consequence: when one agent merges a contract change, the other agent's open branches must rebase. CI catches type breakage. The consumer fixes; the producer is not on the hook for downstream breakage they didn't know about.

## 7. `PROJECT_STATUS.md` discipline

`PROJECT_STATUS.md` is the execution SSOT (`project-status-tracking.mdc` enforces updates). With two agents, naïve concurrent edits guarantee merge conflicts. Per-section rules:

| Section | Edit pattern | Conflict handling |
| ------- | ------------ | ----------------- |
| §1 Snapshot | Touched only at slice **completion**. Update "Last Updated", completion %, and counters. | Sum both deltas on rebase. Whoever rebases reconciles. |
| §2 Priority Backlog | Touched rarely. Mark a parent row `🟡 In progress` when *any* lane starts work on it; leave `🟢 Done` until *both* lanes finish. | Trivial — both agents can hold the same row at `🟡`. |
| §3 Sprint Board | Append a row at slice claim (with lane suffix). Remove the row at slice completion. **Never reorder.** | Append-only ⇒ no conflicts. |
| §4 Completed Features Log | Append at top on slice completion. | Second-merged PR's entry becomes #2 on rebase; the rebasing agent fixes. |
| §6 Tech Debt Log | Append-only with sequential `TD-N`. **BE uses TD-50..99 for new entries; FE uses TD-100..149.** When a range fills, request a new range in a PR comment. | Range split avoids ID collisions. |

Hard rule: **never push a `PROJECT_STATUS.md` edit directly to `main`.** All edits go through PRs. The verification-gate prefix (`Mapped to SRS: …`) lives in PR descriptions and code-bearing assistant responses, not in commit messages.

## 8. Claim & sync mechanism

Claiming a slice is mechanical and uses only existing tools (no separate claims file).

### 8.1 To claim a slice

1. `git fetch origin && git switch main && git pull --ff-only origin main`
2. Run `gh pr list --state open --json number,title,headRefName,isDraft` to confirm no other agent has the same slice already in flight.
3. Create a branch: `<type>/<FR-id-or-scope>-<lane>-<slug>` — e.g. `feat/FR-POST-001-fe-feed-ui`, `feat/FR-CHAT-001-be-chat-repo`. The lane infix (`-be-` / `-fe-`) makes claims human-readable in `git branch -r`.
4. First commit on the branch: edit `PROJECT_STATUS.md` §3 to add a row for the slice with the lane suffix (e.g. `P0.4-FE — Feed UI`). Set the `Owner` column to a stable agent identifier — convention: `agent-fe` for the frontend agent, `agent-be` for the backend agent. Push the branch.
5. Open a **draft PR** (`gh pr create --draft …`). The draft PR is the lock — its existence signals the slice is claimed.

### 8.2 To discover what the other agent is doing

- `git fetch origin && gh pr list --state open --json number,title,headRefName,isDraft,author` — shows all open work.
- `git log origin/main ^HEAD` — shows commits the other agent merged since you last synced.

### 8.3 At slice completion

1. Mark the PR ready for review: `gh pr ready`.
2. Update `PROJECT_STATUS.md`: remove §3 row, append §4 entry, update §1 snapshot, append §6 if tech debt was found.
3. Run pre-push gates per `git-workflow.mdc` §4 (`pnpm typecheck`, `pnpm test`, `pnpm lint`).
4. `gh pr merge --auto --squash --delete-branch`.

### 8.4 When the other agent merges first

`git fetch origin && git rebase origin/main` on every active branch. Re-run the pre-push gates. If a contract change broke types, fix in the rebase.

## 9. Conflict resolution

| Symptom | Resolution |
| ------- | ---------- |
| Code conflict in `packages/{domain,application}` after rebase | A contract change merged ahead of you. Read the contract commit, adapt your code to the new shape, re-run typecheck + tests. |
| Both agents need to change the same port at the same time | Discuss in PR comments. Default tiebreaker: BE lands the signature change first (per §6.2), FE rebases. |
| Both agents need to change the same domain entity | Default tiebreaker: FE lands the change first (per §6.1), BE rebases its adapter mapping. |
| `PROJECT_STATUS.md` conflict on §4 (Completed Features Log) | Mechanical: rebasing agent's entry becomes second-newest. Both entries preserved. |
| `PROJECT_STATUS.md` conflict on §1 counters | Recompute from the merged state and apply. |
| Architecture violation in a PR (BE writes `apps/mobile`, or vice-versa) | Reviewing agent flags via PR comment, blocks `--auto` merge until the violation is moved to the correct lane. Escalate to user if disputed. |
| Disagreement on contract shape that PR comments can't resolve | Escalate to user. Do not push a contested contract change. |

## 10. Out of scope / known gaps

- **Three-or-more-agents case.** This protocol is designed for exactly two lanes; §6 tiebreakers and §7 TD-N ranges assume two writers. **The migration path to 3+ writers is documented in §11 — read it before onboarding the third agent or developer.**
- **Real-time signal between agents.** Polling `gh pr list` is the only signal. There is no chat or webhook. If a contract change is urgent, surface it in a PR comment and ping the user to relay.
- **Automated lane enforcement.** Nothing in CI yet enforces that BE doesn't write into `apps/mobile`. Reviewing agent does it manually. A future CI check could parse the PR diff against the lane table in §4.
- **TD-N range exhaustion.** If BE fills `TD-50..99` or FE fills `TD-100..149`, request a new range in a PR comment. No automation for this yet.
- **Branch-name conventions.** This protocol introduces the `-be-` / `-fe-` infix; existing branches (e.g. `feat/p0-2-d-chat-messaging`) predate it and stay as-is. New branches follow §8.1.

## 11. Scaling beyond two writers — the migration to vertical ownership

This protocol is the **transitional model** for the 1-product-person + 2-AI-agents stage. It cannot scale to 3+ concurrent writers as written: the BE/FE split is horizontal (a layer is owned by exactly one lane), so two developers who both want to write a Supabase migration will block each other regardless of which feature they're shipping. The fix is to flip from **horizontal-lane** ownership to **vertical-feature** ownership.

This section defines the destination model, the trigger that initiates the flip, and the migration steps.

### 11.1 Destination model — feature ownership + CODEOWNERS

Each writer (human developer or AI agent pair) owns one or more **features** end-to-end:

- **Owns** = the writer is the default reviewer + decision-maker on every layer of that feature: DB migration → RLS → adapter → port → use case → screen.
- **Encoded in** `.github/CODEOWNERS` at the file-path level. GitHub auto-requests the owner's review on any PR touching their paths and blocks merge until owner approval (when `CODEOWNERS` is paired with branch protection rules).
- **Examples**:
  - `Posts` owner gets `app/packages/**/posts/**`, `apps/mobile/app/(tabs)/create.tsx`, `apps/mobile/app/post/**`, `supabase/migrations/*posts*`.
  - `Chat` owner gets `app/packages/**/chat/**`, `apps/mobile/app/chat/**`, `supabase/migrations/*chat*`.
  - `Moderation` owner gets `app/packages/**/moderation/**`, `supabase/migrations/*moderation*`.

Cross-cutting concerns (auth, navigation, theming, i18n, root layout) live in a **core zone** with multiple owners listed (any one can approve). Shared contract paths (`packages/{domain,application}/**` outside any feature subfolder) require **two owners' approval** — the feature consuming the contract change and the contract steward.

### 11.2 What changes vs the two-lane protocol

| §  | Current (2-lane)                                         | Vertical (3+ writers)                                                                         |
| -- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| §4 | BE owns `supabase/**` + infra; FE owns `apps/mobile/**` + ui | Feature owner owns the feature's vertical slice across all layers; horizontal labels retire   |
| §5 | Slice = `Pn.x-BE` + `Pn.x-FE`                            | Slice = `Pn.x` (single feature owner ships a vertical slice; sub-divides only if velocity demands) |
| §6 | FE leads `domain`, BE leads ports                         | The feature owner leads the contract for their feature's entities and ports; **shared types/ports require RFC** (one-pager in `docs/superpowers/rfcs/`) |
| §7 | TD-50..99 (BE) / TD-100..149 (FE)                         | TD-N is sequential and append-only; merge conflicts on the row resolve via rebase order. No range pre-allocation. |
| §8 | Draft PR = lock; lane infix in branch name                | CODEOWNERS auto-routes review; branch infix becomes feature slug (e.g. `feat/FR-POST-001-feed-ui`, no lane) |
| §9 | Tiebreakers BE-wins-ports / FE-wins-domain               | Tiebreaker is **the feature owner** for their feature's surface; cross-feature ties → RFC + user escalation |

### 11.3 Trigger to flip

Flip when **any one** of these is true:

1. **A second human developer onboards.** Don't run two humans on a horizontal-lane model — it forces them into the same lane every sprint.
2. **A single feature's velocity is bottlenecked by both lanes wanting the same file in the same week, twice.** Once is noise; twice is structural.
3. **Contract-change overhead (§6) exceeds ~20% of slice time consistently.** Measured by: count of `(contract)` commits per slice ÷ total commits per slice. If you're spending more time negotiating contracts than implementing, the lane model is fighting you.

The trigger is a one-way door: once flipped, the BE/FE protocol is retired (the spec stays for historical reference; new work follows §11).

### 11.4 Migration steps

The flip is a single ~1-day project, not a gradual transition. Half-flipped is worse than either end-state.

1. **Pre-flip prep (1-2 hours, while still on BE/FE protocol):**
   - Audit current PRs in flight; merge or close all open BE/FE slices before the flip.
   - Draft the new `CODEOWNERS` mapping locally based on the current feature partition (`docs/SSOT/SRS/02_functional_requirements/` is the canonical feature list).
   - Decide initial feature ownership for each writer. Default: dev who shipped a feature in the previous quarter owns it.
2. **Flip commit (1 PR, 30 min):**
   - Replace `CODEOWNERS` content with the feature-based mapping.
   - Append a "DEPRECATED — see §11" banner to §4–§9 of this spec.
   - Add a one-line `CLAUDE.md` pointer: "Coordination protocol: §11 (vertical) supersedes §4–§9 (horizontal) as of <date>."
   - Update branch protection: require CODEOWNERS approval on protected paths.
3. **Post-flip (first sprint after flip):**
   - First slice each writer ships establishes their ownership in practice. Resolve any "who owns this file?" ambiguities by inspecting PR-review-request flow — whoever GitHub auto-pinged is the owner; if it pinged nobody, add a CODEOWNERS rule.
   - Open the first cross-feature RFC (likely a shared-domain change) within the first sprint to exercise the `docs/superpowers/rfcs/` path.

### 11.5 What stays the same

The vertical model inherits the rest of this spec without change:

- Clean Architecture invariants (`srs-architecture.mdc` + the `lint:arch` enforcement) apply equally.
- `git-workflow.mdc` (branch naming, conventional commits, auto-merge on green CI) — unchanged.
- `project-status-tracking.mdc` (`PROJECT_STATUS.md` discipline) — unchanged; only the "lane suffix" convention in §3 Sprint Board is dropped (rows become `Pn.x — <feature>` without a `-BE` / `-FE` suffix).
- The verification gate (`Mapped to SRS: …`) — unchanged.
- The "Propose and Proceed" rule — unchanged.

### 11.6 What this spec does NOT cover for 3+ writers

- **A formal RFC template.** Add one to `docs/superpowers/rfcs/00_template.md` at the time of the flip; defer until then to avoid premature design.
- **Multiple AI agents per developer.** A developer running two agents on their own feature is a single-owner setup from CODEOWNERS' perspective; treat as one writer for §11.3 trigger purposes.
- **Hand-off between feature owners.** Document the policy when the first hand-off happens, not before. Default expectation: a 1-week shadow period where the new owner pairs on PRs before assuming sole ownership.

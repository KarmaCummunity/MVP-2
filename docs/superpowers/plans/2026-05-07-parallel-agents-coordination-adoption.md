# Parallel-Agents Coordination Protocol — Adoption Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the parallel-agents coordination protocol on `main` and wire it into `CLAUDE.md` so both agents pick it up automatically on the next session bootstrap.

**Architecture:** Single PR off the existing spec branch (`docs/process-parallel-agents-coordination`). The spec file is already committed on that branch; this plan adds the `CLAUDE.md` pointer + `PROJECT_STATUS.md §5` decision row in the same PR, then squash-merges per `.cursor/rules/git-workflow.mdc`.

**Tech Stack:** Markdown only. No application code touched. `gh` CLI for PR. `pnpm` (run from `app/`) for the mandatory pre-push gates.

**Source spec:** [`docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md`](../specs/2026-05-07-parallel-agents-coordination-design.md)

---

## File map

| File | Purpose | Action in this plan |
|------|---------|---------------------|
| `docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md` | The protocol itself | None — already committed on `docs/process-parallel-agents-coordination` |
| `CLAUDE.md` | Workspace bootstrap loaded every session | New section pointing to the spec + quick reference |
| `docs/SSOT/PROJECT_STATUS.md` | Execution SSOT | Append §5 `EXEC-4` row recording adoption; touch §1 "Last Updated" |
| `.github/.pr-body.md` | Generated PR body (gitignored) | Create on the fly before `gh pr create` |

---

## Task 1: Verify branch state and rebase if main moved

**Files:** none (read-only checks)

- [ ] **Step 1: Confirm we're on the spec branch**

Run: `git branch --show-current`
Expected: `docs/process-parallel-agents-coordination`

- [ ] **Step 2: Fetch origin and check whether main has moved since we branched**

Run: `git fetch origin && git log --oneline origin/main ^HEAD`
Expected: empty output if main is unchanged since branching, or a list of commits the other agent merged.

- [ ] **Step 3: Rebase if main moved**

If Step 2 listed any commits, run:
```bash
git rebase origin/main
```
If conflicts surface (most likely on `docs/SSOT/PROJECT_STATUS.md`):
1. Open the conflicting file.
2. Keep both sets of changes (the protocol's `PROJECT_STATUS.md` discipline rules in §7 of the spec apply: §4 entries from main go above ours; §6 TD entries we add go after the highest existing TD-N).
3. `git add <file> && git rebase --continue`.

If Step 2 was empty, skip this step.

---

## Task 2: Add the "Parallel-agents protocol" section to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read CLAUDE.md to find the insertion point**

Run: `grep -n "## You MUST follow these rules\|## Verification gate" CLAUDE.md`
Expected: two line numbers — the insertion point is **immediately after** the "## You MUST follow these rules" block ends (right before "## Verification gate").

- [ ] **Step 2: Insert the new section before "## Verification gate"**

Use the Edit tool. `old_string`:
```
- `.cursor/rules/git-workflow.mdc` — **mandatory** branch / commit / PR / merge workflow. Branches via `gh`, PRs auto-merge on green CI (squash). One-time machine setup: `SETUP_GIT_AGENT.md`.

## Verification gate
```

`new_string`:
```
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
```

- [ ] **Step 3: Verify the edit landed**

Run: `grep -c "Parallel-agents protocol" CLAUDE.md`
Expected: `1`

Run: `grep -c "BE lane" CLAUDE.md`
Expected: `1`

---

## Task 3: Append EXEC-4 decision row + bump §1 in PROJECT_STATUS.md

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`

- [ ] **Step 1: Read §5 of `PROJECT_STATUS.md` to confirm the next ID is `EXEC-4`**

Run: `grep -n "^| EXEC-" docs/SSOT/PROJECT_STATUS.md`
Expected: rows for `EXEC-1`, `EXEC-2`, `EXEC-3`. The next ID is `EXEC-4`. (If the other agent has already added an `EXEC-4`, use the next free ID and keep the body identical.)

- [ ] **Step 2: Append the EXEC-4 row to the §5 table**

Use the Edit tool. `old_string` (the last existing EXEC row — verify it's still the tail before editing):
```
| EXEC-3 | Vitest chosen as the unit-test runner for `@kc/domain` and `@kc/application` (lightweight, native ESM, fast) | P0.1 | 2026-05-06 |
```

`new_string`:
```
| EXEC-3 | Vitest chosen as the unit-test runner for `@kc/domain` and `@kc/application` (lightweight, native ESM, fast) | P0.1 | 2026-05-06 |
| EXEC-4 | Adopted parallel-agents coordination protocol (lanes, draft-PR claim mechanism, `(contract)` scope rule, TD-N range split, tiebreakers). Spec at `docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md`; pointer in `CLAUDE.md`. | Two-agent setup | 2026-05-07 |
```

- [ ] **Step 3: Update the §1 "Last Updated" cell**

Use the Edit tool to swap whatever line currently exists. The current value as of branching was:
```
| **Last Updated** | 2026-05-07 (P0.2.e — Moderation migration written; awaiting operator apply) |
```
After Task 1's rebase, the line will likely have been updated by the other agent. Read the current line first:

Run: `grep "Last Updated" docs/SSOT/PROJECT_STATUS.md`

Then Edit-replace it, **appending** ` + parallel-agents protocol adopted` inside the parentheses. Example transformation if main shows:
```
| **Last Updated** | 2026-05-07 (P0.3 — onboarding wizard scaffolded) |
```
becomes:
```
| **Last Updated** | 2026-05-07 (P0.3 — onboarding wizard scaffolded + parallel-agents protocol adopted) |
```

If there are no parentheses, append ` — parallel-agents protocol adopted` after the date.

- [ ] **Step 4: Verify both edits**

Run: `grep "EXEC-4" docs/SSOT/PROJECT_STATUS.md`
Expected: one match showing the new row.

Run: `grep "parallel-agents protocol adopted" docs/SSOT/PROJECT_STATUS.md`
Expected: one match (in §1 Last Updated).

---

## Task 4: Stage, run pre-push gates, commit

**Files:** stages already-modified `CLAUDE.md` and `docs/SSOT/PROJECT_STATUS.md`.

- [ ] **Step 1: Stage the changes**

Run: `git add CLAUDE.md docs/SSOT/PROJECT_STATUS.md`

- [ ] **Step 2: Run the mandatory pre-push gates**

Per `.cursor/rules/git-workflow.mdc` §4:
```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
cd -
```
Expected: all three green. Since this PR touches no code, results should match the pre-PR state of `main`. If any fail, **stop** — investigate whether main was already red (a separate problem to surface to the user) or whether something the rebase pulled in broke a script.

- [ ] **Step 3: Commit with a Conventional Commits message**

```bash
git commit -m "docs(process): wire CLAUDE.md and status log to protocol spec

Pointer from CLAUDE.md so both agents pick up the parallel-agents
coordination protocol on next session bootstrap. EXEC-4 records the
adoption decision."
```

- [ ] **Step 4: Verify the branch now has both commits**

Run: `git log --oneline -2`
Expected: two commits — `docs(process): wire CLAUDE.md…` (new) and `docs(process): add parallel-agents coordination protocol spec` (from earlier).

---

## Task 5: Generate the PR body and open the PR with auto-merge

**Files:**
- Create: `.github/.pr-body.md` (gitignored per workflow rule)

- [ ] **Step 1: Confirm `.github/` exists and `.pr-body.md` is gitignored**

Run: `ls -la .github/ 2>/dev/null && grep -n "pr-body" .gitignore 2>/dev/null`
Expected: `.github/` exists; `.gitignore` has an entry covering `.github/.pr-body.md` (workflow rule says it's gitignored — if missing, add `.github/.pr-body.md` to `.gitignore` in this same commit before pushing).

- [ ] **Step 2: Write the PR body file**

Write this content to `.github/.pr-body.md`:

```markdown
## Summary
Adopt the parallel-agents coordination protocol for the two-clone setup. Adds the design spec, points to it from `CLAUDE.md`, and records `EXEC-4` in `PROJECT_STATUS.md` so both agents pick it up automatically on next session bootstrap.

## Mapped to SRS
- N/A — process / coordination doc.

## Changes
- `docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md` — new spec (lanes, slice naming, contract hierarchy, claim mechanism via draft PR, `PROJECT_STATUS.md` discipline, conflict tiebreakers, known gaps).
- `CLAUDE.md` — new "Parallel-agents protocol" section with pointer to the spec + a quick-reference for lanes, branch naming, `(contract)` commit scope, and TD-N range split.
- `docs/SSOT/PROJECT_STATUS.md` — `§5` `EXEC-4` decision row; `§1` "Last Updated" tagged.

## Tests
- `pnpm typecheck` — ✅ (no code changes)
- `pnpm test`      — ✅ (no code changes)
- `pnpm lint`      — ✅ (no code changes)
- Manual: N/A — markdown-only.

## Refactor logged
NA — pure documentation.

## Risk / rollout notes
Low risk — internal docs only. Protocol takes effect on first claim by either agent after merge.

## Screenshots / logs
N/A.
```

- [ ] **Step 3: Push the branch**

Run: `git push -u origin HEAD`
Expected: `* [new branch]      HEAD -> docs/process-parallel-agents-coordination`

- [ ] **Step 4: Open the PR**

Run:
```bash
gh pr create \
  --base main \
  --head "$(git branch --show-current)" \
  --title "docs(process): adopt parallel-agents coordination protocol" \
  --body-file .github/.pr-body.md \
  --assignee "@me"
```
Expected: prints the PR URL. Capture it.

- [ ] **Step 5: Enable auto-merge (squash)**

Run: `gh pr merge --auto --squash --delete-branch`
Expected: confirms auto-merge enabled. (If it errors with "auto-merge not enabled for repository", stop and surface to the user — likely needs the one-time fix in `SETUP_GIT_AGENT.md` §3.)

---

## Task 6: Wait for green CI, verify merge, sync local, hand off

**Files:** none

- [ ] **Step 1: Watch checks until they pass**

Run: `gh pr checks --watch`
Expected: all required checks green; PR auto-merges; remote branch deleted.

- [ ] **Step 2: Sync local main and clean up the local branch**

```bash
git switch main
git pull --ff-only origin main
git branch -D docs/process-parallel-agents-coordination
```
Expected: fast-forward succeeds; local branch deleted.

- [ ] **Step 3: Verify the post-merge state**

Run: `grep -c "Parallel-agents protocol" CLAUDE.md`
Expected: `1`

Run: `test -f docs/superpowers/specs/2026-05-07-parallel-agents-coordination-design.md && echo OK`
Expected: `OK`

Run: `grep "EXEC-4" docs/SSOT/PROJECT_STATUS.md`
Expected: one match.

- [ ] **Step 4: Hand off**

Report to the user:
1. PR URL.
2. Confirmation that all three post-merge checks above passed.
3. Reminder: the BE agent in the other clone needs to run `git fetch && git pull --ff-only` to load the protocol.
4. Suggestion for the next FE slice to claim under the new protocol — most likely `P0.4-FE — Feed + create-post UI` (the BE-side adapter `IPostRepository` is the next obvious dependency, which falls in BE's lane).

---

## Self-review notes

- **Spec coverage:** The spec is documentation-only; this plan operationalizes it via two pointers (CLAUDE.md, PROJECT_STATUS.md §5). The remaining spec sections (§4 lanes, §6 contract hierarchy, §8 claim mechanism, §9 conflicts) are conventions adopted at first use — no separate task needed to "implement" them.
- **Placeholder scan:** Clean — every step has the exact command, expected output, or full text to insert.
- **Edge case — main moved during the conversation:** Task 1 Step 3 handles the rebase. Task 3 Step 3 handles the case where the other agent already updated §1.
- **Edge case — `.pr-body.md` gitignore:** Task 5 Step 1 checks and instructs adding to `.gitignore` in-band if missing.
- **Edge case — `pnpm lint` failure on docs:** Task 4 Step 2 instructs to stop and investigate rather than push red.

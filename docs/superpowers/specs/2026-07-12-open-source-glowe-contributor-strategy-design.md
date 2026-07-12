# Open-Source Contributor Strategy for GLOWE — Design

**Status:** Approved by PM (2026-07-12). Ready for implementation plan.

## Context

The KarmaCommunity/MVP-2 repo is public but has no README, LICENSE, CONTRIBUTING.md,
SECURITY.md, or issue templates. `AGENTS.md` already directs internal agents that
GLOWE (`app/apps/glowe-web/**`) is the sole active product and the KC mobile
frontend (`app/apps/mobile/**`) is paused — but that framing is invisible to
anyone outside the current agent/PM loop.

The PM wants to open the repo to volunteer programmers worldwide: they can read
the code and submit PRs, but may not copy the code for private/commercial reuse.
The PM retains sole merge authority on `main` and `dev`.

## Goals

1. Make the GLOWE-only focus and KC-paused status obvious to a first-time visitor.
2. Give external contributors everything they need to set up, build, and open a
   PR without needing the internal agent-process context in `CLAUDE.md`.
3. Protect the project's IP: contributions welcome, code reuse outside the
   project is not licensed.
4. Harden the repo/CI against a stranger's first PR without adding friction for
   contributors after their first accepted PR.
5. Keep merge control on `main`/`dev` with the PM (`@navesarussi`) exclusively.

## Non-goals

- No repo split between KC and GLOWE — framing/documentation change only, not an
  architecture change.
- No formal legal CLA-signing bot or lawyer-drafted agreement (flagged as a
  future upgrade if the project grows past the informal stage).
- No change to `CODEOWNERS` or collaborator roles (decided in a prior session:
  leave the 5 existing admin-role collaborators as-is).
- No change to branch protection's `required_approving_review_count: 0` — kept
  as documented below.

## Design

### 1. `README.md` (new, root)

English, written for a first-time visitor with zero context. Sections, in order:

1. **Status banner** (bold, top of file): KC mobile app development is paused;
   all active development targets GLOWE (`app/apps/glowe-web/`); the two share
   the KC Supabase backend.
2. **What GLOWE is** — one paragraph, plain language.
3. **Quickstart** — clone, `pnpm install`, env setup pointer (`app/.env.example`),
   command to run GLOWE web locally. Full detail deferred to `CONTRIBUTING.md`.
4. **Repo map** — short annotated tree: `app/apps/glowe-web` (active),
   `app/apps/mobile` (KC, paused), `supabase/` (shared backend),
   `docs/SSOT/` (internal specs — link, not required reading for a first PR).
5. **License** — one line + link to `LICENSE`.
6. **Contributing** — one line + link to `CONTRIBUTING.md`.
7. **Security** — one line + link to `SECURITY.md`.

### 2. `LICENSE` (new, root)

All-Rights-Reserved notice: `Copyright (c) 2026 KarmaCommunity. All rights
reserved.` followed by one paragraph: the source is visible for transparency and
contribution purposes only; no license is granted to copy, redistribute, or
reuse the code outside contributing to this repository; contributions are
governed by `CONTRIBUTING.md`.

### 3. `CONTRIBUTING.md` (new, root)

Written for an external contributor, not an internal agent. Sections:

1. **Scope** — GLOWE contributions welcome; KC-frontend PRs will be redirected/
   closed (link `AGENTS.md`'s standing directive so the reason is traceable).
2. **Contributor Terms** (the informal CLA paragraph) — by opening a PR, the
   contributor grants KarmaCommunity a perpetual, worldwide license to use,
   modify, and relicense their contribution as part of the project; they retain
   authorship credit; they affirm the contribution is their own original work.
3. **Dev setup** — `pnpm install`, required env vars (reference `.env.example`,
   explicit warning never to commit real secrets/credentials), how to run GLOWE
   web locally, how to run `pnpm typecheck && pnpm test && pnpm lint` from `app/`.
4. **Branch & PR flow** — fork the repo, branch, PR against `dev` (never
   `main`), wait for `@navesarussi` review and merge. State explicitly that
   contributors do not have push access and all merges are maintainer-controlled.
5. **Commit/PR conventions** — simplified excerpt of `CLAUDE.md` §6: Conventional
   Commits format, and what the required "Mapped to spec" PR-body line means for
   an external contributor (`N/A` is an acceptable, common answer for most
   external PRs that aren't tied to a tracked `FR-*`).
6. **Code style / merge bar** — passing lint/typecheck/test is the acceptance bar;
   point to existing scripts, no new tooling introduced.
7. **Who reviews** — `@navesarussi` is sole merge authority on `main`/`dev`
   (matches existing root `CODEOWNERS` entry, unchanged).

### 4. Governance & security docs (new, root + `.github/`)

- `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1 boilerplate, enforcement
  contact `karmacommunity2.0@gmail.com` (matches the project's existing
  no-outbound-automation convention — reports arrive manually, nothing automated
  sends mail).
- `SECURITY.md` — responsible disclosure instructions: prefer GitHub's private
  vulnerability reporting (to be enabled, see §5) with `karmacommunity2.0@gmail.com`
  as the fallback contact; explicit ask not to open public issues for
  unpatched vulnerabilities.
- `.github/ISSUE_TEMPLATE/bug_report.md` and
  `.github/ISSUE_TEMPLATE/feature_request.md` — lightweight structured templates
  (currently only `.github/PULL_REQUEST_TEMPLATE.md` exists).

### 5. GitHub repo settings changes

- **Actions → Fork pull request workflows**: require approval for first-time
  contributors (already-approved PM decision). Applied via `gh api` /
  repo settings UI (whichever the API supports — investigate exact endpoint
  during implementation; documented as a manual step in the PR/runbook if the
  API doesn't expose it).
- **Enable GitHub Discussions** (PM decision: GitHub-only comms for now, no
  external Discord/Slack).
- **Enable private vulnerability reporting** (supports `SECURITY.md`).
- **No change** to branch protection's `required_approving_review_count: 0` on
  `main`/`dev`. Rationale documented inline in `CONTRIBUTING.md`/design: external
  contributors have no write access, so the GitHub merge button is unavailable
  to them regardless of required-review count — only collaborators with write/
  admin access (currently the existing 5) can merge, and per `CLAUDE.md` §6
  every non-hotfix change already requires a PR. Tightening this could also
  interfere with the autonomous-loop mode in `CLAUDE.md` §13, which assumes
  zero-review agent operation on `dev`. Flagged as a future decision, not made
  here.
- **No change** to `CODEOWNERS` or collaborator roles (prior-session decision,
  reaffirmed).

## Verification

- `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`
  render correctly on GitHub (markdown lint / preview).
- Issue templates appear correctly in GitHub's "New issue" chooser.
- Actions fork-PR-approval setting and Discussions/private-vuln-reporting
  toggles verified via `gh api` read-back after enabling.
- No changes to app code, so no `pnpm typecheck`/`test`/`lint` impact — this is
  a docs/governance-only change (`NA` for spec mapping, matches `CLAUDE.md` §4
  "what does NOT need an SSOT update" — pure documentation).

## Risk / rollout

Low risk — additive documentation and repo-settings changes only. No code,
schema, or CI-behavior change beyond the fork-PR-approval gate (which only adds
friction for first-time external contributors, not existing collaborators).

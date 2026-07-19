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

### 6. Mandatory CI security gates before merge into `dev`

PM directive: nothing merges into `dev` unless every gate below is green, and
`main` is reachable **only** via a `dev`→`main` promotion PR (already true per
`CLAUDE.md` §6/§13 — reaffirmed here, no change needed to that rule).

Current state of each gate, checked against the live repo:

| # | Gate | Status today | Action needed |
|---|------|--------------|----------------|
| 1 | SonarCloud (Sonar Qube Cloud) | ✅ Already a required check (`ci-sonar.yml`, "SonarCloud quality gate" required on both `main` and `dev`) | None |
| 2 | Snyk | ❌ Not present | Add `.github/workflows/ci-snyk.yml` (dependency + code vulnerability scan); add as required check on `dev`. **Needs a Snyk account + `SNYK_TOKEN` repo secret — the PM must sign up and add the token; I'll scaffold the workflow to consume it.** |
| 3 | CodeRabbit | ❌ Not present | GitHub App, not a workflow file. **Requires the PM to install "CodeRabbit" from the GitHub Marketplace on this repo** (app-install grants are a permission only the repo owner can approve) — I can prepare a `.coderabbit.yaml` config once installed. |
| 4 | GitHub Dependabot | ✅ Already enabled (security updates `status: enabled`; `dependabot.yml` configured, version-update PRs capped at 0 per existing TD-173 decision, security PRs unaffected) | None |
| 5 | GitGuardian | ❌ Not present | Third-party secret-scanning service, complements (doesn't replace) native GitHub secret scanning. **Requires the PM to sign up at gitguardian.com and install their GitHub App/action** — manual, cannot be done via API on the PM's behalf. I'll add the `.gitguardian.yaml` config + workflow once they share the API key as a secret. |
| 6 | GitHub native Secret Scanning + push protection | ✅ Already enabled (done in a prior session) | None |
| 7 | Automated tests (unit + integration) | ✅ Already required (`typecheck · test · lint`, `rpc · table contract`, `apply migrations · rls · types · sql probes`, `Hebrew source scan` all required on both branches) | None |

**Net new work**: only gates #2, #3, #5 need anything built, and all three
block on the PM completing a manual signup/install step first (account
creation and GitHub App installs are outside what I can do on your behalf).
I'll scaffold every workflow/config file so that the moment you drop in the
secret or click install, the gate goes live and becomes a required check on
`dev`'s branch protection.

### 7. Local-only database — no shared secrets for contributors

**Problem this closes**: the existing `scripts/seed-glowe-dev.mjs` seeds the
**shared cloud dev Supabase project** and requires `SUPABASE_SERVICE_ROLE_KEY`
for that project — a real secret. External contributors must never receive
that key. Today nothing stops a contributor from being handed it by mistake.

**Fix**: formalize local-only development as the only path for outside
contributors.

- `supabase start` (Supabase CLI) already runs the full backend
  (Postgres, Auth, Storage, Realtime, Studio) as local Docker containers —
  this is "smart Docker" already, just not documented as the contributor path.
- `supabase db reset` applies every migration in `supabase/migrations/` plus
  `supabase/seed.sql` (currently just reference data — cities — 29 lines).
- **New script**: `scripts/seed-local-fake-data.mjs` — seeds realistic **fake**
  GLOWE data (dummy orgs, individuals, posts/events/needs, sample chat) into
  the **local** stack only. Mirrors `seed-glowe-dev.mjs`'s structure (idempotent,
  upsert-on-conflict) but with the guard **inverted**: it refuses to run
  against anything except `127.0.0.1`/`localhost`, so it can never accidentally
  target the cloud dev or prod project. Uses the Supabase CLI's fixed local
  service-role key (the well-known `supabase-demo` JWT already used in test
  fixtures — safe to hardcode since it only authenticates against a
  container on the contributor's own machine, never a real deployment).
- `CONTRIBUTING.md` §Dev setup is updated to describe this exact flow:
  `supabase start` → `supabase db reset` → `node scripts/seed-local-fake-data.mjs`
  → run GLOWE web pointed at the local Supabase URL. No real credentials of
  any kind touch a contributor's machine.

## Verification

- `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`
  render correctly on GitHub (markdown lint / preview).
- Issue templates appear correctly in GitHub's "New issue" chooser.
- Actions fork-PR-approval setting and Discussions/private-vuln-reporting
  toggles verified via `gh api` read-back after enabling.
- No changes to app code from §1-5, so no `pnpm typecheck`/`test`/`lint` impact
  for those — docs/governance-only (`NA` for spec mapping, matches `CLAUDE.md`
  §4 "what does NOT need an SSOT update" — pure documentation).
- §6 (CI gates): each new workflow file is validated by the existing
  `ci-actionlint.yml` gate before it can itself become a required check;
  confirm each new gate shows up and passes on a throwaway test PR before
  marking it required on `dev`'s branch protection.
- §7 (local seed script): run `supabase start && supabase db reset && node
  scripts/seed-local-fake-data.mjs` end-to-end on a clean machine/checkout and
  confirm the GLOWE web app renders the seeded fake content when pointed at
  the local Supabase URL; confirm the script hard-exits if pointed at any
  non-localhost URL.

## Risk / rollout

Low risk overall. §1-5 are additive documentation and repo-settings changes
only. §6 introduces new required CI gates on `dev` — sequence each gate's
"required" flag only after it has run green at least once, to avoid wedging
every PR the moment the workflow file lands but before the PM has added the
corresponding secret. §7 is a new script with no effect on existing scripts,
CI, or the shared cloud dev database.

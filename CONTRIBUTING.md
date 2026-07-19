# Contributing to GLOWE

Thank you for helping improve GLOWE. This guide is written for external
contributors who do not have access to the internal agent workflow documented in
`CLAUDE.md`.

## Scope

**GLOWE contributions are welcome.** Active product code lives in
`app/apps/glowe-web/`.

The **KC mobile frontend** (`app/apps/mobile/`) is **paused**. Pull requests
that only change KC mobile UI are **closed automatically** with a pointer back
here and to [`AGENTS.md`](AGENTS.md).

Backend changes in `supabase/` and shared packages may be accepted when they
support GLOWE or shared infrastructure with clear justification.

Issues labeled **`maintainer-only`** are not for volunteers.

## Contributor Terms

By opening a pull request against this repository, you agree to the
[KarmaCommunity Contributor License Agreement](CLA.md). The PR template includes
a required checkbox confirming your agreement.

Do not copy, redistribute, or commercially reuse this codebase outside the
contribution process — see [LICENSE](LICENSE).

## Local data only

External contributors **must** run Supabase locally (Docker). Do not request
or commit hosted `dev`/`prod` URLs, anon keys, or service-role keys.

## Dev setup (local-only)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Node.js](https://nodejs.org/) (LTS) and [pnpm](https://pnpm.io/)

### Steps

1. **Clone** the repository and `cd` into it.
2. **Start Supabase locally and seed GLOWE** (from repo root):
   ```bash
   ./scripts/dev-up.sh
   ```
   This wraps `supabase start`, `supabase db reset`, and
   `node scripts/seed-glowe-local.mjs`. The seed uses fictional
   `@example.test` accounts and refuses any non-local Supabase URL.
3. **Configure env:** copy [`app/.env.example`](app/.env.example) to
   `app/.env.local` (gitignored). Paste the **local** URL and anon key printed
   by `./scripts/dev-up.sh` — never hosted project credentials.
4. **Install JS dependencies:**
   ```bash
   cd app
   pnpm install
   ```
5. **Run GLOWE web locally:**
   ```bash
   pnpm --filter @kc/glowe-web dev
   ```
   Open `http://localhost:4321`.

6. **Verify before opening a PR** (from `app/`):
   ```bash
   pnpm typecheck && pnpm test && pnpm lint
   ```

If Supabase is already running and reset, you can rerun only the fictional GLOWE
seed:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key> \
node scripts/seed-glowe-local.mjs
```

Get the local service-role key from `supabase status -o env`. Never commit it.

### Fictional local seed accounts

Password for every seeded user (override with `GLOWE_LOCAL_SEED_PASSWORD` when
running the seed script):

```text
GloweLocal!2026
```

| Role | Email | Notes |
| --- | --- | --- |
| Approved org | `glowe-local-org-harbor-food@example.test` | Harbor Food Circle |
| Pending org | `glowe-local-org-garden-futures@example.test` | Awaiting approval |
| Individual | `glowe-local-alex@example.test` | Logistics volunteer |
| Individual | `glowe-local-sam@example.test` | Designer |
| Individual | `glowe-local-riley@example.test` | Mentor |

**Auth note:** the public GLOWE UI is Google-only. Seeded email/password users
exist in the **local** Auth database so data and RLS can be exercised; the
production-shaped UI does not currently expose a password form. Guest browsing
of seeded content works immediately. A
[`good first issue`](https://github.com/KarmaCummunity/MVP-2/labels/good%20first%20issue)
tracks adding a **localhost-only** password sign-in panel for contributors.

### Clean-machine checklist

Run this once on a fresh machine before your first PR:

- [ ] Docker Desktop running (`docker info` succeeds)
- [ ] `supabase --version` and `node --version` / `pnpm --version` available
- [ ] `./scripts/dev-up.sh` completes without errors
- [ ] `app/.env.local` points at `http://127.0.0.1:54321` (or `localhost`)
- [ ] `pnpm --filter @kc/glowe-web dev` serves `http://localhost:4321`
- [ ] Guest home shows seeded opportunities / community content
- [ ] `cd app && pnpm typecheck && pnpm test && pnpm lint` all pass

## How we work together

1. Pick an open issue labeled `good first issue` or `help wanted` (and
   `contributor-facing`). Prefer the
   [GloWe project board](https://github.com/orgs/KarmaCummunity/projects/2).
2. Comment on the issue that you are taking it (avoid duplicate work).
3. Fork → branch from `dev` → implement → open a PR against `dev`.
4. Keep the PR focused on **one issue**. Prefer diffs that are easy to review
   (rough guide: **≤ ~300 lines** of meaningful change unless the issue says
   otherwise).
5. Maintainer review target: **within 3 business days**. Ping
   [@navesarussi](https://github.com/navesarussi) only if that window passes.

Questions: [GitHub Discussions](https://github.com/KarmaCummunity/MVP-2/discussions).

## Branch & PR flow

1. **Fork** the repository on GitHub.
2. **Branch** from the latest `dev`, using Conventional Commit style names:
   ```text
   <type>/<short-kebab-description>
   ```
   Examples: `fix/glowe-empty-forums-copy`, `feat/glowe-localhost-password-login`,
   `docs/readme-seed-table`.
3. **Open a pull request against `dev`** — never against `main`.
4. Wait for review and merge by the maintainer.

Contributors do **not** have push access. All merges are maintainer-controlled.

Branch protection keeps `required_approving_review_count` at **0** on purpose.
External contributors cannot merge PRs regardless of that setting — only
collaborators with write or admin access can use the merge button. The maintainer
still reviews every external PR before merge. Raising the required review count
would not add safety for fork-based contributors and could interfere with
maintainer and automated agent workflows on `dev`.

## Commit & PR conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>)?: <subject>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`, `ci`, `style`.

Subject must start with a **lowercase** letter (enforced by CI PR hygiene).

Every PR body must include a **Mapped to spec** section. External contributors
may write `N/A — tooling/docs only` when the change is not tied to an internal
`FR-*` requirement.

## Merge bar

A PR into `dev` may merge only when **all required status checks** are green,
including:

- `typecheck · test · lint` (frontend CI)
- Backend SQL probes, contract checks, and migration guards (when applicable)
- **SonarCloud quality gate**

Run the local subset (`pnpm typecheck && pnpm test && pnpm lint` from `app/`)
before pushing to catch failures early.

**`main`** accepts only pull requests whose head branch is **`dev`**, after the
full release gate set passes. See `docs/SSOT/RELEASE_CHECKLIST.md`.

## Who reviews / triage

[@navesarussi](https://github.com/navesarussi) is the sole merge authority on
`dev` and `main`, and is listed in root [`CODEOWNERS`](CODEOWNERS) for
contributor-facing paths (including `app/apps/glowe-web/` and `.github/`).

Automated tools (e.g. SonarCloud, and future Snyk / CodeRabbit integrations) may
post findings but do not merge PRs.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Please be
respectful and constructive.

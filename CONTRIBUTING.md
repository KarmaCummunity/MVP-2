# Contributing to GLOWE

Thank you for helping improve GLOWE. This guide is written for external
contributors who do not have access to the internal agent workflow documented in
`CLAUDE.md`.

## Scope

**GLOWE contributions are welcome.** Active product code lives in
`app/apps/glowe-web/`.

The **KC mobile frontend** (`app/apps/mobile/`) is **paused**. Pull requests
that only change KC mobile UI will be redirected or closed. See
[`AGENTS.md`](AGENTS.md) for the standing product directive.

Backend changes in `supabase/` and shared packages may be accepted when they
support GLOWE or shared infrastructure with clear justification.

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
2. **Start Supabase locally** (from repo root):
   ```bash
   supabase start
   supabase db reset   # applies migrations + seed
   ```
3. **Configure env:** copy [`app/.env.example`](app/.env.example) to
   `app/.env.local` (gitignored). Replace the placeholder Supabase URL and anon
   key with the **local** values from `supabase status` — never hosted project
   credentials.
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

Fictional local seed data for GLOWE is planned (see project backlog INFRA-OSS-3).
Until that ships, `supabase db reset` applies the base `seed.sql` migrations.

## Branch & PR flow

1. **Fork** the repository on GitHub.
2. **Branch** from the latest `dev`.
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

## Who reviews

[@navesarussi](https://github.com/navesarussi) is the sole merge authority on
`dev` and `main`. Automated tools (e.g. SonarCloud, and future Snyk / CodeRabbit
integrations) may post findings but do not merge PRs.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Please be
respectful and constructive.

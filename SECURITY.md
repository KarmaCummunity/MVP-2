# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for unpatched vulnerabilities.

1. Prefer GitHub **Private vulnerability reporting** on this repository.
2. Fallback: email `karmacommunity2.0@gmail.com` with steps to reproduce.

We will acknowledge receipt and coordinate a fix before any public disclosure.

## Quality & security tooling (contributor matrix)

External contributors do **not** need accounts on these tools. They run as
GitHub/org integrations on every PR.

| # | Tool | Status | Blocks merge? | Notes |
| - | ---- | ------ | ------------- | ----- |
| 1 | **SonarCloud** (SonarQube SaaS) | ✅ Active | **Yes** (`SonarCloud quality gate`) | Workflow: `.github/workflows/ci-sonar.yml`. Setup: `docs/dev/SONAR.md`. |
| 2 | **Snyk** | ✅ Active (`SNYK_TOKEN` set) | No (promote later) | Workflow: `.github/workflows/ci-snyk.yml`. |
| 3 | **CodeRabbit** | ✅ Active (org App installed) | No (review comments only) | `.coderabbit.yaml` focuses on `app/apps/glowe-web/**`. |
| 4 | **GitHub Dependabot** | ✅ Active | N/A (opens fix PRs) | Config: `.github/dependabot.yml`. Security updates: **enabled**. |
| 5 | **GitGuardian** (ggshield) | ✅ Active (`GITGUARDIAN_API_KEY` set) | No (promote later) | Workflow: `.github/workflows/ci-gitguardian.yml`. |
| 6 | **Secret Scanning** | ✅ Active | Push-time block | Enabled + push protection on the public repo. |
| 7 | **Automated tests** | ✅ Active | **Yes** | Unit: `typecheck · test · lint` (Vitest). Integration: `apply migrations · rls · types · sql probes`, `rpc · table contract`. E2E on `main` release: `CI — E2E dev`. |

Contributors should run locally before opening a PR (from `app/`):

```bash
pnpm typecheck && pnpm test && pnpm lint
```

## Maintainer setup

Repository security features (verified 2026-07-19 via `gh api` read-back):

| Feature | Status |
| --- | --- |
| Private vulnerability reporting | enabled |
| Dependabot security updates | enabled |
| Dependabot version updates | enabled (`.github/dependabot.yml` → weekly npm + monthly Actions on `dev`) |
| Secret scanning | enabled (org/repo policy; do not disable) |
| Secret scanning push protection | enabled (do not disable) |
| Fork PR workflow approval | `first_time_contributors` |
| GitHub Discussions | enabled |

### One-time secrets (org-admin / maintainer)

Add these under **GitHub → Settings → Secrets and variables → Actions** (repo or org):

| Secret | Tool | How to obtain |
| --- | --- | --- |
| `SONAR_TOKEN` | SonarCloud | ✅ Already set. SonarCloud → My Account → Security → token. |
| `SNYK_TOKEN` | Snyk | [snyk.io](https://app.snyk.io/account) → Auth token → org service account recommended. |
| `GITGUARDIAN_API_KEY` | GitGuardian | [GitGuardian dashboard](https://dashboard.gitguardian.com/) → API → service account or personal token. Alternative: install the [GitGuardian GitHub App](https://github.com/apps/gitguardian) instead of CI. |

### CodeRabbit (GitHub App — no secret in repo)

1. Org admin installs [CodeRabbit](https://github.com/apps/coderabbitai) on `KarmaCummunity/GloWe`.
2. `.coderabbit.yaml` is already committed — reviews focus on `app/apps/glowe-web/**`.
3. Open a test PR; verify CodeRabbit posts review comments (non-merging).

### Promoting Snyk / GitGuardian to required checks

After 1–2 weeks of clean baselines:

1. Remove `continue-on-error: true` from the workflow job (or flip to hard-fail).
2. Add `Snyk dependency scan` / `GitGuardian secret scan` to branch protection on `dev`/`main`.
3. Update `docs/SSOT/ENVIRONMENTS.md` "Dev merge gates" table in the same PR.

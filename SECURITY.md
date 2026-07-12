# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for unpatched vulnerabilities.

1. Prefer GitHub **Private vulnerability reporting** on this repository.
2. Fallback: email `karmacommunity2.0@gmail.com` with steps to reproduce.

We will acknowledge receipt and coordinate a fix before any public disclosure.

## Maintainer setup

Repository security features (verified 2026-07-12 via `gh api` read-back):

| Feature | Status |
| --- | --- |
| Private vulnerability reporting | enabled |
| Dependabot security updates | enabled |
| Secret scanning | enabled (org/repo policy; do not disable) |
| Secret scanning push protection | enabled (do not disable) |
| Fork PR workflow approval | `first_time_contributors` (`PUT …/actions/permissions/fork-pr-contributor-approval`) |
| GitHub Discussions | enabled |

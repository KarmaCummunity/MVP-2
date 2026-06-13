# Testing & Quality Gates

> **Audience:** AI agents implement and maintain tests; humans validate product behavior on dev/prod URLs.
> **Operating model:** Agents ship via PRs to `dev`; production releases are PRs `dev` → `main`. Humans do not run `pnpm test` locally as a gate — CI + E2E do.

## Pyramid

1. **Unit** — `cd app && pnpm test` (vitest). Required on every PR to `dev`.
2. **Contract / migrations** — `ci-backend`, `ci-contract`. Required on `dev`.
3. **Bundle smoke** — `scripts/smoke-web-bundle.mjs` on exported dist. Required on `dev`.
4. **E2E (Web)** — Playwright vs `DEV_WEB_URL`. **Required** on PR `dev` → `main` (P0 journeys).
5. **Performance** — Lighthouse + k6. Scheduled on `dev` (Wave 4); blocking only after budgets stabilize.
6. **Accessibility** — axe Playwright on critical routes (Wave 5).
7. **Native E2E** — Maestro. Nightly until stable (Wave 6).

## CI feedback lanes (agents)

| Event | Fast checks | E2E |
| --- | --- | --- |
| PR → `dev` | unit, lint, migrations, bundle smoke | not required (Wave 2+ optional advisory) |
| PR → `main` | same + release guard | **P0 required** (`CI — E2E dev`) |
| push → `dev` | deploy + optional advisory E2E | recommended, non-blocking |

## E2E test user (dev only)

**Canonical dev CI user** (created 2026-05-29, Supabase dev `roeefqpdbftlndzsvhfj`):

| Field | Value |
| --- | --- |
| Email | `e2e-ci@karma-community.test` |
| Password | In operator file `~/.kc-dev-secrets.env` as `E2E_TEST_PASSWORD` — **never commit** |
| Auth user id | `284c9fb6-6c69-4b56-94b0-fee65cf330df` |

Re-create if deleted: `source ~/.kc-dev-secrets.env && node scripts/create-e2e-user.mjs` (uses service role from management API).

GitHub Actions secrets (repo settings): `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` (same values as local file), `E2E_SUPABASE_ANON_KEY_DEV` (dev publishable anon — dev-scoped secret name, wired to the `E2E_SUPABASE_ANON_KEY` env var in CI).

The human `/sign-in` UI may be broken — E2E uses API session injection, not that form.

Preflight: `set -a && source ~/.kc-dev-secrets.env && set +a && node scripts/ensure-e2e-user.mjs`
- **Auth in E2E (option 3):** Playwright injects the Supabase session into `localStorage` via API — no Google SSO, no `/sign-in` form, no `EXPO_PUBLIC_DEV_*` shortcuts.

## P0 release journeys (automated)

Maps to `RELEASE_CHECKLIST.md` dev smoke:

1. Auth — sign in with E2E user.
2. Feed — home feed renders (posts or empty state, not error).
3. Write — create-post screen loads; title field accepts input.
4. Chat — inbox screen opens.

## Flake protocol (agents)

1. First red without app change → re-run the workflow once.
2. Second red → add `TECH_DEBT.md` row with reproducer; only then `test.fixme` with TD id if release is blocked.
3. Never merge `dev` → `main` with a quarantined P0 spec.
4. If E2E fails but manual dev works → fix the test or selectors; do not weaken product assertions.

## Selectors

- Prefer `testID` on React Native (`testID` → `data-testid` on Web).
- Fallback: `getByRole` with stable Hebrew copy (document i18n key in spec comment).

## Human PM check (5 min, prod only)

After merge to `main`: incognito prod URL, sign-in, feed, one write path, chat inbox. See `RELEASE_CHECKLIST.md` post-deploy section.

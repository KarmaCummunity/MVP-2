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

**Canonical dev CI user** (Supabase dev `roeefqpdbftlndzsvhfj`):

| Field | Value |
| --- | --- |
| Email | `karmacommunity2.0@gmail.com` (wired to `E2E_TEST_EMAIL`) |
| Password | GitHub secret `E2E_TEST_PASSWORD` — **never commit** |
| Auth user id | `a46d79c2-8818-4fea-8c6a-4fc60b5097d0` |
| Role | **super-admin** (`users.is_super_admin = true`) |

Re-create if deleted: `source ~/.kc-dev-secrets.env && node scripts/create-e2e-user.mjs` (uses service role from management API).

GitHub Actions secrets (repo settings): `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `E2E_SUPABASE_ANON_KEY_DEV` (dev publishable anon — dev-scoped secret name, wired to the `E2E_SUPABASE_ANON_KEY` env var in CI).

Because this account is a **super-admin**, it lands on the admin portal (`/(admin)`) rather than the public home feed on first paint. The P0 journeys (`auth.setup.ts`, `feed.spec.ts`) therefore switch to the Home tab (`getByRole('tab', { name: 'בית' })`) when `feed-screen` is not already the active surface — a no-op for a normal user.

The human `/sign-in` UI may be broken — E2E uses API session injection, not that form.

Preflight: `set -a && source ~/.kc-dev-secrets.env && set +a && node scripts/ensure-e2e-user.mjs`
- **Auth in E2E (option 3):** Playwright injects the Supabase session into `localStorage` via API — no Google SSO, no `/sign-in` form, no `EXPO_PUBLIC_DEV_*` shortcuts.

## Agent test users (dev only)

Two canonical "looks-real" users for AI agent testing on Supabase dev `roeefqpdbftlndzsvhfj`.
Unlike the CI E2E user above, these users have completed onboarding, realistic Hebrew profiles,
and are used for multi-user interaction tests (chat, post closure, follow flows, etc.).

### Agent Alpha — moderator admin

| Field | Value |
| --- | --- |
| Email | `agent-alpha@karma-community.test` |
| Password | local secret `AGENT_ALPHA_PASSWORD` (or `AGENT_TEST_PASSWORD`) — **never commit** |
| Display name | דניאל לוי |
| City | תל אביב יפו |
| Admin role | **moderator** (`admin_role_grants`) — portal + reports + chat moderation + user/post search |
| `onboarding_state` | `completed` |

### Agent Beta — regular user

| Field | Value |
| --- | --- |
| Email | `agent-beta@karma-community.test` |
| Password | local secret `AGENT_BETA_PASSWORD` (or `AGENT_TEST_PASSWORD`) — **never commit** |
| Display name | מיכל כהן |
| City | ירושלים |
| Admin role | none — plain community member |
| `onboarding_state` | `completed` |

### Why two users?

- **Alpha alone:** auth flows, admin portal, moderation actions, admin-level RLS queries.
- **Alpha + Beta:** inter-user flows — follow requests, direct chat, post closure with recipient,
  "close from chat" lifecycle, report-submission (Beta reports Alpha's content), RLS persona suite (Wave 3).

### Admin role comparison

| Permission | super_admin (CI E2E user) | moderator (Alpha) | none (Beta) |
| --- | --- | --- | --- |
| Admin portal access | ✅ | ✅ | ❌ |
| Reports + moderation | ✅ | ✅ | ❌ |
| Grant/revoke admin roles | ✅ | ❌ | ❌ |
| All audit logs | ✅ | ❌ (own only) | ❌ |
| Regular community actions | ✅ | ✅ | ✅ |

> **Why not super_admin for Alpha?** The DB enforces a single active `super_admin` at a time
> (`admin_role_grants_single_super_admin_uniq` index). The existing CI E2E user holds that slot.
> `moderator` covers all agent-testable admin flows.

### Provisioning

```bash
# Add to ~/.kc-dev-secrets.env (never commit):
# AGENT_ALPHA_PASSWORD='...'
# AGENT_BETA_PASSWORD='...'

source ~/.kc-dev-secrets.env
node scripts/create-agent-test-users.mjs   # idempotent — safe to re-run
node scripts/ensure-agent-test-users.mjs   # verify both can sign in
```

### Using in E2E / agent code

Like the CI E2E user, agent tests should inject Supabase sessions via API rather than
driving the sign-in UI form. Inject per-user:

```typescript
// auth helper (Playwright)
const session = await signInWithPassword(
  process.env.AGENT_ALPHA_EMAIL,
  process.env.AGENT_ALPHA_PASSWORD,
);
await page.evaluate((s) => localStorage.setItem('supabase.auth.token', JSON.stringify(s)), session);
```

For multi-user tests, maintain two separate Playwright `BrowserContext` objects — one per user —
so cookies and localStorage are isolated.

---

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

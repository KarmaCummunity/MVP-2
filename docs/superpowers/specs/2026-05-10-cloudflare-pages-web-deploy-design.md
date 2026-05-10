# Cloudflare Pages Web Deploy — Design

| Field | Value |
| ----- | ----- |
| **Status** | Draft (pending implementation) |
| **Owner** | Engineering |
| **Date** | 2026-05-10 |
| **Mapped to SRS** | `NFR-PLAT-*` (P4.1 — web shell deployable) |
| **Target environment** | `dev` (single env for now) |
| **Target URL** | `https://dev3.karma-community-kc.com` |

---

## 1. Goal

Make the existing Expo Router web build (`react-native-web` SPA) reachable at a public URL (`dev3.karma-community-kc.com`) without modifying the mobile CI/CD pipeline.

Deploy is **continuous from `main`** (push → live in ~1 min) with **per-PR preview URLs** for review before merge.

## 2. Non-goals

- Building a dedicated web shell (separate routes / responsive design tuning) — that stays under P4.1.
- Adding a server-side runtime — the app talks directly to Supabase, no backend of our own.
- Production-grade hosting (multiple environments, staging vs prod, custom CDN rules) — `dev3` is the only environment for now.
- Migrating any mobile-specific behavior. iOS / Android / Expo Go workflows are untouched.

## 3. Decision: drop Railway, use Cloudflare Pages

The repo currently has a Railway project (auto-detect) that fails because there is no `Dockerfile` / `railway.json` / `nixpacks.toml`. Railway is paid compute; the app is a static SPA. We replace it with **Cloudflare Pages** (free for our scale, native SPA support, GitHub-integrated, free SSL on custom domains, per-PR previews).

The Railway project will be deleted after the Cloudflare deploy is verified working.

## 4. Architecture

```
GitHub (push to main / open PR)
        │
        ▼
Cloudflare Pages build runner  (independent of GitHub Actions CI)
        │  pnpm install --frozen-lockfile
        │  pnpm --filter @kc/mobile exec expo export -p web
        ▼
Static output:  app/apps/mobile/dist/
        │
        ▼
Cloudflare CDN  →  https://dev3.karma-community-kc.com
                   https://<pr-N>.<project>.pages.dev   (preview)
```

**Why this leaves the mobile CI alone:** Cloudflare Pages reacts to GitHub webhooks on its own infrastructure — it does not run inside `.github/workflows/ci.yml`. Our existing typecheck / test / lint job is unchanged, and no new GitHub Actions workflow is added.

## 5. Repo changes

Three small additions. No production code changes.

### 5.1 `app/package.json` — convenience scripts

Add to the existing `scripts` block:

```json
"build:web": "pnpm --filter @kc/mobile exec expo export -p web",
"preview:web": "npx serve app/apps/mobile/dist"
```

These are also what Cloudflare's build command invokes, so local repro and CI repro stay in sync.

### 5.2 `app/apps/mobile/.gitignore` — ignore the export output

Append `dist/` so we never accidentally commit a built bundle.

### 5.3 `docs/DEPLOY_WEB.md` — runbook

Single page documenting:
- Cloudflare Pages project settings (build command, output dir, root dir, Node version)
- Required environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- Hostinger DNS record for `dev3` (CNAME → `<project>.pages.dev`)
- Supabase Auth redirect URL update (`https://dev3.karma-community-kc.com/**`)
- How to run the build locally (`pnpm build:web && pnpm preview:web`)
- Rollback (revert the offending commit; CF auto-rebuilds)

## 6. Cloudflare Pages configuration (manual, one-time)

| Setting | Value |
| ------- | ----- |
| Production branch | `main` |
| Build command | `cd app && pnpm install --frozen-lockfile && pnpm build:web` |
| Build output directory | `app/apps/mobile/dist` |
| Root directory | `/` (repo root) |
| Node version | `20` |
| Package manager | pnpm 9 (auto-detected from `packageManager` field) |
| Env (Production + Preview) | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

Both env values match the dev project's existing `app/apps/mobile/.env`. The anon key is the publishable key, so storing it in Cloudflare's env panel is fine.

## 7. DNS configuration (Hostinger, manual, one-time)

After the Cloudflare project is created and the production deploy succeeds, Cloudflare exposes a default URL like `karma-community-mvp2.pages.dev`. Then:

1. In Cloudflare Pages → Custom domains → add `dev3.karma-community-kc.com`. Cloudflare prints the exact CNAME target.
2. In Hostinger DNS panel → add a `CNAME` record:
   - Name: `dev3`
   - Target: `<the value Cloudflare gave>`
   - TTL: default
3. Wait for propagation (usually <5 min). Cloudflare provisions SSL automatically.

## 8. Supabase configuration (manual, one-time)

In Supabase dashboard → Authentication → URL Configuration → Redirect URLs, add:

```
https://dev3.karma-community-kc.com/**
```

Without this, Google SSO will reject the callback when the user signs in from the deployed web app.

## 9. Risks and mitigations

| Risk | Likelihood | Mitigation |
| ---- | ---------- | ---------- |
| `expo export -p web` fails on a native-only module | Medium | Run locally **before** wiring CF. Likely candidates: `expo-secure-store` (has web shim — fine), `react-native-reanimated` worklets, `expo-image-picker`. Patch with conditional imports / web shims as needed. |
| SPA fallback (deep links return 404) | Low | Expo Router 6 with `"output": "single"` produces a single-page SPA with index fallback. If CF still 404s on deep paths, drop `_redirects` (`/* /index.html 200`) into the export. |
| RTL breaks on web | Low | The app forces `I18nManager.forceRTL`; on web this is a no-op and the layout uses `dir="rtl"` via root component. Verify by visual smoke-test after first deploy. |
| Bundle size too large for free tier | Very low | Free tier is generous (25 MB per file, no total cap on assets). Expo web export is typically <10 MB. |
| OAuth redirect mismatch | Medium | Pre-add the Supabase redirect URL **before** trying sign-in flow on prod. Documented in DEPLOY_WEB.md step 4. |

## 10. Verification plan

Run all three layers:

1. **Local** — `pnpm build:web` exits 0; `pnpm preview:web` serves on `localhost:3000`; manually load `/`, `/donations`, `/(guest)/feed` and confirm no console errors.
2. **CF preview** — open a PR with these changes; CF builds and posts a preview URL on the PR. Smoke-test the preview URL: feed loads, sign-in works (against real dev Supabase), donations grid renders, RTL is correct.
3. **Production at custom domain** — after merge and DNS propagation, repeat smoke-test on `https://dev3.karma-community-kc.com`. Confirm Google SSO completes the round-trip.

## 11. Rollback

- **Bad deploy**: revert the offending commit on `main` → CF auto-rebuilds the previous good state.
- **Need to take site down entirely**: in CF dashboard → Pages project → "Pause builds" + remove custom domain. DNS reverts in <5 min.

## 12. Implementation steps (high-level)

The detailed plan goes in the writing-plans phase. Headline steps:

1. Add `build:web` / `preview:web` scripts in `app/package.json`.
2. Add `dist/` to `app/apps/mobile/.gitignore`.
3. Run `pnpm build:web` locally; fix any web-only build errors that surface.
4. Run `pnpm preview:web`; smoke-test in browser.
5. Write `docs/DEPLOY_WEB.md`.
6. Commit + open PR. CI must stay green.
7. (User does manually, with help) Create Cloudflare Pages project and connect GitHub.
8. (User does manually, with help) Update Hostinger DNS + Supabase redirect URLs.
9. Verify production URL.
10. (User does manually) Delete the failing Railway project.

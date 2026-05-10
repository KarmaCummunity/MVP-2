# Web Deployment — Cloudflare Pages → `dev3.karma-community-kc.com`

> Operator runbook. Design lives in [`docs/superpowers/specs/2026-05-10-cloudflare-pages-web-deploy-design.md`](./superpowers/specs/2026-05-10-cloudflare-pages-web-deploy-design.md).

## What this gives us

- Static SPA build of the Expo Router web target, served from `https://dev3.karma-community-kc.com`.
- Auto-deploy on every push to `main` (production), per-PR preview URLs (`<branch>.<project>.pages.dev`).
- Free SSL on the custom domain.
- **Zero impact** on `.github/workflows/ci.yml` — Cloudflare's build runs on its own infrastructure.

## Local commands

| Command | What it does |
| ------- | ------------ |
| `pnpm build:web` (from `app/`) | Runs `expo export -p web` and writes `_redirects` for SPA fallback. Output: `app/apps/mobile/dist/`. |
| `pnpm preview:web` (from `app/`) | Serves the built `dist/` on `http://localhost:3000` with SPA fallback enabled. Use to verify deep links work before pushing. |

## Cloudflare Pages — first-time setup

Done **once** per environment. Requires a Cloudflare account.

1. Cloudflare dashboard → Pages → **Create a project** → **Connect to Git**.
2. Select GitHub → authorize → pick `KarmaCummunity/MVP-2`.
3. Build configuration:
   | Field | Value |
   | ----- | ----- |
   | Project name | `karma-community-mvp2` (used as the default `*.pages.dev` URL) |
   | Production branch | `main` |
   | Framework preset | None |
   | Build command | `cd app && pnpm install --frozen-lockfile && pnpm build:web` |
   | Build output directory | `app/apps/mobile/dist` |
   | Root directory | `/` (leave default) |
4. **Environment variables** (add to **both** Production and Preview):
   - `EXPO_PUBLIC_SUPABASE_URL` = the value from `app/apps/mobile/.env`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = the value from `app/apps/mobile/.env`
   - `NODE_VERSION` = `20`
5. Save → Cloudflare runs the first build. Wait until it goes green.

### Custom domain

After the first deploy succeeds:

1. Cloudflare project → **Custom domains** → **Set up a custom domain** → enter `dev3.karma-community-kc.com`.
2. Cloudflare prints the exact CNAME target (e.g. `karma-community-mvp2.pages.dev`). Copy it.
3. In Hostinger DNS panel for `karma-community-kc.com`:
   - Type: `CNAME`
   - Name: `dev3`
   - Target: paste the Cloudflare value
   - TTL: default
4. Back in Cloudflare → wait for the green checkmark next to the domain (usually <5 min). SSL is provisioned automatically.

### Supabase Auth redirect URLs (one-time)

Without this, Google SSO (and any future OAuth) on the deployed web app will reject the callback.

1. Supabase dashboard → project `roeefqpdbftlndzsvhfj` → Authentication → **URL Configuration**.
2. Add to **Redirect URLs**:
   ```
   https://dev3.karma-community-kc.com/**
   ```
3. Save.

## Decommissioning Railway (after Cloudflare is verified)

The repo has no Railway config files (it was set up via Railway's GitHub auto-detect, which is exactly why it kept failing — there is no Dockerfile to build).

To stop the failed-build noise on every PR:

1. Railway dashboard → MVP-2 project → Settings → **Delete project**, **or** Settings → GitHub → **Disconnect repository**.

Either action removes the GitHub webhook that triggers the failing builds. No repo changes needed.

## Verifying a deploy

After a push to `main` (or opening a PR), Cloudflare's build runs. Steps to verify:

1. **Build went green** — Cloudflare dashboard → Deployments → latest is green.
2. **Bundle served** — `curl -sSI https://dev3.karma-community-kc.com/` returns `HTTP/2 200`.
3. **SPA fallback works** — `curl -sSI https://dev3.karma-community-kc.com/donations` returns `HTTP/2 200` (same content as `/`, served via the `_redirects` rule).
4. **Static assets resolve** — `curl -sSI https://dev3.karma-community-kc.com/favicon.ico` returns `HTTP/2 200` with `Content-Type: image/x-icon`.
5. **Manual smoke** — open the URL in Chrome/Safari, exercise: feed → donations grid → sign-in → post detail. RTL must render correctly.

## Rollback

- **Bad code went live**: revert the offending commit on `main`. Cloudflare auto-rebuilds the previous good state (~1 min).
- **Need site down immediately**: Cloudflare project → Settings → **Pause deployments** + remove the custom domain. DNS reverts within Hostinger's TTL.

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Cloudflare build fails on `pnpm install` | wrong Node version | Set `NODE_VERSION=20` env var. |
| Build succeeds but `/donations` 404s | `_redirects` missing from output | Confirm `pnpm build:web` ends with `[web-postbuild] wrote …/_redirects`. |
| Custom domain stuck on "Verifying" >15 min | DNS hasn't propagated | `dig CNAME dev3.karma-community-kc.com` should show the Cloudflare target. If not, double-check the Hostinger record. |
| Google SSO returns "redirect_uri_mismatch" | Supabase redirect list incomplete | Add `https://dev3.karma-community-kc.com/**` per the Supabase step above. |
| Bundle larger than expected | Native-only deps pulled in | Check the bundler output in Cloudflare logs for unexpected `react-native` modules — file an issue and add a web shim. |

# AGENTS.md

This repository follows the `CLAUDE.md` convention for agent rules.
All process, architecture, and workflow rules live in [`CLAUDE.md`](./CLAUDE.md).
Read it first.

If you landed in [`docs/`](./docs/) first, [`docs/AGENTS.md`](./docs/AGENTS.md) points back here; it does not define extra rules.

## ⚠️ Active product focus (2026-07-04, standing until explicitly revised)

**GLOWE is the active MVP. The KC frontend is out of scope.**

- **Do not build, QA, wire, or plan anything against the KC app frontend**
  (`app/apps/mobile/**` UI — the KC feed, post-detail, settings screens,
  expo-router routes). Treat KC-frontend work as out of scope until a PM message
  explicitly re-opens it.
- **Only the GLOWE frontend matters** — `app/apps/glowe-web/**`, the vanilla-JS
  static site served at `dev.karma-community.pages.dev/glowe/`. All product/UX
  and feature work targets GLOWE web.
- **Use the KC backend for the GLOWE frontend.** The KC Supabase backend (Auth,
  Postgres + RLS, Edge Functions, RPCs) is the single source of truth; GLOWE web
  calls it. Backend capabilities originally built for KC should be surfaced into
  the GLOWE frontend (e.g. the FR-TRANSLATE-003 translation engine → GLOWE).
- GLOWE's own interface i18n (FR-GLOWE-004, chrome-only, `localStorage`) is
  SEPARATE from user-generated-content translation (FR-TRANSLATE-003).

### Revision (2026-07-05): production root serves KC, not GLOWE

The above is a *development-priority* directive, not an instruction to redirect
KC production traffic away from the KC app. `app/scripts/web-postbuild.mjs`'s
Cloudflare root-redirect-to-`/glowe` gate is now environment-gated
(`EXPO_PUBLIC_ENVIRONMENT === 'development'`, `DECISIONS.md` D-169): the `dev`
deploy still redirects its root to GLOWE; `main`/production serves the real KC
web app at its root. GLOWE stays reachable at `/glowe` in every environment.

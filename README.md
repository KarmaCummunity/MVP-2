# Karma Community / GLOWE

**KC mobile app development is paused.** All active development targets **GLOWE**
(`app/apps/glowe-web/`). GLOWE and the legacy KC mobile app share the same
**Supabase backend** (`supabase/`).

## What is GLOWE?

GLOWE is a global social-impact web application for volunteering, community
organizations, and collaboration — connecting people who want to help with
causes, opportunities, events, and projects that need support.

## Quickstart

1. **Clone** this repository.
2. **Start local Supabase** (Docker required): from the repo root, run
   `supabase start`. See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup.
3. **Install dependencies:** `cd app && pnpm install`
4. **Configure env:** use [`app/.env.example`](app/.env.example) as the variable
   template. Copy it to `app/.env.local` (gitignored) and fill in the local API
   URL and anon key from `supabase status` — never use hosted dev/prod
   credentials. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
5. **Run GLOWE web:** `pnpm --filter @kc/glowe-web dev` (serves at
   `http://localhost:4321`).

Full contributor setup, seeding, and verification steps are in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Repository map

```
app/
├── apps/
│   ├── glowe-web/     # GLOWE — active product (vanilla JS static site)
│   └── mobile/        # KC mobile app — paused (Expo / React Native)
├── packages/          # Shared domain, application, infrastructure, UI
supabase/              # Shared backend — migrations, RLS, Edge Functions, seed
docs/SSOT/             # Internal specs & backlog (not required for a first PR)
```

## License

Source is visible for transparency and contribution to **this repository only**.
See [LICENSE](LICENSE) (All Rights Reserved — not an OSI open-source license).
Inbound contributions are governed by [CLA.md](CLA.md).

## Contributing

We welcome pull requests for GLOWE. Read [CONTRIBUTING.md](CONTRIBUTING.md) and
agree to the [Contributor License Agreement](CLA.md) before opening a PR.

## Security

Report vulnerabilities responsibly — see [SECURITY.md](SECURITY.md).

## Branches & CI

Pull requests target **`dev`**. Required CI checks (including `typecheck`, `test`,
and `lint`) must be green before merge. **`main`** is updated only from **`dev`**
after the full release gate set passes.

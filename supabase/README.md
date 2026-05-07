# Supabase — Karma Community

This directory holds SQL migrations and seed data for the **public** schema.
The hosted Supabase project's URL and keys live in `.env` / the dashboard;
this folder is committed and review-able.

## Layout

```
supabase/
├── config.toml              # CLI config (project_id, ports, auth redirects)
├── migrations/              # ordered SQL migrations
│   └── 0001_init_users.sql  # P0.2.a — Foundation & Identity
├── seed.sql                 # data inserted on `supabase db reset` (cities ref)
└── README.md
```

## Apply a migration to the live project

Two options:

### 1. CLI (preferred)

```bash
# one-time, per machine:
cd /Users/navesarussi/KC/MVP-2
supabase login
supabase link --project-ref <project-ref>

# every migration after that:
supabase db push
```

### 2. Dashboard SQL editor

Copy the contents of the migration file into Supabase Dashboard → SQL editor → Run.
Always run migrations in numeric order.

## After applying — regenerate types

```bash
supabase gen types typescript --project-id <project-ref> \
  > app/packages/infrastructure-supabase/src/database.types.ts
```

Commit the regenerated file.

## Slice plan

See `docs/superpowers/plans/2026-05-07-p0-2-db-schema-rls.md` for the full
P0.2 decomposition (P0.2.a..f). Each slice ships its own migration file and
its own commit.

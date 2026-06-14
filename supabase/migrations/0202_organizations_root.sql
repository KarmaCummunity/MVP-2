-- 0202_organizations_root — Nonprofit OS Track B0 — multi-tenant root (additive).
-- Mapped to spec: docs/SSOT/spec/18_organizations.md FR-ORG-001..004.
-- Decisions: D-60 (shared-DB + RLS tenancy via org_id JWT claim), D-62 (dual-track).
--
-- This slice is purely ADDITIVE: it introduces the tenant root tables, backfills a
-- single default organization for all existing data/users, wires the FK from
-- admin_role_grants.scope_org_id, and ships the current_org_id() tenant-context
-- helper. NO isolation is enforced on existing business tables yet — that is B2
-- (FR-ORG-020). Provisioning (transactional org creation) is B1 (FR-ORG-010).

-- ── 1. organizations ─────────────────────────────────────────────────────────
create table if not exists public.organizations (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique
                    check (slug ~ '^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$'),
  legal_name      text check (legal_name is null or char_length(legal_name) <= 200),
  display_name    text not null check (char_length(btrim(display_name)) between 1 and 200),
  registry_number text check (registry_number is null or char_length(registry_number) <= 40),
  status          text not null default 'active'
                    check (status in ('active','suspended','trial')),
  plan_id         text,  -- FK to public.plans lands in B4 (FR-ORG-040)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.organizations is
  'FR-ORG-001 — tenant root. One row per NGO/organization. Isolation by org_id rolls out in B2.';

-- ── 2. org_memberships ───────────────────────────────────────────────────────
create table if not exists public.org_memberships (
  membership_id uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  user_id       uuid not null references public.users(user_id) on delete cascade,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (user_id, org_id)
);

-- At most one default org per user.
create unique index if not exists org_memberships_one_default_per_user
  on public.org_memberships (user_id)
  where is_default;

create index if not exists org_memberships_org_idx
  on public.org_memberships (org_id);

comment on table public.org_memberships is
  'FR-ORG-002 — user↔org membership. is_default drives the portal org switcher.';

-- ── 3. org_settings ──────────────────────────────────────────────────────────
create table if not exists public.org_settings (
  org_id                 uuid primary key references public.organizations(id) on delete cascade,
  currency               text not null default 'ILS' check (char_length(currency) = 3),
  locale                 text not null default 'he' check (char_length(locale) between 2 and 10),
  fiscal_year_start_month int not null default 1 check (fiscal_year_start_month between 1 and 12),
  feature_flags          jsonb not null default '{}'::jsonb,
  updated_at             timestamptz not null default now()
);

comment on table public.org_settings is
  'FR-ORG-003 — per-tenant configuration (currency, locale, fiscal year, feature flags).';

-- ── 4. org_branding ──────────────────────────────────────────────────────────
create table if not exists public.org_branding (
  org_id          uuid primary key references public.organizations(id) on delete cascade,
  logo_url        text check (logo_url is null or char_length(logo_url) <= 2000),
  primary_color   text check (primary_color is null or primary_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color    text check (accent_color is null or accent_color ~ '^#[0-9a-fA-F]{6}$'),
  custom_domain   text check (custom_domain is null or char_length(custom_domain) <= 253),
  email_from_name text check (email_from_name is null or char_length(email_from_name) <= 100),
  updated_at      timestamptz not null default now()
);

comment on table public.org_branding is
  'FR-ORG-003 — white-label branding per tenant (logo, colors, custom domain).';

-- ── 5. admin_role_grants.scope_org_id FK → organizations ────────────────────
-- scope_org_id existed since 0173 as a bare uuid (no org table). Wire the FK now.
-- NOT VALID first, then VALIDATE so the deploy fails loudly if any orphan scope
-- exists (org-scoped roles were "reserved, no rows" per 0112/0173).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admin_role_grants_scope_org_fk'
  ) then
    alter table public.admin_role_grants
      add constraint admin_role_grants_scope_org_fk
      foreign key (scope_org_id) references public.organizations(id)
      on delete cascade
      not valid;
    alter table public.admin_role_grants
      validate constraint admin_role_grants_scope_org_fk;
  end if;
end $$;

-- ── 6. current_org_id() — tenant context helper ─────────────────────────────
-- Reads the active org from the JWT (app_metadata.org_id), set by the Auth Hook
-- (custom_access_token_hook) configured in B0 ops / B1. Returns NULL until that
-- hook is live — safe, because no isolation policy depends on it yet (B2).
create or replace function public.current_org_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'org_id',
    ''
  )::uuid;
$$;

comment on function public.current_org_id() is
  'FR-ORG-004 — active tenant from the JWT app_metadata.org_id claim. NULL when unset.';

-- ── 7. backfill: single default organization for all existing data ──────────
do $$
declare
  v_org_id uuid;
begin
  -- Idempotent: only seed if no organization exists yet.
  select id into v_org_id from public.organizations where slug = 'karma-community';
  if v_org_id is null then
    insert into public.organizations (slug, legal_name, display_name, status)
    values ('karma-community', 'Karma Community', 'קהילת קארמה', 'active')
    returning id into v_org_id;

    insert into public.org_settings (org_id) values (v_org_id);
    insert into public.org_branding (org_id) values (v_org_id);

    -- Every existing user becomes a default member of the operator's own org.
    insert into public.org_memberships (org_id, user_id, is_default)
    select v_org_id, u.user_id, true
    from public.users u
    on conflict (user_id, org_id) do nothing;
  end if;
end $$;

-- ── 8. RLS ───────────────────────────────────────────────────────────────────
alter table public.organizations  enable row level security;
alter table public.org_memberships enable row level security;
alter table public.org_settings    enable row level security;
alter table public.org_branding    enable row level security;

-- organizations: members of the org (or super_admin) can read it.
drop policy if exists organizations_member_read on public.organizations;
create policy organizations_member_read
  on public.organizations for select to authenticated
  using (
    public.has_admin_role(auth.uid(), 'super_admin')
    or exists (
      select 1 from public.org_memberships m
      where m.org_id = organizations.id and m.user_id = auth.uid()
    )
  );

-- org_memberships: a user reads their own rows; super_admin reads all.
drop policy if exists org_memberships_self_read on public.org_memberships;
create policy org_memberships_self_read
  on public.org_memberships for select to authenticated
  using (user_id = auth.uid() or public.has_admin_role(auth.uid(), 'super_admin'));

-- org_settings / org_branding: readable by members of that org (or super_admin).
drop policy if exists org_settings_member_read on public.org_settings;
create policy org_settings_member_read
  on public.org_settings for select to authenticated
  using (
    public.has_admin_role(auth.uid(), 'super_admin')
    or exists (
      select 1 from public.org_memberships m
      where m.org_id = org_settings.org_id and m.user_id = auth.uid()
    )
  );

drop policy if exists org_branding_member_read on public.org_branding;
create policy org_branding_member_read
  on public.org_branding for select to authenticated
  using (
    public.has_admin_role(auth.uid(), 'super_admin')
    or exists (
      select 1 from public.org_memberships m
      where m.org_id = org_branding.org_id and m.user_id = auth.uid()
    )
  );

-- All writes go through SECURITY DEFINER RPCs (provisioning lands in B1).
revoke insert, update, delete on public.organizations  from anon, authenticated;
revoke insert, update, delete on public.org_memberships from anon, authenticated;
revoke insert, update, delete on public.org_settings    from anon, authenticated;
revoke insert, update, delete on public.org_branding    from anon, authenticated;
grant select on public.organizations  to authenticated;
grant select on public.org_memberships to authenticated;
grant select on public.org_settings    to authenticated;
grant select on public.org_branding    to authenticated;

-- ── 9. get_my_organizations() — read model for the portal/repository ────────
create or replace function public.get_my_organizations()
returns table (
  id            uuid,
  slug          text,
  display_name  text,
  legal_name    text,
  status        text,
  is_default    boolean,
  logo_url      text,
  primary_color text,
  accent_color  text,
  currency      text,
  locale        text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id, o.slug, o.display_name, o.legal_name, o.status,
    m.is_default,
    b.logo_url, b.primary_color, b.accent_color,
    s.currency, s.locale
  from public.org_memberships m
  join public.organizations o on o.id = m.org_id
  left join public.org_branding b on b.org_id = o.id
  left join public.org_settings s on s.org_id = o.id
  where m.user_id = auth.uid()
  order by m.is_default desc, o.display_name asc;
$$;

revoke execute on function public.get_my_organizations() from public;
grant  execute on function public.get_my_organizations() to authenticated;

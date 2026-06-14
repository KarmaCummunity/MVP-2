-- 0204_finance_chart_of_accounts — Nonprofit OS Track A1 — chart of accounts (FR-BO-100).
-- Mapped to spec: docs/SSOT/spec/17_back_office.md FR-BO-100.
-- Decisions: D-62 (dual-track). Born with org_id per D-60 (isolation flips on in B2).
--
-- Adds a per-org chart of accounts and links ledger entries to an account.
-- New table is gated like the rest of the back-office (money.manage) until B2
-- swaps in org_id isolation; org_id is already present + backfilled so B2 is a
-- pure policy change, no schema rework.

-- ── 1. finance_accounts ──────────────────────────────────────────────────────
create table if not exists public.finance_accounts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  code        text not null check (char_length(btrim(code)) between 1 and 20),
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  type        text not null check (type in ('income','expense','asset','liability','equity')),
  parent_id   uuid references public.finance_accounts(id) on delete set null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, code)
);

create index if not exists finance_accounts_org_type_idx
  on public.finance_accounts (org_id, type) where is_active;

comment on table public.finance_accounts is
  'FR-BO-100 — per-org chart of accounts. Ledger entries reference an account.';

-- ── 2. ledger → account link ────────────────────────────────────────────────
alter table public.finance_ledger_entries
  add column if not exists account_id uuid references public.finance_accounts(id) on delete set null;

-- ── 3. seed a default Israeli-NGO chart for the default org ──────────────────
do $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations where slug = 'karma-community';
  if v_org is not null and not exists (
    select 1 from public.finance_accounts where org_id = v_org
  ) then
    insert into public.finance_accounts (org_id, code, name, type) values
      (v_org, '4000', 'תרומות',              'income'),
      (v_org, '4100', 'מענקים',              'income'),
      (v_org, '4900', 'הכנסות אחרות',        'income'),
      (v_org, '5000', 'שכר ונלוות',          'expense'),
      (v_org, '5100', 'ספקים ושירותים',      'expense'),
      (v_org, '5200', 'שכירות ואחזקה',       'expense'),
      (v_org, '5300', 'הוצאות תפעול',         'expense'),
      (v_org, '5900', 'הוצאות אחרות',         'expense'),
      (v_org, '1000', 'עו"ש / מזומנים',       'asset'),
      (v_org, '2000', 'התחייבויות',          'liability');
  end if;
end $$;

-- ── 4. RLS — gated like the rest of finance (money.manage) ───────────────────
alter table public.finance_accounts enable row level security;

drop policy if exists finance_accounts_admin_select on public.finance_accounts;
create policy finance_accounts_admin_select
  on public.finance_accounts for select to authenticated
  using (
    public.has_admin_role(auth.uid(), 'super_admin')
    or public.has_admin_role(auth.uid(), 'moderator')
  );

revoke insert, update, delete on public.finance_accounts from anon, authenticated;
grant select on public.finance_accounts to authenticated;

-- ── 5. helper: resolve the caller's org (fallback to default while pre-B2) ───
create or replace function public.finance_resolve_org_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select coalesce(
    public.current_org_id(),
    (select id from public.organizations where slug = 'karma-community')
  );
$$;

-- ── 6. finance_account_list ─────────────────────────────────────────────────
create or replace function public.finance_account_list(
  p_type        text default null,
  p_active_only boolean default true
)
returns table (
  id uuid, code text, name text, type text,
  parent_id uuid, is_active boolean, created_at timestamptz, updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid := public.finance_resolve_org_id();
begin
  perform admin_assert_role(v_actor, array['super_admin','moderator']);
  if p_type is not null and p_type not in ('income','expense','asset','liability','equity') then
    raise exception 'invalid_type' using errcode = '22023';
  end if;

  return query
  select a.id, a.code, a.name, a.type, a.parent_id, a.is_active, a.created_at, a.updated_at
  from public.finance_accounts a
  where a.org_id = v_org
    and (p_type is null or a.type = p_type)
    and (not p_active_only or a.is_active)
  order by a.code asc;
end;
$$;

revoke execute on function public.finance_account_list(text, boolean) from public;
grant  execute on function public.finance_account_list(text, boolean) to authenticated;

-- ── 7. finance_account_upsert ───────────────────────────────────────────────
create or replace function public.finance_account_upsert(
  p_id        uuid,
  p_code      text,
  p_name      text,
  p_type      text,
  p_parent_id uuid default null,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid := public.finance_resolve_org_id();
  v_id    uuid;
begin
  perform admin_assert_role(v_actor, array['super_admin','moderator']);
  if p_type not in ('income','expense','asset','liability','equity') then
    raise exception 'invalid_type' using errcode = '22023';
  end if;
  if p_code is null or btrim(p_code) = '' or p_name is null or btrim(p_name) = '' then
    raise exception 'missing_required_fields' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.finance_accounts (org_id, code, name, type, parent_id, is_active)
    values (v_org, btrim(p_code), btrim(p_name), p_type, p_parent_id, coalesce(p_is_active, true))
    returning id into v_id;
  else
    update public.finance_accounts
       set code = btrim(p_code), name = btrim(p_name), type = p_type,
           parent_id = p_parent_id, is_active = coalesce(p_is_active, true),
           updated_at = now()
     where id = p_id and org_id = v_org
    returning id into v_id;
    if v_id is null then
      raise exception 'account_not_found' using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.finance_account_upsert(uuid, text, text, text, uuid, boolean) from public;
grant  execute on function public.finance_account_upsert(uuid, text, text, text, uuid, boolean) to authenticated;

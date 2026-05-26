# Admin Portal — A0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the foundation that all other Admin Portal sub-projects (A1–A4) depend on: an extensible RBAC data model with DB-enforced invariants, the `(admin)` Expo Router group with a permission-gated layout, and stub screens for every future admin function so the nav structure is complete from day one.

**Architecture:**
- A new `admin_role_grants` table holds (user, role, granted_by, granted_at, revoked_at) tuples. The role column is a freeform text validated by a CHECK constraint that lists every role we plan for now and in PRD V2 (super_admin, moderator, support, plus the wider org/operator hierarchy as a forward-compat shelf) — so future roles do NOT need a migration.
- `has_admin_role(uid, role)` and `admin_assert_role(uid, roles[])` SQL functions provide the canonical RBAC predicates. The existing `is_admin(uid)` function continues to mean "super_admin" (A1 will widen specific RPCs via `admin_assert_role`).
- A sync trigger keeps `users.is_super_admin` consistent with `admin_role_grants` so the 10 existing call sites keep working without a churn migration.
- The single-super-admin invariant becomes a partial unique index in the DB, closing **TD-95**.
- Mobile gets a new `(admin)` route group with a responsive layout (sidebar on web ≥ md, top scroll-bar on mobile), an `AdminGate` HOC, and `useAdminRoles()` hook. The dashboard is a real screen; every other admin route (reports, tasks, admins, users, posts, audit) ships as a "coming in A1/A2/A3/A4" stub so the nav structure is locked in.

**Tech Stack:** PostgreSQL 15 (Supabase) · TypeScript · Vitest · React Native + Expo Router (typed routes) · TanStack Query · Zustand (`useAuthStore`) · Hebrew RTL forced.

**SSOT mapping:** FR-ADMIN-010, FR-ADMIN-011, plus closure of TD-95 and a new `D-40` decision. The five sub-projects (A0..A4) are added to BACKLOG.md as part of this PR.

**Out of scope (deferred to A1–A4):**
- Reports inbox / case detail (A1).
- Grant/revoke role RPCs and Admins management UI (A2).
- Internal Tasks tracker (A3).
- User/post search and audit viewer (A4).
- Per-role permission widening of existing admin RPCs (`admin_remove_post`, `admin_ban_user`, …). A0 keeps them gated on `is_admin()` = super_admin only; A1 introduces per-RPC `admin_assert_role(uid, ARRAY[...])`.
- Feature flag (`ADMIN_PORTAL_REPORTS`). A0 has no user-visible behavior for non-admins — the Settings row is hidden unless `useAdminRoles().length > 0`. A1 introduces the flag because it deprecates the chat-flow.

---

## File structure

### Database migrations (under `supabase/migrations/`)

| File | Responsibility |
|---|---|
| `0112_admin_role_grants_table.sql` | Create `admin_role_grants` table, indexes (incl. partial unique closing TD-95), RLS policies. |
| `0113_admin_role_functions.sql` | `has_admin_role(uid, role)` and `admin_assert_role(uid, roles[])`. |
| `0114_admin_role_grants_backfill.sql` | Backfill existing `is_super_admin=true` users into `admin_role_grants`. Add a sync trigger keeping `users.is_super_admin` consistent. |
| `0115_get_my_admin_roles_rpc.sql` | `get_my_admin_roles()` — returns the active roles of `auth.uid()`. |

If any of `0112..0115` is already taken at execution time (concurrent agent), shift the entire block forward by N and update the file names in this plan and the commit messages.

### Domain (under `app/packages/domain/src/admin/`)

| File | Responsibility |
|---|---|
| `index.ts` | Re-export everything below. |
| `AdminRole.ts` | `AdminRole` union type + `KNOWN_ADMIN_ROLES` constant + `parseAdminRole` helper. |
| `AdminPermission.ts` | `AdminPermission` enum + `PERMISSION_MATRIX` mapping each permission → roles allowed. Single source of truth for both client gate and (eventually) server RPCs. |
| `__tests__/AdminRole.test.ts` | Unit tests for `parseAdminRole`. |
| `__tests__/AdminPermission.test.ts` | Matrix invariants (every permission lists at least one role; super_admin has every permission). |

### Application (under `app/packages/application/src/admin/`)

| File | Responsibility |
|---|---|
| `IAdminRoleRepository.ts` | Port: `getMyRoles(): Promise<readonly AdminRole[]>`. |
| `GetMyAdminRolesUseCase.ts` | Use case: thin wrapper around the port. |
| `__tests__/GetMyAdminRolesUseCase.test.ts` | Use-case unit test against a mock port. |

The port file lives under `admin/`, not under `ports/`, because the existing `moderation/` slice does likewise and we should be consistent.

### Infrastructure (under `app/packages/infrastructure-supabase/src/admin/`)

| File | Responsibility |
|---|---|
| `SupabaseAdminRoleRepository.ts` | Implements `IAdminRoleRepository` against the `get_my_admin_roles` RPC. |
| `__tests__/SupabaseAdminRoleRepository.integration.test.ts` | Integration test: seeds a moderator grant, calls the RPC, asserts result; covers the DB layer end-to-end (see Task 5). |

### Mobile (under `app/apps/mobile/`)

| File | Responsibility |
|---|---|
| `src/i18n/locales/he/modules/admin.ts` | All admin-portal Hebrew strings. |
| `src/hooks/useAdminRoles.ts` | TanStack Query hook returning `readonly AdminRole[]` for the current session. |
| `src/components/admin/AdminGate.tsx` | Gate component: if no roles, redirect to `/(tabs)`; else render children. |
| `src/components/admin/ComingSoon.tsx` | Stub screen used by every not-yet-implemented admin route. Shows the sub-project label (A1..A4) and a one-line description. |
| `src/components/admin/AdminNav.tsx` | The responsive nav rendered by the layout: sidebar on web, top scroll-bar on mobile. |
| `app/(admin)/_layout.tsx` | Expo Router layout. Wraps Stack in `AdminGate` + `AdminNav`. |
| `app/(admin)/index.tsx` | Real dashboard. Shows role badges + KPI placeholders. |
| `app/(admin)/reports/index.tsx` | Stub via `ComingSoon` (A1). |
| `app/(admin)/tasks/index.tsx` | Stub via `ComingSoon` (A3). |
| `app/(admin)/admins/index.tsx` | Stub via `ComingSoon` (A2). |
| `app/(admin)/users/index.tsx` | Stub via `ComingSoon` (A4). |
| `app/(admin)/posts/index.tsx` | Stub via `ComingSoon` (A4). |
| `app/(admin)/audit/index.tsx` | Stub via `ComingSoon` (A4). |

### SSOT updates

| File | Change |
|---|---|
| `docs/SSOT/BACKLOG.md` | Add 5 rows: P3.A0 (🟡 → ✅ at PR merge), P3.A1, P3.A2, P3.A3, P3.A4 (⏳ Planned). |
| `docs/SSOT/spec/12_super_admin.md` | Header status ✅ → 🟡. Add FR-ADMIN-010 + FR-ADMIN-011 with full ACs. Note that FR-ADMIN-012..020 will be added in their respective sub-project PRs. |
| `docs/SSOT/TECH_DEBT.md` | Move TD-95 to Resolved with reference to this PR. |
| `docs/SSOT/DECISIONS.md` | Add `D-40`. |

### Branch & PR

- Branch: `feat/FR-ADMIN-010-a0-foundation`
- PR title: `feat(admin): A0 — RBAC foundation + portal scaffold`
- Base: `dev`

---

## Tasks

### Task 1: Migration `0112_admin_role_grants_table.sql`

**Files:**
- Create: `supabase/migrations/0112_admin_role_grants_table.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration: admin_role_grants — extensible RBAC for admin portal (A0).
-- Mapped to spec: docs/SSOT/spec/12_super_admin.md FR-ADMIN-010.
-- Closes TD-95: enforces single-active-super_admin invariant at the DB level.

create table public.admin_role_grants (
  grant_id    uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(user_id) on delete cascade,
  role        text not null
                check (role in (
                  -- Platform-level (in use as of A0):
                  'super_admin', 'moderator', 'support',
                  -- PRD V2 reserved (no rows yet; future migrations add UI/RPCs):
                  'operator', 'operators_manager',
                  'org_admin', 'org_manager', 'org_employee',
                  'volunteer_manager', 'org_volunteer'
                )),
  granted_by  uuid references public.users(user_id) on delete set null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  revoked_by  uuid references public.users(user_id) on delete set null
);

comment on table public.admin_role_grants is
  'RBAC for admin/operational roles. revoked_at IS NULL ⇔ active. Role enum is intentionally wide for PRD V2 forward-compat.';

create unique index admin_role_grants_active_user_role_uniq
  on public.admin_role_grants (user_id, role)
  where revoked_at is null;

-- TD-95: at most one active super_admin in the entire system.
create unique index admin_role_grants_single_super_admin_uniq
  on public.admin_role_grants (role)
  where role = 'super_admin' and revoked_at is null;

create index admin_role_grants_user_active_idx
  on public.admin_role_grants (user_id)
  where revoked_at is null;
create index admin_role_grants_role_active_idx
  on public.admin_role_grants (role)
  where revoked_at is null;

alter table public.admin_role_grants enable row level security;

create policy admin_role_grants_self_read
  on public.admin_role_grants for select
  using (user_id = auth.uid());

create policy admin_role_grants_super_admin_read_all
  on public.admin_role_grants for select
  using (public.is_admin(auth.uid()));

revoke insert, update, delete on public.admin_role_grants from anon, authenticated;
grant select on public.admin_role_grants to authenticated;
```

- [ ] **Step 2: Apply the migration locally and verify**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "\d+ public.admin_role_grants"
```
Expected: shows the four indexes and two RLS policies.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0112_admin_role_grants_table.sql
git commit -m "feat(admin): add admin_role_grants table with TD-95 invariant

Creates the RBAC store for the Admin Portal. Role CHECK list is wide
(includes PRD V2 future roles) so adding org/operator hierarchy later
does not need a schema migration.

The partial unique index on (role) WHERE role='super_admin' AND
revoked_at IS NULL closes TD-95.

Mapped to: FR-ADMIN-010 AC1, AC5."
```

---

### Task 2: Migration `0113_admin_role_functions.sql`

**Files:**
- Create: `supabase/migrations/0113_admin_role_functions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration: RBAC predicate functions for admin portal (A0).
-- Mapped to spec: FR-ADMIN-010 AC2.

create or replace function public.has_admin_role(uid uuid, role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when uid is null or role_name is null then false
    else exists (
      select 1
      from public.admin_role_grants
      where user_id = uid
        and role = role_name
        and revoked_at is null
    )
  end;
$$;

comment on function public.has_admin_role(uuid, text) is
  'Returns true iff the user holds an active grant for the given role.';

create or replace function public.admin_assert_role(uid uuid, allowed text[])
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_match boolean;
begin
  if uid is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if allowed is null or array_length(allowed, 1) is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.admin_role_grants
    where user_id = uid
      and role = any (allowed)
      and revoked_at is null
  ) into v_match;

  if not v_match then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;

comment on function public.admin_assert_role(uuid, text[]) is
  'Raises SQLSTATE 42501 unless the user holds an active grant for any of allowed roles.';

revoke execute on function public.has_admin_role(uuid, text) from public;
grant  execute on function public.has_admin_role(uuid, text) to anon, authenticated;

revoke execute on function public.admin_assert_role(uuid, text[]) from public;
grant  execute on function public.admin_assert_role(uuid, text[]) to authenticated;
```

- [ ] **Step 2: Apply and smoke-test in psql**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select public.has_admin_role(null, 'super_admin'), public.has_admin_role(gen_random_uuid(), 'super_admin');"
```
Expected: `f | f`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0113_admin_role_functions.sql
git commit -m "feat(admin): add has_admin_role and admin_assert_role predicates

A0 introduces them; A1+ refactors existing admin_* RPCs to use them.

Mapped to: FR-ADMIN-010 AC2."
```

---

### Task 3: Migration `0114_admin_role_grants_backfill.sql`

Backfill existing super admins and add a sync trigger so `users.is_super_admin` and `admin_role_grants(role='super_admin')` stay in lockstep. The ~10 existing `useIsSuperAdmin` and `is_admin()` call sites keep working unchanged.

**Files:**
- Create: `supabase/migrations/0114_admin_role_grants_backfill.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration: backfill admin_role_grants from users.is_super_admin and add
-- bidirectional sync trigger.
-- Mapped to spec: FR-ADMIN-010 AC3, AC4.

insert into public.admin_role_grants (user_id, role, granted_by, granted_at)
select u.user_id, 'super_admin', null, now()
from public.users u
where u.is_super_admin = true
on conflict do nothing;

create or replace function public._sync_users_is_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_active  boolean;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  if v_user_id is null then
    return null;
  end if;

  if (tg_op = 'INSERT'  and new.role <> 'super_admin')
  or (tg_op = 'DELETE'  and old.role <> 'super_admin')
  or (tg_op = 'UPDATE'  and old.role <> 'super_admin' and new.role <> 'super_admin') then
    return null;
  end if;

  select exists (
    select 1
    from public.admin_role_grants
    where user_id = v_user_id
      and role = 'super_admin'
      and revoked_at is null
  ) into v_active;

  update public.users
     set is_super_admin = v_active
   where user_id = v_user_id
     and is_super_admin is distinct from v_active;

  return null;
end;
$$;

drop trigger if exists admin_role_grants_sync_users on public.admin_role_grants;
create trigger admin_role_grants_sync_users
  after insert or update or delete on public.admin_role_grants
  for each row execute function public._sync_users_is_super_admin();

create or replace function public._sync_admin_role_grants_from_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_super_admin = true and (old.is_super_admin is distinct from true) then
    insert into public.admin_role_grants (user_id, role, granted_by, granted_at)
    values (new.user_id, 'super_admin', null, now())
    on conflict do nothing;
  elsif new.is_super_admin = false and old.is_super_admin = true then
    update public.admin_role_grants
       set revoked_at = now(), revoked_by = null
     where user_id = new.user_id
       and role = 'super_admin'
       and revoked_at is null;
  end if;
  return null;
end;
$$;

drop trigger if exists users_sync_admin_role_grants on public.users;
create trigger users_sync_admin_role_grants
  after update of is_super_admin on public.users
  for each row execute function public._sync_admin_role_grants_from_users();
```

- [ ] **Step 2: Apply and verify backfill**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" <<'SQL'
select count(*) as super_admins_in_users from public.users where is_super_admin = true;
select count(*) as super_admins_in_grants from public.admin_role_grants where role='super_admin' and revoked_at is null;
SQL
```
Expected: both counts equal.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0114_admin_role_grants_backfill.sql
git commit -m "feat(admin): backfill admin_role_grants and add sync triggers

Triggers keep users.is_super_admin and admin_role_grants(role='super_admin')
coherent so the ~10 existing useIsSuperAdmin / is_admin() call sites keep
working untouched during A0.

Mapped to: FR-ADMIN-010 AC3, AC4."
```

---

### Task 4: Migration `0115_get_my_admin_roles_rpc.sql`

**Files:**
- Create: `supabase/migrations/0115_get_my_admin_roles_rpc.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration: get_my_admin_roles() — returns active roles of auth.uid().
-- Mapped to spec: FR-ADMIN-011 AC2.

create or replace function public.get_my_admin_roles()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(role order by role) filter (where role is not null),
    array[]::text[]
  )
  from public.admin_role_grants
  where user_id = auth.uid()
    and revoked_at is null;
$$;

comment on function public.get_my_admin_roles() is
  'Returns active admin roles for the current session, or empty array.';

revoke execute on function public.get_my_admin_roles() from public;
grant  execute on function public.get_my_admin_roles() to authenticated;
```

- [ ] **Step 2: Apply and smoke-test**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select public.get_my_admin_roles();"
```
Expected: `{}`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0115_get_my_admin_roles_rpc.sql
git commit -m "feat(admin): add get_my_admin_roles RPC

Used by the mobile useAdminRoles() hook.

Mapped to: FR-ADMIN-011 AC2."
```

---

### Task 5: Integration test for the full DB layer

**Files:**
- Create: `app/packages/infrastructure-supabase/src/admin/__tests__/adminRoleRpc.integration.test.ts`

- [ ] **Step 1: Write the test (TDD — it must fail if any migration is missing)**

```typescript
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env['SUPABASE_URL'];
const SERVICE = process.env['SUPABASE_SERVICE_ROLE_KEY'];
const ANON = process.env['SUPABASE_ANON_KEY'];

const skip = !URL || !SERVICE || !ANON;
const d = skip ? describe.skip : describe;

d('admin RBAC primitives (A0)', () => {
  let admin: SupabaseClient;
  const cleanup: Array<() => Promise<void>> = [];

  beforeAll(() => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });
  });

  afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn();
  });

  async function seedUser(): Promise<string> {
    const email = `a0-rbac-${Date.now()}-${Math.random().toString(36).slice(2)}@kc.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email, password: 'p4ssword!!', email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error('no user');
    const uid = data.user.id;
    await admin.from('users').insert({ user_id: uid, display_name: 'rbac test' });
    cleanup.push(async () => { await admin.auth.admin.deleteUser(uid); });
    return uid;
  }

  it('has_admin_role returns false for users without grants', async () => {
    const uid = await seedUser();
    const { data, error } = await admin.rpc('has_admin_role', { uid, role_name: 'support' });
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it('inserting a moderator grant flips has_admin_role to true', async () => {
    const uid = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: uid, role: 'moderator' });
    const { data } = await admin.rpc('has_admin_role', { uid, role_name: 'moderator' });
    expect(data).toBe(true);
  });

  it('admin_assert_role raises 42501 when the user has no matching role', async () => {
    const uid = await seedUser();
    const { error } = await admin.rpc('admin_assert_role', {
      uid, allowed: ['super_admin'],
    });
    expect(error).not.toBeNull();
    expect(error!.code).toBe('42501');
  });

  it('single-super_admin invariant rejects a second active row', async () => {
    const uid1 = await seedUser();
    const uid2 = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: uid1, role: 'super_admin' });
    const { error } = await admin
      .from('admin_role_grants')
      .insert({ user_id: uid2, role: 'super_admin' });
    expect(error).not.toBeNull();
    expect(error!.code).toBe('23505');
    await admin.from('admin_role_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', uid1).eq('role', 'super_admin');
  });

  it('granting super_admin syncs users.is_super_admin to true', async () => {
    const uid = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: uid, role: 'super_admin' });
    const { data } = await admin.from('users')
      .select('is_super_admin').eq('user_id', uid).single();
    expect(data?.is_super_admin).toBe(true);
    await admin.from('admin_role_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', uid).eq('role', 'super_admin');
  });

  it('revoking super_admin syncs users.is_super_admin back to false', async () => {
    const uid = await seedUser();
    await admin.from('admin_role_grants').insert({ user_id: uid, role: 'super_admin' });
    await admin.from('admin_role_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', uid).eq('role', 'super_admin');
    const { data } = await admin.from('users')
      .select('is_super_admin').eq('user_id', uid).single();
    expect(data?.is_super_admin).toBe(false);
  });
});
```

- [ ] **Step 2: Run and verify all pass (env vars must be sourced)**

```bash
source ~/.kc-dev-secrets.env 2>/dev/null || true
cd app && pnpm --filter @kc/infrastructure-supabase test -- adminRoleRpc
```
Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/packages/infrastructure-supabase/src/admin/__tests__/adminRoleRpc.integration.test.ts
git commit -m "test(admin): integration tests for RBAC primitives

Mapped to: FR-ADMIN-010."
```

---

### Task 6: Domain — `AdminRole` type and parser

**Files:**
- Create: `app/packages/domain/src/admin/index.ts`
- Create: `app/packages/domain/src/admin/AdminRole.ts`
- Create: `app/packages/domain/src/admin/__tests__/AdminRole.test.ts`
- Modify: `app/packages/domain/src/index.ts` (re-export)

- [ ] **Step 1: Write the failing test**

```typescript
// app/packages/domain/src/admin/__tests__/AdminRole.test.ts
import { describe, expect, it } from 'vitest';
import { KNOWN_ADMIN_ROLES, parseAdminRole, type AdminRole } from '../AdminRole';

describe('AdminRole', () => {
  it('KNOWN_ADMIN_ROLES exposes the three A0 platform roles', () => {
    for (const r of ['super_admin', 'moderator', 'support'] as const) {
      expect(KNOWN_ADMIN_ROLES).toContain(r);
    }
  });

  it('parseAdminRole returns the role for a known string', () => {
    expect(parseAdminRole('moderator')).toBe<AdminRole>('moderator');
  });

  it('parseAdminRole returns null for an unknown string', () => {
    expect(parseAdminRole('emperor')).toBeNull();
    expect(parseAdminRole(null)).toBeNull();
    expect(parseAdminRole(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && pnpm --filter @kc/domain test -- AdminRole
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/packages/domain/src/admin/AdminRole.ts
export const KNOWN_ADMIN_ROLES = [
  'super_admin', 'moderator', 'support',
  'operator', 'operators_manager',
  'org_admin', 'org_manager', 'org_employee',
  'volunteer_manager', 'org_volunteer',
] as const;

export type AdminRole = (typeof KNOWN_ADMIN_ROLES)[number];

export function parseAdminRole(value: string | null | undefined): AdminRole | null {
  if (value == null) return null;
  return (KNOWN_ADMIN_ROLES as readonly string[]).includes(value)
    ? (value as AdminRole)
    : null;
}
```

```typescript
// app/packages/domain/src/admin/index.ts
export * from './AdminRole';
export * from './AdminPermission';
```

Append to `app/packages/domain/src/index.ts`:
```typescript
export * from './admin';
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && pnpm --filter @kc/domain test -- AdminRole
```
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add app/packages/domain/src/admin/ app/packages/domain/src/index.ts
git commit -m "feat(domain): add AdminRole type and parser

Wide enum reserves the PRD V2 role hierarchy.

Mapped to: FR-ADMIN-010, FR-ADMIN-011."
```

---

### Task 7: Domain — `AdminPermission` matrix

**Files:**
- Create: `app/packages/domain/src/admin/AdminPermission.ts`
- Create: `app/packages/domain/src/admin/__tests__/AdminPermission.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import {
  PERMISSION_MATRIX, ADMIN_PERMISSIONS, hasPermission,
  type AdminPermission,
} from '../AdminPermission';
import { KNOWN_ADMIN_ROLES } from '../AdminRole';

describe('AdminPermission matrix', () => {
  it('every permission lists at least one role', () => {
    for (const perm of ADMIN_PERMISSIONS) {
      expect(PERMISSION_MATRIX[perm].length).toBeGreaterThan(0);
    }
  });

  it('super_admin appears in every permission', () => {
    for (const perm of ADMIN_PERMISSIONS) {
      expect(PERMISSION_MATRIX[perm]).toContain('super_admin');
    }
  });

  it('every role in the matrix is a KNOWN_ADMIN_ROLE', () => {
    for (const perm of ADMIN_PERMISSIONS) {
      for (const role of PERMISSION_MATRIX[perm]) {
        expect(KNOWN_ADMIN_ROLES).toContain(role);
      }
    }
  });

  it('hasPermission returns true when any of the user roles is allowed', () => {
    const perm: AdminPermission = 'reports.view';
    expect(hasPermission(['support'], perm)).toBe(true);
    expect(hasPermission(['moderator'], perm)).toBe(true);
    expect(hasPermission([], perm)).toBe(false);
  });

  it('moderator cannot grant_role; super_admin can', () => {
    expect(hasPermission(['moderator'], 'admins.grant_role')).toBe(false);
    expect(hasPermission(['super_admin'], 'admins.grant_role')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && pnpm --filter @kc/domain test -- AdminPermission
```
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```typescript
// app/packages/domain/src/admin/AdminPermission.ts
import type { AdminRole } from './AdminRole';

export const ADMIN_PERMISSIONS = [
  'portal.access',
  'reports.view',
  'reports.confirm_or_dismiss',
  'reports.restore_target',
  'reports.permanent_ban',
  'reports.manual_remove_post',
  'reports.admin_edit_post',
  'tasks.view',
  'tasks.create',
  'tasks.delete_any',
  'admins.view',
  'admins.grant_role',
  'admins.revoke_role',
  'users.search',
  'users.privacy_override',
  'posts.search',
  'audit.view_own',
  'audit.view_any',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const PERMISSION_MATRIX: Readonly<Record<AdminPermission, readonly AdminRole[]>> = {
  'portal.access':              ['super_admin', 'moderator', 'support'],
  'reports.view':               ['super_admin', 'moderator', 'support'],
  'reports.confirm_or_dismiss': ['super_admin', 'moderator'],
  'reports.restore_target':     ['super_admin', 'moderator'],
  'reports.permanent_ban':      ['super_admin'],
  'reports.manual_remove_post': ['super_admin', 'moderator'],
  'reports.admin_edit_post':    ['super_admin', 'moderator'],
  'tasks.view':                 ['super_admin', 'moderator', 'support'],
  'tasks.create':               ['super_admin', 'moderator', 'support'],
  'tasks.delete_any':           ['super_admin'],
  'admins.view':                ['super_admin', 'moderator'],
  'admins.grant_role':          ['super_admin'],
  'admins.revoke_role':         ['super_admin'],
  'users.search':               ['super_admin', 'moderator', 'support'],
  'users.privacy_override':     ['super_admin', 'moderator', 'support'],
  'posts.search':               ['super_admin', 'moderator', 'support'],
  'audit.view_own':             ['super_admin', 'moderator', 'support'],
  'audit.view_any':             ['super_admin'],
};

export function hasPermission(
  roles: readonly AdminRole[],
  permission: AdminPermission,
): boolean {
  const allowed = PERMISSION_MATRIX[permission];
  for (const r of roles) {
    if (allowed.includes(r)) return true;
  }
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && pnpm --filter @kc/domain test -- AdminPermission
```
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add app/packages/domain/src/admin/AdminPermission.ts \
        app/packages/domain/src/admin/__tests__/AdminPermission.test.ts
git commit -m "feat(domain): add AdminPermission matrix as RBAC SSOT

Mapped to: FR-ADMIN-010."
```

---

### Task 8: Application — `IAdminRoleRepository` port

**Files:**
- Create: `app/packages/application/src/admin/IAdminRoleRepository.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write the port**

```typescript
// app/packages/application/src/admin/IAdminRoleRepository.ts
import type { AdminRole } from '@kc/domain';

export interface IAdminRoleRepository {
  getMyRoles(): Promise<readonly AdminRole[]>;
}
```

- [ ] **Step 2: Re-export**

Append to `app/packages/application/src/index.ts`:
```typescript
export * from './admin/IAdminRoleRepository';
export * from './admin/GetMyAdminRolesUseCase';
```

- [ ] **Step 3: Verify typecheck**

```bash
cd app && pnpm --filter @kc/application typecheck
```
Expected: PASS (the use-case import will fail; defer that to Task 9 and only export the port in this commit).

If the use-case re-export breaks the build, temporarily comment that line and add it back in Task 9.

- [ ] **Step 4: Commit**

```bash
git add app/packages/application/src/admin/IAdminRoleRepository.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): add IAdminRoleRepository port

Mapped to: FR-ADMIN-011 AC2."
```

---

### Task 9: Application — `GetMyAdminRolesUseCase`

**Files:**
- Create: `app/packages/application/src/admin/GetMyAdminRolesUseCase.ts`
- Create: `app/packages/application/src/admin/__tests__/GetMyAdminRolesUseCase.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it, vi } from 'vitest';
import type { AdminRole } from '@kc/domain';
import { GetMyAdminRolesUseCase } from '../GetMyAdminRolesUseCase';
import type { IAdminRoleRepository } from '../IAdminRoleRepository';

function fakeRepo(roles: readonly AdminRole[]): IAdminRoleRepository {
  return { getMyRoles: vi.fn().mockResolvedValue(roles) };
}

describe('GetMyAdminRolesUseCase', () => {
  it('returns the repo result', async () => {
    const uc = new GetMyAdminRolesUseCase(fakeRepo(['moderator']));
    expect(await uc.execute()).toEqual(['moderator']);
  });

  it('returns an empty array when the user has no grants', async () => {
    const uc = new GetMyAdminRolesUseCase(fakeRepo([]));
    expect(await uc.execute()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && pnpm --filter @kc/application test -- GetMyAdminRoles
```
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```typescript
// app/packages/application/src/admin/GetMyAdminRolesUseCase.ts
import type { AdminRole } from '@kc/domain';
import type { IAdminRoleRepository } from './IAdminRoleRepository';

export class GetMyAdminRolesUseCase {
  constructor(private readonly repo: IAdminRoleRepository) {}

  async execute(): Promise<readonly AdminRole[]> {
    return this.repo.getMyRoles();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && pnpm --filter @kc/application test -- GetMyAdminRoles
```
Expected: PASS — 2 tests.

If Task 8 commented out the use-case re-export, re-enable it now.

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/admin/GetMyAdminRolesUseCase.ts \
        app/packages/application/src/admin/__tests__/GetMyAdminRolesUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): add GetMyAdminRolesUseCase

Mapped to: FR-ADMIN-011 AC2."
```

---

### Task 10: Infrastructure — `SupabaseAdminRoleRepository`

**Files:**
- Create: `app/packages/infrastructure-supabase/src/admin/SupabaseAdminRoleRepository.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts`

- [ ] **Step 1: Write the adapter**

```typescript
// app/packages/infrastructure-supabase/src/admin/SupabaseAdminRoleRepository.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAdminRoleRepository } from '@kc/application';
import { type AdminRole, parseAdminRole } from '@kc/domain';

export class SupabaseAdminRoleRepository implements IAdminRoleRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getMyRoles(): Promise<readonly AdminRole[]> {
    const { data, error } = await this.client.rpc('get_my_admin_roles');
    if (error) return [];
    if (!Array.isArray(data)) return [];
    const out: AdminRole[] = [];
    for (const raw of data) {
      const parsed = parseAdminRole(typeof raw === 'string' ? raw : null);
      if (parsed !== null) out.push(parsed);
    }
    return out;
  }
}
```

- [ ] **Step 2: Re-export**

Append to `app/packages/infrastructure-supabase/src/index.ts`:
```typescript
export * from './admin/SupabaseAdminRoleRepository';
```

- [ ] **Step 3: Verify typecheck and lint**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase typecheck && pnpm --filter @kc/infrastructure-supabase lint
```
Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/admin/ \
        app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): add SupabaseAdminRoleRepository

Fails closed: any error returns an empty role array.

Mapped to: FR-ADMIN-011 AC2."
```

---

### Task 11: Mobile — i18n admin module

**Files:**
- Create: `app/apps/mobile/src/i18n/locales/he/modules/admin.ts`
- Modify: `app/apps/mobile/src/i18n/locales/he/index.ts`

- [ ] **Step 1: Write the module**

```typescript
// app/apps/mobile/src/i18n/locales/he/modules/admin.ts
export const adminHe = {
  portalTitle: 'פורטל ניהול',
  settingsRow: 'פורטל ניהול',
  nav: {
    dashboard: 'לוח בקרה',
    reports: 'דיווחים',
    tasks: 'משימות צוות',
    admins: 'צוות ניהול',
    users: 'משתמשים',
    posts: 'פוסטים',
    audit: 'יומן פעולות',
  },
  roles: {
    super_admin: 'מנהל-על',
    moderator: 'מנחה',
    support: 'תמיכה',
    operator: 'מוקדן',
    operators_manager: 'מנהל מוקדנים',
    org_admin: 'מנהל ארגון',
    org_manager: 'מנהל בארגון',
    org_employee: 'עובד עמותה',
    volunteer_manager: 'מנהל מתנדבים',
    org_volunteer: 'מתנדב בארגון',
  },
  dashboard: {
    welcome: 'ברוך הבא לפורטל הניהול',
    rolesLabel: 'התפקידים שלך',
    quickLinksTitle: 'קיצורי דרך',
    openReportsKpi: 'דיווחים פתוחים',
    openTasksKpi: 'משימות פתוחות',
    comingSoonKpi: 'יזמין בקרוב',
  },
  comingSoon: {
    title: 'מסך זה יזמין בקרוב',
    a1: 'דיווחים — תת־פרויקט A1',
    a2: 'ניהול צוות — תת־פרויקט A2',
    a3: 'משימות — תת־פרויקט A3',
    a4: 'משתמשים, פוסטים ויומן — תת־פרויקט A4',
    back: 'חזרה ללוח בקרה',
  },
  gate: { denied: 'אין לך הרשאת גישה לפורטל הניהול.' },
} as const;
```

- [ ] **Step 2: Merge into locale root**

Open `app/apps/mobile/src/i18n/locales/he/index.ts`. Add the import and merge per the file's existing pattern. If unsure of the exact merge convention, stop and read the file end-to-end before editing.

- [ ] **Step 3: Verify typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/i18n/locales/he/modules/admin.ts \
        app/apps/mobile/src/i18n/locales/he/index.ts
git commit -m "feat(mobile): add admin i18n module

Mapped to: FR-ADMIN-011 AC5."
```

---

### Task 12: Mobile — wire repo + use case into DI container

**Files:**
- Modify: `app/apps/mobile/src/lib/container.ts`

- [ ] **Step 1: Add the wiring**

1. Add to the `@kc/infrastructure-supabase` import block: `SupabaseAdminRoleRepository`.
2. Add to the `@kc/application` import block: `GetMyAdminRolesUseCase`.
3. After the existing repo instantiations, add:
```typescript
const adminRoleRepo = new SupabaseAdminRoleRepository(supabase);
```
4. Add a use case instance near the other use cases:
```typescript
const getMyAdminRoles = new GetMyAdminRolesUseCase(adminRoleRepo);
```
5. Expose both in the `container` export object.

- [ ] **Step 2: Verify typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/lib/container.ts
git commit -m "feat(mobile): wire admin role repo + use case in DI container

Mapped to: FR-ADMIN-011 AC2."
```

---

### Task 13: Mobile — `useAdminRoles()` hook

**Files:**
- Create: `app/apps/mobile/src/hooks/useAdminRoles.ts`

- [ ] **Step 1: Write the hook**

```typescript
// app/apps/mobile/src/hooks/useAdminRoles.ts
import { useQuery } from '@tanstack/react-query';
import type { AdminRole } from '@kc/domain';
import { container } from '../lib/container';
import { useAuthStore } from '../store/authStore';

const EMPTY: readonly AdminRole[] = [];

export function useAdminRoles(): readonly AdminRole[] {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const { data } = useQuery({
    queryKey: ['admin.roles', userId],
    queryFn: () => container.getMyAdminRoles.execute(),
    enabled: userId !== null,
    staleTime: Infinity,
  });
  return data ?? EMPTY;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/hooks/useAdminRoles.ts
git commit -m "feat(mobile): add useAdminRoles hook

Mapped to: FR-ADMIN-011 AC2."
```

---

### Task 14: Mobile — `AdminGate` component

**Files:**
- Create: `app/apps/mobile/src/components/admin/AdminGate.tsx`
- Create: `app/apps/mobile/src/components/admin/__tests__/AdminGate.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { AdminGate } from '../AdminGate';

vi.mock('../../../hooks/useAdminRoles', () => ({ useAdminRoles: vi.fn() }));
vi.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => <Text>REDIRECT:{href}</Text>,
}));

import { useAdminRoles } from '../../../hooks/useAdminRoles';

describe('AdminGate', () => {
  it('renders children when the user has any admin role', () => {
    (useAdminRoles as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['support']);
    render(<AdminGate><Text>inside</Text></AdminGate>);
    expect(screen.queryByText('inside')).toBeTruthy();
  });

  it('redirects when the user has no admin role', () => {
    (useAdminRoles as unknown as ReturnType<typeof vi.fn>).mockReturnValue([]);
    render(<AdminGate><Text>inside</Text></AdminGate>);
    expect(screen.queryByText('inside')).toBeNull();
    expect(screen.queryByText(/REDIRECT:/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && pnpm --filter @kc/mobile test -- AdminGate
```
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```typescript
// app/apps/mobile/src/components/admin/AdminGate.tsx
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { useAdminRoles } from '../../hooks/useAdminRoles';

export interface AdminGateProps {
  children: ReactNode;
  anyOf?: readonly string[];
}

export function AdminGate({ children, anyOf }: AdminGateProps): JSX.Element {
  const roles = useAdminRoles();
  if (roles.length === 0) {
    return <Redirect href="/(tabs)" />;
  }
  if (anyOf && !roles.some((r) => anyOf.includes(r))) {
    return <Redirect href="/(admin)" />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && pnpm --filter @kc/mobile test -- AdminGate
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/src/components/admin/AdminGate.tsx \
        app/apps/mobile/src/components/admin/__tests__/AdminGate.test.tsx
git commit -m "feat(mobile): add AdminGate component

Mapped to: FR-ADMIN-011 AC2."
```

---

### Task 15: Mobile — `ComingSoon` and `AdminNav` components

**Files:**
- Create: `app/apps/mobile/src/components/admin/ComingSoon.tsx`
- Create: `app/apps/mobile/src/components/admin/AdminNav.tsx`

- [ ] **Step 1: Write `ComingSoon`**

```typescript
// app/apps/mobile/src/components/admin/ComingSoon.tsx
import { router } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import he from '../../i18n/locales/he';

export interface ComingSoonProps {
  subProject: 'A1' | 'A2' | 'A3' | 'A4';
  description?: string;
}

export function ComingSoon({ subProject, description }: ComingSoonProps): JSX.Element {
  const t = he.admin.comingSoon;
  const key = subProject.toLowerCase() as 'a1' | 'a2' | 'a3' | 'a4';
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.subtitle}>{description ?? t[key]}</Text>
      <Pressable
        style={styles.back}
        onPress={() => router.replace('/(admin)')}
        accessibilityRole="button"
      >
        <Text style={styles.backText}>{t.back}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
  back: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eee' },
  backText: { fontSize: 14 },
});
```

- [ ] **Step 2: Write `AdminNav`**

```typescript
// app/apps/mobile/src/components/admin/AdminNav.tsx
import { Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import he from '../../i18n/locales/he';

type Item = { key: keyof typeof he.admin.nav; href: string };

const ITEMS: readonly Item[] = [
  { key: 'dashboard', href: '/(admin)' },
  { key: 'reports',   href: '/(admin)/reports' },
  { key: 'tasks',     href: '/(admin)/tasks' },
  { key: 'admins',    href: '/(admin)/admins' },
  { key: 'users',     href: '/(admin)/users' },
  { key: 'posts',     href: '/(admin)/posts' },
  { key: 'audit',     href: '/(admin)/audit' },
];

export function AdminNav(): JSX.Element {
  const pathname = usePathname();
  const labels = he.admin.nav;

  const content = (
    <>
      {ITEMS.map(({ key, href }) => {
        const active = pathname === href || (href === '/(admin)' && pathname.endsWith('/admin'));
        return (
          <Pressable
            key={key}
            onPress={() => router.push(href as never)}
            style={[styles.item, active && styles.itemActive]}
            accessibilityRole="link"
          >
            <Text style={[styles.label, active && styles.labelActive]}>{labels[key]}</Text>
          </Pressable>
        );
      })}
    </>
  );

  if (Platform.OS === 'web') {
    return <View style={styles.sidebar}>{content}</View>;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.topbar}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: 200, paddingVertical: 16, paddingHorizontal: 8, borderLeftWidth: 1, borderLeftColor: '#eee', gap: 4 },
  topbar:  { gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  item:    { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  itemActive: { backgroundColor: '#eef2ff' },
  label:   { fontSize: 14 },
  labelActive: { fontWeight: '600' },
});
```

- [ ] **Step 3: Verify typecheck and lint**

```bash
cd app && pnpm --filter @kc/mobile typecheck && pnpm --filter @kc/mobile lint
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/components/admin/ComingSoon.tsx \
        app/apps/mobile/src/components/admin/AdminNav.tsx
git commit -m "feat(mobile): add ComingSoon and responsive AdminNav

Mapped to: FR-ADMIN-011 AC1."
```

---

### Task 16: Mobile — `(admin)/_layout.tsx`

**Files:**
- Create: `app/apps/mobile/app/(admin)/_layout.tsx`

- [ ] **Step 1: Write the layout**

```typescript
// app/apps/mobile/app/(admin)/_layout.tsx
import { Stack } from 'expo-router';
import { Platform, SafeAreaView, View, StyleSheet } from 'react-native';
import { AdminGate } from '../../src/components/admin/AdminGate';
import { AdminNav } from '../../src/components/admin/AdminNav';

export default function AdminLayout(): JSX.Element {
  return (
    <AdminGate>
      <SafeAreaView style={styles.safe}>
        {Platform.OS === 'web' ? (
          <View style={styles.webRow}>
            <View style={styles.webMain}>
              <Stack screenOptions={{ headerShown: false }} />
            </View>
            <AdminNav />
          </View>
        ) : (
          <View style={styles.mobileCol}>
            <AdminNav />
            <View style={styles.mobileMain}>
              <Stack screenOptions={{ headerShown: false }} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </AdminGate>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  webRow:     { flex: 1, flexDirection: 'row' },
  webMain:    { flex: 1 },
  mobileCol:  { flex: 1, flexDirection: 'column' },
  mobileMain: { flex: 1 },
});
```

- [ ] **Step 2: Verify typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add 'app/apps/mobile/app/(admin)/_layout.tsx'
git commit -m "feat(mobile): add (admin) route group layout

Mapped to: FR-ADMIN-011 AC1."
```

---

### Task 17: Mobile — `(admin)/index.tsx` dashboard

**Files:**
- Create: `app/apps/mobile/app/(admin)/index.tsx`

- [ ] **Step 1: Write the dashboard**

```typescript
// app/apps/mobile/app/(admin)/index.tsx
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAdminRoles } from '../../src/hooks/useAdminRoles';
import he from '../../src/i18n/locales/he';

export default function AdminDashboard(): JSX.Element {
  const roles = useAdminRoles();
  const t = he.admin.dashboard;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>{t.welcome}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.rolesLabel}</Text>
        <View style={styles.badges}>
          {roles.map((role) => (
            <View key={role} style={styles.badge}>
              <Text style={styles.badgeText}>
                {(he.admin.roles as Record<string, string>)[role] ?? role}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.kpis}>
        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>{t.openReportsKpi}</Text>
          <Text style={styles.kpiValue}>{t.comingSoonKpi}</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>{t.openTasksKpi}</Text>
          <Text style={styles.kpiValue}>{t.comingSoonKpi}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { padding: 20, gap: 20 },
  title:        { fontSize: 20, fontWeight: '700' },
  section:      { gap: 8 },
  sectionTitle: { fontSize: 14, opacity: 0.7 },
  badges:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge:        { backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText:    { fontSize: 12, fontWeight: '600' },
  kpis:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpi:          { flexBasis: 160, padding: 16, backgroundColor: '#fafafa', borderRadius: 12, gap: 6 },
  kpiLabel:     { fontSize: 12, opacity: 0.7 },
  kpiValue:     { fontSize: 18, fontWeight: '600' },
});
```

- [ ] **Step 2: Verify typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add 'app/apps/mobile/app/(admin)/index.tsx'
git commit -m "feat(mobile): add (admin) dashboard screen

Mapped to: FR-ADMIN-011 AC4."
```

---

### Task 18: Mobile — six stub routes

**Files:** create all six listed below.

| File | `subProject` value |
|---|---|
| `app/apps/mobile/app/(admin)/reports/index.tsx` | `"A1"` |
| `app/apps/mobile/app/(admin)/tasks/index.tsx`   | `"A3"` |
| `app/apps/mobile/app/(admin)/admins/index.tsx`  | `"A2"` |
| `app/apps/mobile/app/(admin)/users/index.tsx`   | `"A4"` |
| `app/apps/mobile/app/(admin)/posts/index.tsx`   | `"A4"` |
| `app/apps/mobile/app/(admin)/audit/index.tsx`   | `"A4"` |

- [ ] **Step 1: Create all six stubs**

Each file is three lines. Apply the template to each file with the correct `subProject` from the table:
```typescript
import { ComingSoon } from '../../../src/components/admin/ComingSoon';
export default function Stub(): JSX.Element { return <ComingSoon subProject="<VALUE>" />; }
```

- [ ] **Step 2: Verify typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add 'app/apps/mobile/app/(admin)/reports/' \
        'app/apps/mobile/app/(admin)/tasks/' \
        'app/apps/mobile/app/(admin)/admins/' \
        'app/apps/mobile/app/(admin)/users/' \
        'app/apps/mobile/app/(admin)/posts/' \
        'app/apps/mobile/app/(admin)/audit/'
git commit -m "feat(mobile): add stub routes for A1..A4 admin sub-projects

Mapped to: FR-ADMIN-011 AC1."
```

---

### Task 19: Mobile — Settings entry

**Files:**
- Modify: `app/apps/mobile/app/settings.tsx`

- [ ] **Step 1: Add the row**

1. Add an import: `import { useAdminRoles } from '../src/hooks/useAdminRoles';`
2. In the component, after the existing `useIsSuperAdmin` call:
```typescript
const adminRoles = useAdminRoles();
```
3. In the Settings rows JSX, add a new row visible only when the user has any admin role. Place it adjacent to the existing audit row (around `settings.tsx:152`):
```tsx
{adminRoles.length > 0 ? (
  <SettingsScreenRow
    label={he.admin.settingsRow}
    icon="shield-checkmark-outline"
    onPress={() => router.push('/(admin)' as never)}
  />
) : null}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/app/settings.tsx
git commit -m "feat(mobile): add 'Admin Portal' row in Settings

Mapped to: FR-ADMIN-011 AC3."
```

---

### Task 20: Full verification — typecheck / test / lint, then manual smoke

- [ ] **Step 1: Run all three gates**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```
Expected: all PASS.

- [ ] **Step 2: Manual smoke — admin path**

```bash
cd app && pnpm --filter @kc/mobile web
```
Log in as the dev super admin (email in `~/.kc-dev-secrets.env`). Verify:
- Settings shows the "פורטל ניהול" row.
- Tapping it lands on `/(admin)` with the dashboard, super_admin badge, KPI placeholders.
- AdminNav shows 7 links. Each lands on the correct ComingSoon stub.
- Hebrew RTL: text right-aligned; sidebar on the right on web.

- [ ] **Step 3: Manual smoke — non-admin path**

Log out, register a fresh non-admin user. Verify:
- Settings does NOT show the admin row.
- Navigating to `/admin` (paste URL on web) redirects to `/(tabs)`.

---

### Task 21: SSOT updates

- [ ] **Step 1: Add A0..A4 rows to `docs/SSOT/BACKLOG.md`**

Append (preserving the file's existing row format and lane placement):
- `P3.A0 — Admin Portal A0 (Foundation: RBAC + scaffold). 🟡 In progress → ✅ at PR merge.`
- `P3.A1 — Admin Portal A1 (Reports Dashboard). ⏳ Planned, blocked by A0.`
- `P3.A2 — Admin Portal A2 (RBAC management). ⏳ Planned, blocked by A0.`
- `P3.A3 — Admin Portal A3 (Internal Tasks). ⏳ Planned, blocked by A0 + A2.`
- `P3.A4 — Admin Portal A4 (Content & Users management). ⏳ Planned, blocked by A0 + A2.`

- [ ] **Step 2: Update `docs/SSOT/spec/12_super_admin.md`**

1. Header status: change `✅` to `🟡`.
2. Add section "## §10 Admin Portal — Foundation (A0)".
3. Add **FR-ADMIN-010** AC1..AC5 verbatim from the design spec `docs/superpowers/specs/2026-05-25-admin-portal-design.md` §4 / A0.
4. Add **FR-ADMIN-011** AC1..AC5 likewise.
5. Add a note: "FR-ADMIN-012..020 will be added in their respective sub-project PRs."

- [ ] **Step 3: Update `docs/SSOT/TECH_DEBT.md`**

Move TD-95 from Active to Resolved with: "Closed by FR-ADMIN-010 — single-active-super_admin enforced at DB via partial unique index on `admin_role_grants`."

- [ ] **Step 4: Add D-40 to `docs/SSOT/DECISIONS.md`**

Append:
```markdown
### D-40 — Replace in-chat moderation with a dedicated Admin Portal + RBAC

**Date:** 2026-05-25
**Status:** Accepted

**Decision.** Build a dedicated `(admin)` route group with an extensible RBAC store (`admin_role_grants`) instead of continuing to scale the single-super-admin chat-flow. Roles are gated at the DB level via `admin_assert_role`; the client gate (`AdminGate` + permission matrix in `@kc/domain`) is UX only.

**Rationale.** The chat-flow is a single point of failure (one super-admin), discovery is poor (actions scattered), audit search is RLS-blocked (TD-93), restore cascades incorrectly (TD-94), and the single-admin invariant has no DB enforcement (TD-95). The portal addresses all four and unblocks the broader role hierarchy from PRD V2 (`02_Personas_Roles.md`: Operator, Org Admin, Volunteer Manager, …).

**Decomposition.** A0 (this PR) ships the foundation. A1..A4 follow as separate sub-projects per `docs/superpowers/specs/2026-05-25-admin-portal-design.md`.

**Alternatives considered.**
1. Extend the chat-flow with multi-admin support. Rejected — does not address discoverability, scattered actions, or the deeper TDs.
2. Use Supabase Studio as the only admin surface. Rejected — not accessible to non-engineers, no in-app context.
```

- [ ] **Step 5: Commit**

```bash
git add docs/SSOT/BACKLOG.md \
        docs/SSOT/spec/12_super_admin.md \
        docs/SSOT/TECH_DEBT.md \
        docs/SSOT/DECISIONS.md
git commit -m "docs(ssot): add Admin Portal A0..A4 backlog, FR-ADMIN-010/011, D-40"
```

---

### Task 22: Branch, push, PR, auto-merge

Branch creation belongs at the START of execution (before Task 1) — see "Pre-task setup" below.

- [ ] **Step 1: Push**

```bash
git push -u origin HEAD
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(admin): A0 — RBAC foundation + portal scaffold" \
  --body "$(cat <<'EOF'
## Summary
Ships the foundation that all other Admin Portal sub-projects (A1..A4) depend on:
extensible RBAC data model with DB-enforced invariants, the `(admin)` Expo
Router group with a permission-gated layout, and stub screens for every future
admin function so the nav structure is complete from day one.

## Mapped to spec
- FR-ADMIN-010 — RBAC primitives (`docs/SSOT/spec/12_super_admin.md`)
- FR-ADMIN-011 — Portal scaffold
- Design spec: `docs/superpowers/specs/2026-05-25-admin-portal-design.md`
- Decision: `D-40` in `docs/SSOT/DECISIONS.md`

## Changes
- 4 migrations: `admin_role_grants` + indexes + RLS; `has_admin_role` and `admin_assert_role`; backfill + sync triggers; `get_my_admin_roles` RPC.
- Domain: `AdminRole` + `KNOWN_ADMIN_ROLES`, `AdminPermission` + `PERMISSION_MATRIX`.
- Application: `IAdminRoleRepository` port + `GetMyAdminRolesUseCase`.
- Infrastructure: `SupabaseAdminRoleRepository`.
- Mobile: `useAdminRoles`, `AdminGate`, `AdminNav`, `ComingSoon`, `(admin)/_layout`, dashboard, 6 stubs, Settings entry, admin i18n module.

## Tests
- `pnpm typecheck` ✅
- `pnpm test` ✅ (incl. 6 new integration tests for RBAC primitives)
- `pnpm lint` ✅
- Manual: admin login → portal → all 7 nav links → role badges + ComingSoon stubs. Non-admin login → no Settings row, `/admin` redirects to `/(tabs)`.

## SSOT updated
- [x] `BACKLOG.md` — added P3.A0..A4 rows; A0 marked 🟡.
- [x] `spec/12_super_admin.md` — status 🟡; FR-ADMIN-010/011 added.
- [x] `TECH_DEBT.md` — TD-95 closed.
- [x] `DECISIONS.md` — `D-40` added.

## Risk / rollout notes
DB-level: 4 forward-only migrations. Backfill is idempotent. Sync trigger keeps `users.is_super_admin` coherent so the ~10 existing `useIsSuperAdmin` / `is_admin()` call sites keep working without change. No feature flag — A0 has no user-visible change for non-admins (Settings row is gated on `useAdminRoles().length > 0`).
EOF
)" \
  --label "FR-ADMIN" --assignee "@me"
```

- [ ] **Step 3: Auto-merge and watch CI**

```bash
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 4: Local cleanup**

```bash
git switch dev && git pull --ff-only origin dev
git branch -D feat/FR-ADMIN-010-a0-foundation
```

---

## Pre-task setup (do this BEFORE Task 1)

```bash
cd /Users/navesarussi/Desktop/MVP-2
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feat/FR-ADMIN-010-a0-foundation
```

If the working tree has unrelated uncommitted changes (e.g. auto-generated `expo/types/router.d.ts`), leave them in place — they belong to other concurrent work. Only stage explicit file paths in every commit; never use `git add .` or `git add -A`.

## Notes for whoever picks up A1..A4

- `@kc/domain/admin/AdminPermission.ts` is the SSOT — when A1 widens `admin_remove_post` to accept `moderator`, change the matrix and the RPC together; do not divergently update one side.
- `useIsSuperAdmin` and `is_admin()` are intentionally kept alive in A0. A1+ should migrate call sites to `useAdminRoles()` / `admin_assert_role` opportunistically; not blocking.
- The wide CHECK on `admin_role_grants.role` (PRD V2 roles like `operator`, `org_admin`) is intentional: those roles can be granted with no new migration.

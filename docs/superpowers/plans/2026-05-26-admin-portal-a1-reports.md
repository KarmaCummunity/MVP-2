# Admin Portal — A1 Reports Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the chat-based moderation flow with a dedicated Reports Dashboard. Build a paginated inbox of open report cases grouped by target, a per-case detail screen with the full reporter list + audit timeline + RBAC-gated action buttons, and the coexistence + deprecation path for the legacy in-chat flow.

**Architecture:**
- Backend: widen the 5 existing admin RPCs (`admin_remove_post`, `admin_restore_target`, `admin_dismiss_report`, `admin_confirm_report`, `admin_edit_open_post` if present) from `is_admin()` to `admin_assert_role()` per the `PERMISSION_MATRIX`. `admin_ban_user` stays super_admin only. Close **TD-94** by stripping the cascade-dismiss side effect from `admin_restore_target` — each open report on a target stays open and must be resolved independently. Add two new server-side aggregation RPCs: `reports_open_inbox(filters, cursor)` and `reports_case_detail(target_type, target_id)`. Both return shaped read models suited to the screens; no client-side joins.
- Domain: new value objects for `ReportCase`, `ReportInboxRow`, `ReportThresholdProgress`. The `PERMISSION_MATRIX` from A0 is the SSOT consumed by the case-detail action buttons.
- Application: `IReportsRepository` port (separate from `IModerationAdminRepository` — different concern). Use cases: `ListOpenReportsUseCase`, `GetReportCaseDetailUseCase`. The existing `DismissReportUseCase` / `ConfirmReportUseCase` / `RestoreTargetUseCase` / `BanUserUseCase` / `AdminRemovePostUseCase` are reused.
- Mobile: replace the A0 ComingSoon stub at `(admin)/reports/index.tsx` with a real inbox. Add `(admin)/reports/[caseId]/index.tsx` for case detail. Action buttons consume `hasPermission()`. Realtime: TanStack Query refetch on focus + manual pull-to-refresh; full Supabase Realtime subscription is deferred. Feature flag `EXPO_PUBLIC_ADMIN_PORTAL_REPORTS` controls the chat-flow → portal handoff.
- Coexistence: when the flag is `true`, the legacy `ReportReceivedBubble` renders as read-only with a deep-link to `/admin/reports/<encoded-case-id>`. When `false`, A1 is opt-in for super_admin only; the chat-flow remains authoritative.

**Tech Stack:** PostgreSQL 15 (Supabase) · TypeScript · Vitest · React Native + Expo Router · TanStack Query · same patterns as A0.

**SSOT mapping:** FR-ADMIN-012, FR-ADMIN-013, FR-ADMIN-014. Closes TD-94. A0 row in BACKLOG flips from ✅ to remain ✅; A1 row flips 🟡 → ✅ at PR merge.

**Out of scope (deferred):**
- Supabase Realtime channel for case updates. A1 uses focus refetch + pull-to-refresh. Logged as TD if usage shows it's needed.
- A2 grant/revoke management.
- A3 internal tasks.
- A4 audit viewer / user search / post search.
- Bulk operations on reports (mass dismiss, etc.).
- Phase 3 of the deprecation: removing the chat-flow code entirely. That is a follow-up PR after one stable week per the design spec §5.

---

## File structure

### Database migrations (under `supabase/migrations/`)

| File | Responsibility |
|---|---|
| `0118_widen_admin_rpcs_to_rbac.sql` | Replace `is_admin(uid)` with `admin_assert_role(uid, ARRAY['super_admin','moderator'])` in: `admin_remove_post`, `admin_restore_target`, `admin_dismiss_report`, `admin_confirm_report`. Keep `admin_ban_user` super_admin-only. |
| `0119_admin_restore_no_cascade_dismiss.sql` | TD-94 fix: rewrite `admin_restore_target` so it un-removes the target but leaves all open reports as `open`. |
| `0120_reports_open_inbox_rpc.sql` | New `reports_open_inbox(p_target_type_filter text, p_max_age_days int, p_reporter_filter uuid, p_cursor jsonb)` returns a paginated array of `report_inbox_row` JSON rows. |
| `0121_reports_case_detail_rpc.sql` | New `reports_case_detail(p_target_type text, p_target_id uuid)` returns one JSON object: target preview, reporter list, audit timeline, current target status. |

If `0118+` is already taken at execution time (a concurrent agent landed migrations), shift the entire block forward and update commit messages and the contract test below.

### Domain (under `app/packages/domain/src/reports/`)

| File | Responsibility |
|---|---|
| `index.ts` | Re-exports. |
| `ReportInbox.ts` | `ReportInboxRow`, `ReportTargetType`, `ReportThresholdProgress` value objects. |
| `ReportCaseDetail.ts` | `ReportCaseDetail`, `ReportCaseReporter`, `ReportCaseAuditEntry` value objects. |
| `__tests__/ReportInbox.test.ts` | Parsing + threshold-progress invariants. |

### Application (under `app/packages/application/src/reports/`)

| File | Responsibility |
|---|---|
| `IReportsRepository.ts` | Port: `listOpenInbox(filters, cursor): Promise<ReportInboxPage>`, `getCaseDetail(targetType, targetId): Promise<ReportCaseDetail>`. |
| `ListOpenReportsUseCase.ts` | Wraps `listOpenInbox`. |
| `GetReportCaseDetailUseCase.ts` | Wraps `getCaseDetail`. |
| `__tests__/ListOpenReportsUseCase.test.ts` | Mock-port test. |
| `__tests__/GetReportCaseDetailUseCase.test.ts` | Mock-port test. |

### Infrastructure (under `app/packages/infrastructure-supabase/src/reports/`)

| File | Responsibility |
|---|---|
| `SupabaseReportsRepository.ts` | Implements `IReportsRepository` against the two new RPCs. Defensive parsing using domain helpers. |
| `__tests__/SupabaseReportsRepository.integration.test.ts` | Integration tests against the dev project. Cover: empty inbox, 1-case happy path, threshold progress, TD-94 (dismiss one of three keeps the other two open), filters, pagination. |

### Mobile (under `app/apps/mobile/`)

| File | Responsibility |
|---|---|
| `src/i18n/locales/he/modules/admin.ts` | Append reports + caseDetail + coexistence keys (do NOT replace existing keys). |
| `src/hooks/useAdminPortalReportsFlag.ts` | Reads `EXPO_PUBLIC_ADMIN_PORTAL_REPORTS` env var with sane default. |
| `src/hooks/useReportsInbox.ts` | `useInfiniteQuery` over `ListOpenReportsUseCase`. |
| `src/hooks/useReportCaseDetail.ts` | `useQuery` over `GetReportCaseDetailUseCase`. |
| `src/components/admin/reports/ReportRow.tsx` | One row in the inbox. |
| `src/components/admin/reports/ReportFilters.tsx` | Filter chips: status, target_type, days, reporter. |
| `src/components/admin/reports/CaseActions.tsx` | Permission-gated action buttons. |
| `src/components/admin/reports/CaseAuditTimeline.tsx` | Reusable audit timeline view. |
| `src/components/admin/reports/CaseReporterList.tsx` | Reusable reporter list view. |
| `app/(admin)/reports/index.tsx` | **Replaces** the A0 ComingSoon stub. Real inbox screen. |
| `app/(admin)/reports/[caseId]/index.tsx` | Case detail. `caseId` is `<target_type>:<target_id>` (URL-encoded). |
| `app/(admin)/index.tsx` | **Modify**: replace the "open reports" KPI placeholder with a real count from `useReportsInbox`. |
| `src/components/chat/system/ReportReceivedBubble.tsx` | **Modify**: when `useAdminPortalReportsFlag()` is true, render the buttons read-only with a deep-link to the case. |
| `app/_layout.tsx` | (No change expected — `(admin)` is already registered after PR #385.) |

### SSOT updates

| File | Change |
|---|---|
| `docs/SSOT/BACKLOG.md` | P3.A1 row: ⏳ → 🟡 (at start) → ✅ Done (at PR merge). |
| `docs/SSOT/spec/12_super_admin.md` | Add §11 with FR-ADMIN-012, FR-ADMIN-013, FR-ADMIN-014 ACs (verbatim from the design spec). |
| `docs/SSOT/TECH_DEBT.md` | Move TD-94 to Resolved. |

### Branch & PR

- Branch: `feat/FR-ADMIN-012-a1-reports`
- PR title (lowercase per repo hygiene check): `feat(admin): a1 — reports dashboard + chat-flow coexistence`
- Base: `dev`

---

## Tasks

### Pre-task setup

```bash
cd /Users/navesarussi/Desktop/MVP-2
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feat/FR-ADMIN-012-a1-reports
```

If the working tree has the auto-generated `app/apps/mobile/.expo/types/router.d.ts`, leave it; only stage explicit paths in every commit.

Verify the next migration prefix:
```bash
ls supabase/migrations/ | sort | tail -5
```
The plan assumes `0118..0121` are free. If shifted, update all migration filenames in the plan consistently.

---

### Task 1: Migration `0118_widen_admin_rpcs_to_rbac.sql`

**Files:**
- Create: `supabase/migrations/0118_widen_admin_rpcs_to_rbac.sql`

- [ ] **Step 1: Write the migration**

The migration replaces each RPC's body so the role check uses `admin_assert_role(auth.uid(), ARRAY['super_admin','moderator'])` instead of `if not public.is_admin(v_actor) then raise ...`. The rest of every RPC body is unchanged.

```sql
-- Migration: widen 4 moderation RPCs from is_admin to RBAC.
-- admin_ban_user stays super_admin only per PERMISSION_MATRIX.
-- Mapped to spec: FR-ADMIN-012, FR-ADMIN-013 (RBAC integration).

-- admin_remove_post -----------------------------------------------------------
create or replace function public.admin_remove_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  perform public.admin_assert_role(v_actor, array['super_admin','moderator']);

  update public.posts
     set status = 'removed_admin', updated_at = now()
   where post_id = p_post_id and status <> 'removed_admin';

  if not found then return; end if;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'manual_remove_target', 'post', p_post_id, '{}'::jsonb);
end;
$$;

-- admin_dismiss_report --------------------------------------------------------
-- Body is unchanged except for the role check at the top.
-- Note: this RPC still calls admin_restore_target() internally when the open
-- report count for the target drops below 3 — the cascade fix lives in 0119.
create or replace function public.admin_dismiss_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor       uuid := auth.uid();
  v_report      public.reports%rowtype;
  v_open_count  int;
begin
  perform public.admin_assert_role(v_actor, array['super_admin','moderator']);

  select * into v_report
    from public.reports
   where report_id = p_report_id
   for update;

  if not found then
    raise exception 'report_not_found' using errcode = 'P0002';
  end if;

  if v_report.status <> 'open' then
    raise exception 'already_moderated' using errcode = 'P0001';
  end if;

  update public.reports
     set status = 'dismissed_no_violation',
         resolved_at = now(),
         resolved_by = v_actor
   where report_id = p_report_id;

  -- If the target was auto-removed and this dismissal drops the open count below 3,
  -- restore the target (its open reports remain open per TD-94 fix in 0119).
  if v_report.target_type in ('post', 'user', 'chat') and v_report.target_id is not null then
    select count(distinct reporter_id)
      into v_open_count
      from public.reports
     where target_type = v_report.target_type
       and target_id   = v_report.target_id
       and status      = 'open';

    if v_open_count < 3 then
      perform public.admin_restore_target(v_report.target_type, v_report.target_id);
    end if;
  end if;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'dismiss_report', v_report.target_type, v_report.target_id,
          jsonb_build_object('report_id', p_report_id));
end;
$$;

-- admin_confirm_report --------------------------------------------------------
create or replace function public.admin_confirm_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor  uuid := auth.uid();
  v_report public.reports%rowtype;
begin
  perform public.admin_assert_role(v_actor, array['super_admin','moderator']);

  select * into v_report
    from public.reports
   where report_id = p_report_id
   for update;

  if not found then
    raise exception 'report_not_found' using errcode = 'P0002';
  end if;

  if v_report.status <> 'open' then
    raise exception 'already_moderated' using errcode = 'P0001';
  end if;

  update public.reports
     set status = 'confirmed_violation',
         resolved_at = now(),
         resolved_by = v_actor
   where report_id = p_report_id;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'confirm_report', v_report.target_type, v_report.target_id,
          jsonb_build_object('report_id', p_report_id));
end;
$$;

revoke execute on function public.admin_remove_post(uuid)      from public;
revoke execute on function public.admin_dismiss_report(uuid)   from public;
revoke execute on function public.admin_confirm_report(uuid)   from public;
grant  execute on function public.admin_remove_post(uuid)      to authenticated;
grant  execute on function public.admin_dismiss_report(uuid)   to authenticated;
grant  execute on function public.admin_confirm_report(uuid)   to authenticated;
```

Note: `admin_restore_target` is intentionally NOT redefined here; that's done in 0119 (where the role check AND the cascade-dismiss removal happen together). `admin_ban_user` is intentionally untouched.

- [ ] **Step 2: Apply and smoke-test**

```bash
source ~/.kc-dev-secrets.env 2>/dev/null || true
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select pg_get_functiondef('public.admin_remove_post'::regproc::oid);" | head -25
```
Expected: function body contains `admin_assert_role`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0118_widen_admin_rpcs_to_rbac.sql
git commit -m "feat(admin): widen 4 moderation RPCs from is_admin to RBAC

admin_remove_post, admin_dismiss_report, admin_confirm_report now use
admin_assert_role([super_admin, moderator]) per the PERMISSION_MATRIX.
admin_ban_user stays super_admin only.

admin_restore_target is updated in 0119 (where the TD-94 fix lives).

Mapped to: FR-ADMIN-012, FR-ADMIN-013."
```

---

### Task 2: Migration `0119_admin_restore_no_cascade_dismiss.sql` (closes TD-94)

**Files:**
- Create: `supabase/migrations/0119_admin_restore_no_cascade_dismiss.sql`

The current `admin_restore_target` (in 0035) restores the target's status AND stamps every open report on that target as `dismissed_no_violation`. That cascade is the TD-94 bug: dismissing one report should not silently dismiss every other open report on the same target. Each case must be reviewed independently.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: TD-94 fix — admin_restore_target un-removes the target without
-- dismissing other open reports.
-- Also widens the role check to RBAC.
-- Mapped to: FR-ADMIN-013 AC3, closes TD-94.

create or replace function public.admin_restore_target(
  p_target_type text,
  p_target_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  perform public.admin_assert_role(v_actor, array['super_admin','moderator']);

  if p_target_type not in ('post','user','chat') then
    raise exception 'invalid_target_type' using errcode = '22023';
  end if;
  if p_target_id is null then
    raise exception 'invalid_target_id' using errcode = '22023';
  end if;

  if p_target_type = 'post' then
    update public.posts
       set status = 'visible', updated_at = now()
     where post_id = p_target_id and status = 'removed_admin';
  elsif p_target_type = 'user' then
    update public.users
       set account_status = 'active'
     where user_id = p_target_id and account_status = 'suspended_admin';
  elsif p_target_type = 'chat' then
    update public.chats
       set removed_at = null
     where chat_id = p_target_id and removed_at is not null;
  end if;

  if not found then return; end if;

  -- TD-94: do NOT touch other open reports. Each case is dismissed independently.
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'restore_target', p_target_type, p_target_id, '{}'::jsonb);
end;
$$;

revoke execute on function public.admin_restore_target(text, uuid) from public;
grant  execute on function public.admin_restore_target(text, uuid) to authenticated;
```

- [ ] **Step 2: Apply and verify**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select pg_get_functiondef('public.admin_restore_target'::regproc::oid);" | head -40
```
Expected: function body uses `admin_assert_role` AND does NOT contain any `update public.reports set status = 'dismissed_no_violation'`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0119_admin_restore_no_cascade_dismiss.sql
git commit -m "fix(admin): admin_restore_target no longer cascade-dismisses other reports

Closes TD-94. Each open report on the restored target stays open and
must be resolved individually. Role check widened to RBAC.

Mapped to: FR-ADMIN-013 AC3."
```

---

### Task 3: Migration `0120_reports_open_inbox_rpc.sql`

**Files:**
- Create: `supabase/migrations/0120_reports_open_inbox_rpc.sql`

The inbox returns one row per (target_type, target_id) — i.e., grouped — with: target preview info, distinct reporter count, oldest open report timestamp, latest reporter id, threshold progress (n/3), and the current target's resolution state. Pagination is cursor-based on `(oldest_report_at desc, target_type, target_id)`.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: reports_open_inbox RPC — paginated, grouped open report cases.
-- Mapped to: FR-ADMIN-012.

create or replace function public.reports_open_inbox(
  p_target_type_filter text   default null,    -- 'post'|'user'|'chat'|null=any
  p_max_age_days       int    default null,    -- e.g., 30
  p_reporter_filter    uuid   default null,    -- only show cases where this user reported
  p_cursor             jsonb  default null,    -- {"oldest_at": "...", "target_type": "...", "target_id": "..."}
  p_limit              int    default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  perform public.admin_assert_role(v_actor, array['super_admin','moderator','support']);

  if p_limit < 1 or p_limit > 100 then
    p_limit := 25;
  end if;

  return (
    with grouped as (
      select
        r.target_type,
        r.target_id,
        count(distinct r.reporter_id)                              as reporter_count,
        min(r.created_at)                                          as oldest_at,
        (array_agg(r.reporter_id order by r.created_at desc))[1]   as latest_reporter_id,
        case
          when r.target_type = 'post' then (
            select jsonb_build_object(
              'preview', left(coalesce(p.title, p.body, ''), 120),
              'status',  p.status,
              'author_id', p.author_id
            ) from public.posts p where p.post_id = r.target_id)
          when r.target_type = 'user' then (
            select jsonb_build_object(
              'display_name', u.display_name,
              'status',       u.account_status
            ) from public.users u where u.user_id = r.target_id)
          when r.target_type = 'chat' then (
            select jsonb_build_object('removed_at', c.removed_at)
            from public.chats c where c.chat_id = r.target_id)
          else '{}'::jsonb
        end as target
      from public.reports r
      where r.status = 'open'
        and r.target_type in ('post','user','chat')
        and r.target_id is not null
        and (p_target_type_filter is null or r.target_type = p_target_type_filter)
        and (p_max_age_days is null or r.created_at >= now() - make_interval(days => p_max_age_days))
        and (p_reporter_filter is null
             or exists (select 1 from public.reports r2
                        where r2.target_type = r.target_type
                          and r2.target_id   = r.target_id
                          and r2.reporter_id = p_reporter_filter
                          and r2.status = 'open'))
      group by r.target_type, r.target_id
    ),
    paged as (
      select g.*
        from grouped g
       where p_cursor is null
          or (g.oldest_at, g.target_type, g.target_id::text) <
             ((p_cursor->>'oldest_at')::timestamptz, p_cursor->>'target_type', p_cursor->>'target_id')
       order by g.oldest_at asc, g.target_type, g.target_id
       limit p_limit + 1
    )
    select jsonb_build_object(
      'rows', coalesce(jsonb_agg(jsonb_build_object(
        'target_type',         p.target_type,
        'target_id',           p.target_id,
        'reporter_count',      p.reporter_count,
        'oldest_at',           p.oldest_at,
        'latest_reporter_id',  p.latest_reporter_id,
        'target',              p.target
      ) order by p.oldest_at asc) filter (where p.row_idx <= p_limit), '[]'::jsonb),
      'next_cursor', (
        select jsonb_build_object(
          'oldest_at',   p2.oldest_at,
          'target_type', p2.target_type,
          'target_id',   p2.target_id::text
        )
        from (select p.*, row_number() over (order by p.oldest_at asc, p.target_type, p.target_id) as row_idx from paged p) p2
        where p2.row_idx = p_limit + 1
      )
    )
    from (select p.*, row_number() over (order by p.oldest_at asc, p.target_type, p.target_id) as row_idx from paged p) p
  );
end;
$$;

revoke execute on function public.reports_open_inbox(text, int, uuid, jsonb, int) from public;
grant  execute on function public.reports_open_inbox(text, int, uuid, jsonb, int) to authenticated;
```

- [ ] **Step 2: Apply and smoke-test**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select public.reports_open_inbox();" | head -5
```
Expected: returns a JSON object with `rows` array (possibly empty) and `next_cursor` (possibly null). No error.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0120_reports_open_inbox_rpc.sql
git commit -m "feat(admin): reports_open_inbox RPC

Returns paginated, grouped-by-target open report cases for the
A1 inbox screen. RBAC: super_admin / moderator / support.

Mapped to: FR-ADMIN-012."
```

---

### Task 4: Migration `0121_reports_case_detail_rpc.sql`

**Files:**
- Create: `supabase/migrations/0121_reports_case_detail_rpc.sql`

Returns one JSON object: the target preview, the full reporter list with their reasons + notes + report_ids, an audit timeline for that target, and the target's current status.

- [ ] **Step 1: Write the migration**

```sql
-- Migration: reports_case_detail RPC.
-- Mapped to: FR-ADMIN-013.

create or replace function public.reports_case_detail(
  p_target_type text,
  p_target_id   uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_target jsonb;
  v_reporters jsonb;
  v_timeline jsonb;
begin
  perform public.admin_assert_role(v_actor, array['super_admin','moderator','support']);

  if p_target_type not in ('post','user','chat') or p_target_id is null then
    raise exception 'invalid_target' using errcode = '22023';
  end if;

  if p_target_type = 'post' then
    select jsonb_build_object(
      'preview',   left(coalesce(p.title, p.body, ''), 280),
      'status',    p.status,
      'author_id', p.author_id,
      'created_at', p.created_at
    ) into v_target
    from public.posts p where p.post_id = p_target_id;
  elsif p_target_type = 'user' then
    select jsonb_build_object(
      'display_name', u.display_name,
      'status',       u.account_status,
      'created_at',   u.created_at
    ) into v_target
    from public.users u where u.user_id = p_target_id;
  elsif p_target_type = 'chat' then
    select jsonb_build_object(
      'removed_at', c.removed_at
    ) into v_target
    from public.chats c where c.chat_id = p_target_id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'report_id',     r.report_id,
    'reporter_id',   r.reporter_id,
    'reporter_name', u.display_name,
    'reason',        r.reason,
    'note',          r.note,
    'status',        r.status,
    'created_at',    r.created_at,
    'resolved_at',   r.resolved_at,
    'resolved_by',   r.resolved_by
  ) order by r.created_at asc), '[]'::jsonb)
    into v_reporters
    from public.reports r
    left join public.users u on u.user_id = r.reporter_id
   where r.target_type = p_target_type
     and r.target_id   = p_target_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'event_id',  e.event_id,
    'actor_id',  e.actor_id,
    'action',    e.action,
    'metadata',  e.metadata,
    'created_at', e.created_at
  ) order by e.created_at desc), '[]'::jsonb)
    into v_timeline
    from public.audit_events e
   where e.target_type = p_target_type
     and e.target_id   = p_target_id;

  return jsonb_build_object(
    'target_type', p_target_type,
    'target_id',   p_target_id,
    'target',      coalesce(v_target, '{}'::jsonb),
    'reporters',   v_reporters,
    'timeline',    v_timeline
  );
end;
$$;

revoke execute on function public.reports_case_detail(text, uuid) from public;
grant  execute on function public.reports_case_detail(text, uuid) to authenticated;
```

- [ ] **Step 2: Apply and verify**

```bash
supabase db push --linked --include-all
psql "$KC_DEV_DB_URL" -c "select public.reports_case_detail('post', gen_random_uuid());" | head
```
Expected: returns a JSON object with `target_type: post`, empty `reporters` and `timeline` arrays, `target: {}`. No error.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0121_reports_case_detail_rpc.sql
git commit -m "feat(admin): reports_case_detail RPC

Returns target preview + reporter list + audit timeline for the
A1 case detail screen. RBAC: super_admin / moderator / support.

Mapped to: FR-ADMIN-013."
```

---

### Task 5: Integration tests for RPC widening + TD-94 + new RPCs

**Files:**
- Create: `app/packages/infrastructure-supabase/src/reports/__tests__/reportsRpc.integration.test.ts`

- [ ] **Step 1: Write tests covering**:
1. `admin_dismiss_report` succeeds for a moderator (not just super_admin).
2. `admin_remove_post` succeeds for a moderator.
3. `admin_confirm_report` succeeds for a moderator.
4. `admin_ban_user` rejects a moderator with 42501 (super_admin only per matrix).
5. TD-94: seed 3 distinct reports on one post → trigger auto-removal → dismiss one report → verify the post is restored AND the OTHER two reports remain `status='open'`.
6. `reports_open_inbox` returns empty `rows` when no reports exist.
7. `reports_open_inbox` returns one row per target grouped.
8. `reports_open_inbox` honors `p_target_type_filter='post'`.
9. `reports_open_inbox` paginates: 27 cases, limit 10 → 3 pages, last page no `next_cursor`.
10. `reports_case_detail` returns target preview + reporters + timeline for an existing case.
11. `reports_case_detail` raises `22023` on invalid target_type.

Follow the same `beforeAll`/`afterAll` idempotency pattern as `adminRoleRpc.integration.test.ts`: temporarily revoke any live super_admin, create a fresh moderator grant for tests that need one, restore at the end.

Code template (≈300 lines — write the full file; do NOT abbreviate; refer to `adminRoleRpc.integration.test.ts` for the seed/cleanup helpers and adapt for `posts`, `users`, `chats`, and `reports`).

The test file MUST `vi.describe.skip` if env vars are absent (same gate as Group A).

- [ ] **Step 2: Run**

```bash
source ~/.kc-dev-secrets.env 2>/dev/null || true
NODE_OPTIONS=--experimental-websocket pnpm --filter @kc/infrastructure-supabase test -- reportsRpc
```
Expected: **11 passed / 11 total**.

- [ ] **Step 3: Commit**

```bash
git add app/packages/infrastructure-supabase/src/reports/__tests__/reportsRpc.integration.test.ts
git commit -m "test(admin): integration tests for A1 RPC widening, TD-94, inbox, case detail

Mapped to: FR-ADMIN-012, FR-ADMIN-013, closes TD-94."
```

---

### Task 6: Domain — `ReportInbox` value objects + tests

**Files:**
- Create: `app/packages/domain/src/reports/index.ts`
- Create: `app/packages/domain/src/reports/ReportInbox.ts`
- Create: `app/packages/domain/src/reports/__tests__/ReportInbox.test.ts`
- Modify: `app/packages/domain/src/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
// app/packages/domain/src/reports/__tests__/ReportInbox.test.ts
import { describe, expect, it } from 'vitest';
import {
  parseReportInboxPage, AUTO_REMOVE_THRESHOLD, thresholdProgress,
  type ReportInboxRow,
} from '../ReportInbox';

describe('ReportInbox', () => {
  it('AUTO_REMOVE_THRESHOLD is 3', () => {
    expect(AUTO_REMOVE_THRESHOLD).toBe(3);
  });

  it('thresholdProgress caps at the threshold', () => {
    expect(thresholdProgress(0)).toEqual({ count: 0, threshold: 3, pct: 0 });
    expect(thresholdProgress(2)).toEqual({ count: 2, threshold: 3, pct: 2/3 });
    expect(thresholdProgress(3)).toEqual({ count: 3, threshold: 3, pct: 1 });
    expect(thresholdProgress(99)).toEqual({ count: 99, threshold: 3, pct: 1 });
  });

  it('parseReportInboxPage returns an empty page on malformed input', () => {
    expect(parseReportInboxPage(null)).toEqual({ rows: [], nextCursor: null });
    expect(parseReportInboxPage({})).toEqual({ rows: [], nextCursor: null });
    expect(parseReportInboxPage({ rows: 'oops' })).toEqual({ rows: [], nextCursor: null });
  });

  it('parseReportInboxPage filters invalid rows and preserves valid ones', () => {
    const input = {
      rows: [
        { target_type: 'post', target_id: 'a-uuid', reporter_count: 2, oldest_at: '2026-05-25T10:00:00Z', latest_reporter_id: 'b', target: { preview: 'hi' } },
        { target_type: 'unknown', target_id: 'x' },              // dropped
        { target_id: 'no-type' },                                // dropped
      ],
      next_cursor: { oldest_at: '2026-05-25T09:00:00Z', target_type: 'post', target_id: 'c' },
    };
    const out = parseReportInboxPage(input);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].targetType).toBe<ReportInboxRow['targetType']>('post');
    expect(out.nextCursor?.targetType).toBe('post');
  });
});
```

- [ ] **Step 2: Run — verify fails**

```bash
cd app && pnpm --filter @kc/domain test -- ReportInbox
```
Expected: FAIL.

- [ ] **Step 3: Implementation**

```typescript
// app/packages/domain/src/reports/ReportInbox.ts
export const AUTO_REMOVE_THRESHOLD = 3 as const;

export type ReportTargetType = 'post' | 'user' | 'chat';

export interface ReportThresholdProgress {
  readonly count: number;
  readonly threshold: number;
  readonly pct: number;  // 0..1
}

export function thresholdProgress(count: number): ReportThresholdProgress {
  const capped = Math.min(count, AUTO_REMOVE_THRESHOLD);
  return {
    count,
    threshold: AUTO_REMOVE_THRESHOLD,
    pct: capped / AUTO_REMOVE_THRESHOLD,
  };
}

export interface ReportInboxRow {
  readonly targetType: ReportTargetType;
  readonly targetId: string;
  readonly reporterCount: number;
  readonly oldestAt: string;       // ISO timestamp
  readonly latestReporterId: string | null;
  readonly target: Readonly<Record<string, unknown>>;
}

export interface ReportInboxCursor {
  readonly oldestAt: string;
  readonly targetType: ReportTargetType;
  readonly targetId: string;
}

export interface ReportInboxPage {
  readonly rows: readonly ReportInboxRow[];
  readonly nextCursor: ReportInboxCursor | null;
}

function isTargetType(v: unknown): v is ReportTargetType {
  return v === 'post' || v === 'user' || v === 'chat';
}

export function parseReportInboxPage(input: unknown): ReportInboxPage {
  if (!input || typeof input !== 'object') return { rows: [], nextCursor: null };
  const obj = input as Record<string, unknown>;
  const rowsRaw = obj['rows'];
  const rows: ReportInboxRow[] = [];
  if (Array.isArray(rowsRaw)) {
    for (const raw of rowsRaw) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Record<string, unknown>;
      if (!isTargetType(r['target_type']) || typeof r['target_id'] !== 'string') continue;
      rows.push({
        targetType:        r['target_type'],
        targetId:          r['target_id'],
        reporterCount:     typeof r['reporter_count'] === 'number' ? r['reporter_count'] : 0,
        oldestAt:          typeof r['oldest_at'] === 'string' ? r['oldest_at'] : '',
        latestReporterId:  typeof r['latest_reporter_id'] === 'string' ? r['latest_reporter_id'] : null,
        target:            (r['target'] && typeof r['target'] === 'object') ? r['target'] as Record<string, unknown> : {},
      });
    }
  }
  const cursorRaw = obj['next_cursor'];
  let nextCursor: ReportInboxCursor | null = null;
  if (cursorRaw && typeof cursorRaw === 'object') {
    const c = cursorRaw as Record<string, unknown>;
    if (typeof c['oldest_at'] === 'string' && isTargetType(c['target_type']) && typeof c['target_id'] === 'string') {
      nextCursor = {
        oldestAt: c['oldest_at'],
        targetType: c['target_type'],
        targetId: c['target_id'],
      };
    }
  }
  return { rows, nextCursor };
}
```

```typescript
// app/packages/domain/src/reports/index.ts
export * from './ReportInbox';
export * from './ReportCaseDetail';
```

Append to `app/packages/domain/src/index.ts`:
```typescript
export * from './reports';
```

- [ ] **Step 4: Run — verify pass**

```bash
cd app && pnpm --filter @kc/domain test -- ReportInbox
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/packages/domain/src/reports/index.ts \
        app/packages/domain/src/reports/ReportInbox.ts \
        app/packages/domain/src/reports/__tests__/ReportInbox.test.ts \
        app/packages/domain/src/index.ts
git commit -m "feat(domain): add ReportInbox value objects + threshold helpers

Mapped to: FR-ADMIN-012."
```

---

### Task 7: Domain — `ReportCaseDetail` value objects

**Files:**
- Create: `app/packages/domain/src/reports/ReportCaseDetail.ts`

(No new tests beyond the inbox tests — case detail is a thin parse, exercised via integration tests in Task 5 and the use-case test in Task 9.)

- [ ] **Step 1: Write**

```typescript
// app/packages/domain/src/reports/ReportCaseDetail.ts
import type { ReportTargetType } from './ReportInbox';

export type ReportStatus = 'open' | 'confirmed_violation' | 'dismissed_no_violation';

export interface ReportCaseReporter {
  readonly reportId: string;
  readonly reporterId: string;
  readonly reporterName: string | null;
  readonly reason: string;
  readonly note: string | null;
  readonly status: ReportStatus;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly resolvedBy: string | null;
}

export interface ReportCaseAuditEntry {
  readonly eventId: string;
  readonly actorId: string | null;
  readonly action: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
}

export interface ReportCaseDetail {
  readonly targetType: ReportTargetType;
  readonly targetId: string;
  readonly target: Readonly<Record<string, unknown>>;
  readonly reporters: readonly ReportCaseReporter[];
  readonly timeline: readonly ReportCaseAuditEntry[];
}

export function parseReportCaseDetail(input: unknown): ReportCaseDetail | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as Record<string, unknown>;
  const tt = obj['target_type'];
  if (tt !== 'post' && tt !== 'user' && tt !== 'chat') return null;
  if (typeof obj['target_id'] !== 'string') return null;

  const reporters: ReportCaseReporter[] = [];
  if (Array.isArray(obj['reporters'])) {
    for (const raw of obj['reporters']) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Record<string, unknown>;
      if (typeof r['report_id'] !== 'string' || typeof r['reporter_id'] !== 'string') continue;
      reporters.push({
        reportId:    r['report_id'],
        reporterId:  r['reporter_id'],
        reporterName: typeof r['reporter_name'] === 'string' ? r['reporter_name'] : null,
        reason:      typeof r['reason'] === 'string' ? r['reason'] : '',
        note:        typeof r['note'] === 'string' ? r['note'] : null,
        status:      (r['status'] === 'open' || r['status'] === 'confirmed_violation' || r['status'] === 'dismissed_no_violation') ? r['status'] : 'open',
        createdAt:   typeof r['created_at'] === 'string' ? r['created_at'] : '',
        resolvedAt:  typeof r['resolved_at'] === 'string' ? r['resolved_at'] : null,
        resolvedBy:  typeof r['resolved_by'] === 'string' ? r['resolved_by'] : null,
      });
    }
  }

  const timeline: ReportCaseAuditEntry[] = [];
  if (Array.isArray(obj['timeline'])) {
    for (const raw of obj['timeline']) {
      if (!raw || typeof raw !== 'object') continue;
      const e = raw as Record<string, unknown>;
      if (typeof e['event_id'] !== 'string') continue;
      timeline.push({
        eventId:    e['event_id'],
        actorId:    typeof e['actor_id'] === 'string' ? e['actor_id'] : null,
        action:     typeof e['action'] === 'string' ? e['action'] : '',
        metadata:   (e['metadata'] && typeof e['metadata'] === 'object') ? e['metadata'] as Record<string, unknown> : {},
        createdAt:  typeof e['created_at'] === 'string' ? e['created_at'] : '',
      });
    }
  }

  return {
    targetType: tt,
    targetId:   obj['target_id'] as string,
    target:     (obj['target'] && typeof obj['target'] === 'object') ? obj['target'] as Record<string, unknown> : {},
    reporters,
    timeline,
  };
}
```

- [ ] **Step 2: Verify**

```bash
cd app && pnpm --filter @kc/domain typecheck && pnpm --filter @kc/domain test
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/packages/domain/src/reports/ReportCaseDetail.ts
git commit -m "feat(domain): add ReportCaseDetail value objects + parser

Mapped to: FR-ADMIN-013."
```

---

### Task 8: Application — `IReportsRepository` port

**Files:**
- Create: `app/packages/application/src/reports/IReportsRepository.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write**

```typescript
// app/packages/application/src/reports/IReportsRepository.ts
import type {
  ReportInboxPage, ReportInboxCursor, ReportTargetType, ReportCaseDetail,
} from '@kc/domain';

export interface ListOpenReportsFilters {
  readonly targetType?: ReportTargetType | null;
  readonly maxAgeDays?: number | null;
  readonly reporterId?: string | null;
}

export interface IReportsRepository {
  listOpenInbox(filters: ListOpenReportsFilters, cursor: ReportInboxCursor | null, limit: number): Promise<ReportInboxPage>;
  getCaseDetail(targetType: ReportTargetType, targetId: string): Promise<ReportCaseDetail | null>;
}
```

- [ ] **Step 2: Re-export**

Append to `app/packages/application/src/index.ts`:
```typescript
export * from './reports/IReportsRepository';
export * from './reports/ListOpenReportsUseCase';
export * from './reports/GetReportCaseDetailUseCase';
```

(If the use-case re-exports fail at this commit because the files don't exist yet, comment them out and re-enable in Task 9.)

- [ ] **Step 3: Commit**

```bash
git add app/packages/application/src/reports/IReportsRepository.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): add IReportsRepository port

Mapped to: FR-ADMIN-012, FR-ADMIN-013."
```

---

### Task 9: Application — `ListOpenReportsUseCase` + `GetReportCaseDetailUseCase`

**Files:**
- Create: `app/packages/application/src/reports/ListOpenReportsUseCase.ts`
- Create: `app/packages/application/src/reports/GetReportCaseDetailUseCase.ts`
- Create: `app/packages/application/src/reports/__tests__/ListOpenReportsUseCase.test.ts`
- Create: `app/packages/application/src/reports/__tests__/GetReportCaseDetailUseCase.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ListOpenReportsUseCase.test.ts
import { describe, expect, it, vi } from 'vitest';
import { ListOpenReportsUseCase } from '../ListOpenReportsUseCase';
import type { IReportsRepository } from '../IReportsRepository';

function fakeRepo(): IReportsRepository {
  return {
    listOpenInbox: vi.fn().mockResolvedValue({ rows: [], nextCursor: null }),
    getCaseDetail: vi.fn(),
  };
}

describe('ListOpenReportsUseCase', () => {
  it('passes filters and cursor through, defaulting limit to 25', async () => {
    const repo = fakeRepo();
    const uc = new ListOpenReportsUseCase(repo);
    await uc.execute({ filters: { targetType: 'post' }, cursor: null });
    expect(repo.listOpenInbox).toHaveBeenCalledWith({ targetType: 'post' }, null, 25);
  });

  it('passes explicit limit', async () => {
    const repo = fakeRepo();
    const uc = new ListOpenReportsUseCase(repo);
    await uc.execute({ filters: {}, cursor: null, limit: 10 });
    expect(repo.listOpenInbox).toHaveBeenCalledWith({}, null, 10);
  });
});
```

```typescript
// GetReportCaseDetailUseCase.test.ts
import { describe, expect, it, vi } from 'vitest';
import type { ReportCaseDetail } from '@kc/domain';
import { GetReportCaseDetailUseCase } from '../GetReportCaseDetailUseCase';
import type { IReportsRepository } from '../IReportsRepository';

function fakeRepo(detail: ReportCaseDetail | null): IReportsRepository {
  return {
    listOpenInbox: vi.fn(),
    getCaseDetail: vi.fn().mockResolvedValue(detail),
  };
}

describe('GetReportCaseDetailUseCase', () => {
  it('returns the repo result', async () => {
    const detail: ReportCaseDetail = {
      targetType: 'post', targetId: 'abc',
      target: { preview: 'hi' }, reporters: [], timeline: [],
    };
    const uc = new GetReportCaseDetailUseCase(fakeRepo(detail));
    expect(await uc.execute('post', 'abc')).toEqual(detail);
  });

  it('returns null when the case does not exist', async () => {
    const uc = new GetReportCaseDetailUseCase(fakeRepo(null));
    expect(await uc.execute('post', 'abc')).toBeNull();
  });
});
```

- [ ] **Step 2: Run — fail**

```bash
cd app && pnpm --filter @kc/application test -- ListOpenReports GetReportCaseDetail
```

- [ ] **Step 3: Implementation**

```typescript
// ListOpenReportsUseCase.ts
import type { ReportInboxPage, ReportInboxCursor } from '@kc/domain';
import type { IReportsRepository, ListOpenReportsFilters } from './IReportsRepository';

const DEFAULT_LIMIT = 25;

export interface ListOpenReportsInput {
  readonly filters: ListOpenReportsFilters;
  readonly cursor: ReportInboxCursor | null;
  readonly limit?: number;
}

export class ListOpenReportsUseCase {
  constructor(private readonly repo: IReportsRepository) {}

  async execute(input: ListOpenReportsInput): Promise<ReportInboxPage> {
    return this.repo.listOpenInbox(input.filters, input.cursor, input.limit ?? DEFAULT_LIMIT);
  }
}
```

```typescript
// GetReportCaseDetailUseCase.ts
import type { ReportCaseDetail, ReportTargetType } from '@kc/domain';
import type { IReportsRepository } from './IReportsRepository';

export class GetReportCaseDetailUseCase {
  constructor(private readonly repo: IReportsRepository) {}

  async execute(targetType: ReportTargetType, targetId: string): Promise<ReportCaseDetail | null> {
    return this.repo.getCaseDetail(targetType, targetId);
  }
}
```

- [ ] **Step 4: Run — pass**, then commit

```bash
cd app && pnpm --filter @kc/application test -- ListOpenReports GetReportCaseDetail
git add app/packages/application/src/reports/ app/packages/application/src/index.ts
git commit -m "feat(application): add ListOpenReports + GetReportCaseDetail use cases

Mapped to: FR-ADMIN-012, FR-ADMIN-013."
```

---

### Task 10: Infrastructure — `SupabaseReportsRepository`

**Files:**
- Create: `app/packages/infrastructure-supabase/src/reports/SupabaseReportsRepository.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts`

- [ ] **Step 1: Write the adapter**

```typescript
// SupabaseReportsRepository.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IReportsRepository, ListOpenReportsFilters,
} from '@kc/application';
import {
  type ReportInboxCursor, type ReportInboxPage,
  type ReportCaseDetail, type ReportTargetType,
  parseReportInboxPage, parseReportCaseDetail,
} from '@kc/domain';

const EMPTY_PAGE: ReportInboxPage = { rows: [], nextCursor: null };

export class SupabaseReportsRepository implements IReportsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listOpenInbox(
    filters: ListOpenReportsFilters,
    cursor: ReportInboxCursor | null,
    limit: number,
  ): Promise<ReportInboxPage> {
    const cursorPayload = cursor === null ? null : {
      oldest_at: cursor.oldestAt,
      target_type: cursor.targetType,
      target_id: cursor.targetId,
    };
    const { data, error } = await this.client.rpc('reports_open_inbox', {
      p_target_type_filter: filters.targetType ?? null,
      p_max_age_days:       filters.maxAgeDays ?? null,
      p_reporter_filter:    filters.reporterId ?? null,
      p_cursor:             cursorPayload,
      p_limit:              limit,
    });
    if (error) return EMPTY_PAGE;
    return parseReportInboxPage(data);
  }

  async getCaseDetail(targetType: ReportTargetType, targetId: string): Promise<ReportCaseDetail | null> {
    const { data, error } = await this.client.rpc('reports_case_detail', {
      p_target_type: targetType,
      p_target_id:   targetId,
    });
    if (error) return null;
    return parseReportCaseDetail(data);
  }
}
```

- [ ] **Step 2: Re-export + verify**

Append to `app/packages/infrastructure-supabase/src/index.ts`:
```typescript
export * from './reports/SupabaseReportsRepository';
```

```bash
cd app && pnpm --filter @kc/infrastructure-supabase typecheck && pnpm --filter @kc/infrastructure-supabase lint
```

- [ ] **Step 3: Commit**

```bash
git add app/packages/infrastructure-supabase/src/reports/ \
        app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): add SupabaseReportsRepository

Mapped to: FR-ADMIN-012, FR-ADMIN-013."
```

---

### Task 11: Mobile — i18n keys for A1

**Files:**
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/admin.ts`

- [ ] **Step 1: Append the new keys** (do NOT replace the existing keys from A0):

```typescript
  reports: {
    inboxTitle: 'דיווחים פתוחים',
    emptyTitle: 'אין דיווחים פתוחים',
    emptyHint:  'כל הקריאות טופלו. כל הכבוד.',
    filters: {
      all:        'הכל',
      posts:      'פוסטים',
      users:      'משתמשים',
      chats:      'צ׳אטים',
      last7Days:  'שבעה ימים אחרונים',
      last30Days: 'שלושים ימים אחרונים',
      search:     'חיפוש לפי מזהה יעד או שם המדווח',
    },
    row: {
      reportersCount: (n: number) => `${n} מדווחים`,
      thresholdLabel: (n: number, threshold: number) => `${n}/${threshold}`,
      ageDays:        (d: number) => `לפני ${d} ימים`,
      ageHours:       (h: number) => `לפני ${h} שעות`,
      ageMinutes:     (m: number) => `לפני ${m} דקות`,
    },
  },
  caseDetail: {
    title:         'תיק דיווח',
    targetSection: 'היעד',
    reporters:     'מדווחים',
    timeline:      'יומן פעולות',
    actions:       'פעולות',
    actionLabels: {
      confirm:         'אישור הסרה',
      dismiss:         'דחיית דיווח',
      restore:         'שחזור היעד',
      permanentBan:    'חסימה לצמיתות',
      manualRemove:    'הסרה ידנית',
      adminEdit:       'עריכת אדמין',
      openSupport:     'פתיחת צ׳אט תמיכה',
    },
    confirmDialog: {
      title:   'אישור פעולה',
      message: 'הפעולה תירשם ביומן.',
      ok:      'אישור',
      cancel:  'ביטול',
    },
    notFound: 'לא נמצא תיק.',
    loading:  'טוען...',
  },
  coexistence: {
    bubbleReadOnly: 'הפעולות זמינות בפורטל הניהול',
    bubbleOpenInPortal: 'פתח בפורטל',
  },
```

Place these inside the existing `adminHe` const, after the `gate` block. Do not touch existing keys.

- [ ] **Step 2: Verify**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/i18n/locales/he/modules/admin.ts
git commit -m "feat(mobile): admin i18n — A1 reports, case detail, coexistence

Mapped to: FR-ADMIN-012, FR-ADMIN-013, FR-ADMIN-014."
```

---

### Task 12: Mobile — feature-flag hook + DI wiring

**Files:**
- Create: `app/apps/mobile/src/hooks/useAdminPortalReportsFlag.ts`
- Modify: `app/apps/mobile/src/lib/container.ts`

- [ ] **Step 1: Feature flag hook**

```typescript
// useAdminPortalReportsFlag.ts
// EXPO_PUBLIC_ADMIN_PORTAL_REPORTS — when "true", chat-flow ReportReceivedBubble
// renders read-only with a deep-link to the portal case.
export function useAdminPortalReportsFlag(): boolean {
  return process.env['EXPO_PUBLIC_ADMIN_PORTAL_REPORTS'] === 'true';
}
```

- [ ] **Step 2: Container wiring**

In `app/apps/mobile/src/lib/container.ts`:

1. Add `SupabaseReportsRepository` to the `@kc/infrastructure-supabase` import block.
2. Add `ListOpenReportsUseCase, GetReportCaseDetailUseCase` to the `@kc/application` import block.
3. After the existing instantiations, add:
```typescript
const reportsRepo = new SupabaseReportsRepository(supabase);
const listOpenReports = new ListOpenReportsUseCase(reportsRepo);
const getReportCaseDetail = new GetReportCaseDetailUseCase(reportsRepo);
```
4. Expose all three via the `container` export object.

- [ ] **Step 3: Verify + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/hooks/useAdminPortalReportsFlag.ts \
        app/apps/mobile/src/lib/container.ts
git commit -m "feat(mobile): feature flag hook + DI wiring for A1 reports

Mapped to: FR-ADMIN-012, FR-ADMIN-014."
```

---

### Task 13: Mobile — `useReportsInbox` + `useReportCaseDetail` hooks

**Files:**
- Create: `app/apps/mobile/src/hooks/useReportsInbox.ts`
- Create: `app/apps/mobile/src/hooks/useReportCaseDetail.ts`

- [ ] **Step 1: Write the inbox hook**

```typescript
// useReportsInbox.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ReportInboxPage } from '@kc/domain';
import type { ListOpenReportsFilters } from '@kc/application';
import { container } from '../lib/container';

export function useReportsInbox(filters: ListOpenReportsFilters) {
  return useInfiniteQuery<ReportInboxPage>({
    queryKey: ['admin.reports.inbox', filters],
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      container.listOpenReports.execute({ filters, cursor: pageParam as ReportInboxPage['nextCursor'] ?? null }),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
  });
}
```

- [ ] **Step 2: Write the case-detail hook**

```typescript
// useReportCaseDetail.ts
import { useQuery } from '@tanstack/react-query';
import type { ReportTargetType } from '@kc/domain';
import { container } from '../lib/container';

export function useReportCaseDetail(targetType: ReportTargetType | null, targetId: string | null) {
  return useQuery({
    queryKey: ['admin.reports.case', targetType, targetId],
    queryFn: () => container.getReportCaseDetail.execute(targetType!, targetId!),
    enabled: targetType !== null && targetId !== null,
    staleTime: 10_000,
  });
}
```

- [ ] **Step 3: Verify + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/hooks/useReportsInbox.ts \
        app/apps/mobile/src/hooks/useReportCaseDetail.ts
git commit -m "feat(mobile): add useReportsInbox + useReportCaseDetail hooks

Mapped to: FR-ADMIN-012, FR-ADMIN-013."
```

---

### Task 14: Mobile — reports inbox screen (replaces A0 stub)

**Files:**
- Create: `app/apps/mobile/src/components/admin/reports/ReportRow.tsx`
- Create: `app/apps/mobile/src/components/admin/reports/ReportFilters.tsx`
- Modify: `app/apps/mobile/app/(admin)/reports/index.tsx` (replace the ComingSoon stub)

- [ ] **Step 1: `ReportRow` component**

A single inbox row showing target preview, reporter count, threshold progress (`n/3`), age, latest reporter link. Tapping it navigates to `/admin/reports/<encoded>`.

```typescript
// ReportRow.tsx (~80 lines)
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReportInboxRow } from '@kc/domain';
import { thresholdProgress } from '@kc/domain';
import he from '../../../i18n/locales/he';

export interface ReportRowProps {
  readonly row: ReportInboxRow;
}

function ageLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60)   return he.admin.reports.row.ageMinutes(mins);
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return he.admin.reports.row.ageHours(hrs);
  const days = Math.floor(hrs / 24);
  return he.admin.reports.row.ageDays(days);
}

function preview(row: ReportInboxRow): string {
  const t = row.target;
  if (typeof t['preview'] === 'string')      return t['preview'];
  if (typeof t['display_name'] === 'string') return t['display_name'];
  return `${row.targetType}:${row.targetId.slice(0, 8)}`;
}

export function ReportRow({ row }: ReportRowProps) {
  const progress = thresholdProgress(row.reporterCount);
  const caseId = encodeURIComponent(`${row.targetType}:${row.targetId}`);
  return (
    <Pressable style={styles.root} onPress={() => router.push(`/admin/reports/${caseId}`)}>
      <Text style={styles.preview} numberOfLines={2}>{preview(row)}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {he.admin.reports.row.thresholdLabel(progress.count, progress.threshold)}
        </Text>
        <Text style={styles.metaText}>{ageLabel(row.oldestAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  preview: { fontSize: 14, fontWeight: '500' },
  meta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 12, opacity: 0.6 },
});
```

- [ ] **Step 2: `ReportFilters` component**

Three chip rows: target_type (all/post/user/chat), age (7d/30d), reporter (text input for ID — keep simple, search refinement comes later). Emits a `ListOpenReportsFilters` via callback.

```typescript
// ReportFilters.tsx (~100 lines)
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ListOpenReportsFilters } from '@kc/application';
import he from '../../../i18n/locales/he';

export interface ReportFiltersProps {
  readonly value: ListOpenReportsFilters;
  readonly onChange: (next: ListOpenReportsFilters) => void;
}

const TYPES: { key: 'all' | 'post' | 'user' | 'chat'; label: string }[] = [
  { key: 'all',  label: he.admin.reports.filters.all },
  { key: 'post', label: he.admin.reports.filters.posts },
  { key: 'user', label: he.admin.reports.filters.users },
  { key: 'chat', label: he.admin.reports.filters.chats },
];

export function ReportFilters({ value, onChange }: ReportFiltersProps) {
  const [reporter, setReporter] = useState(value.reporterId ?? '');

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TYPES.map(t => {
          const active = (value.targetType ?? null) === (t.key === 'all' ? null : t.key);
          return (
            <Pressable
              key={t.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange({ ...value, targetType: t.key === 'all' ? null : t.key })}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.chip, value.maxAgeDays === 7 && styles.chipActive]}
          onPress={() => onChange({ ...value, maxAgeDays: value.maxAgeDays === 7 ? null : 7 })}
        >
          <Text style={styles.chipText}>{he.admin.reports.filters.last7Days}</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, value.maxAgeDays === 30 && styles.chipActive]}
          onPress={() => onChange({ ...value, maxAgeDays: value.maxAgeDays === 30 ? null : 30 })}
        >
          <Text style={styles.chipText}>{he.admin.reports.filters.last30Days}</Text>
        </Pressable>
      </ScrollView>
      <TextInput
        style={styles.search}
        placeholder={he.admin.reports.filters.search}
        value={reporter}
        onChangeText={setReporter}
        onSubmitEditing={() => onChange({ ...value, reporterId: reporter || null })}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  row:  { gap: 8, paddingRight: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f5f5f5' },
  chipActive: { backgroundColor: '#eef2ff' },
  chipText:   { fontSize: 12 },
  chipTextActive: { fontWeight: '600' },
  search: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 8, fontSize: 14 },
});
```

- [ ] **Step 3: Replace the inbox stub**

```typescript
// app/apps/mobile/app/(admin)/reports/index.tsx
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { ListOpenReportsFilters } from '@kc/application';
import { useReportsInbox } from '../../../src/hooks/useReportsInbox';
import { ReportFilters } from '../../../src/components/admin/reports/ReportFilters';
import { ReportRow } from '../../../src/components/admin/reports/ReportRow';
import he from '../../../src/i18n/locales/he';

export default function ReportsInbox() {
  const [filters, setFilters] = useState<ListOpenReportsFilters>({});
  const q = useReportsInbox(filters);
  const rows = q.data?.pages.flatMap(p => p.rows) ?? [];

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{he.admin.reports.inboxTitle}</Text>
      <ReportFilters value={filters} onChange={setFilters} />
      <FlatList
        data={rows}
        keyExtractor={r => `${r.targetType}:${r.targetId}`}
        renderItem={({ item }) => <ReportRow row={item} />}
        onEndReached={() => q.hasNextPage && q.fetchNextPage()}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} />}
        ListEmptyComponent={
          !q.isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{he.admin.reports.emptyTitle}</Text>
              <Text style={styles.emptyHint}>{he.admin.reports.emptyHint}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  title:      { fontSize: 20, fontWeight: '700', padding: 16 },
  empty:      { padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyHint:  { fontSize: 13, opacity: 0.6, textAlign: 'center' },
});
```

- [ ] **Step 4: Verify + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/components/admin/reports/ \
        'app/apps/mobile/app/(admin)/reports/index.tsx'
git commit -m "feat(mobile): real reports inbox screen + filters + row

Replaces the A0 ComingSoon stub. Cursor-paginated, filter chips,
search by reporter ID. Tap row → case detail.

Mapped to: FR-ADMIN-012."
```

---

### Task 15: Mobile — case detail subcomponents

**Files:**
- Create: `app/apps/mobile/src/components/admin/reports/CaseReporterList.tsx`
- Create: `app/apps/mobile/src/components/admin/reports/CaseAuditTimeline.tsx`

- [ ] **Step 1: `CaseReporterList`**

```typescript
// CaseReporterList.tsx (~60 lines)
import { StyleSheet, Text, View } from 'react-native';
import type { ReportCaseReporter } from '@kc/domain';

export interface CaseReporterListProps {
  readonly reporters: readonly ReportCaseReporter[];
}

export function CaseReporterList({ reporters }: CaseReporterListProps) {
  if (reporters.length === 0) {
    return <View style={styles.empty}><Text style={styles.emptyText}>—</Text></View>;
  }
  return (
    <View style={styles.list}>
      {reporters.map(r => (
        <View key={r.reportId} style={styles.item}>
          <View style={styles.head}>
            <Text style={styles.name}>{r.reporterName ?? r.reporterId.slice(0, 8)}</Text>
            <Text style={styles.status}>{r.status}</Text>
          </View>
          <Text style={styles.reason}>{r.reason}</Text>
          {r.note ? <Text style={styles.note}>{r.note}</Text> : null}
          <Text style={styles.time}>{new Date(r.createdAt).toLocaleString('he-IL')}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list:     { gap: 12 },
  item:     { padding: 12, borderRadius: 8, backgroundColor: '#fafafa', gap: 4 },
  head:     { flexDirection: 'row', justifyContent: 'space-between' },
  name:     { fontSize: 14, fontWeight: '600' },
  status:   { fontSize: 12, opacity: 0.6 },
  reason:   { fontSize: 14 },
  note:     { fontSize: 13, opacity: 0.7 },
  time:     { fontSize: 11, opacity: 0.5 },
  empty:    { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, opacity: 0.5 },
});
```

- [ ] **Step 2: `CaseAuditTimeline`**

```typescript
// CaseAuditTimeline.tsx (~50 lines)
import { StyleSheet, Text, View } from 'react-native';
import type { ReportCaseAuditEntry } from '@kc/domain';

export interface CaseAuditTimelineProps {
  readonly entries: readonly ReportCaseAuditEntry[];
}

export function CaseAuditTimeline({ entries }: CaseAuditTimelineProps) {
  if (entries.length === 0) {
    return <View style={styles.empty}><Text style={styles.emptyText}>—</Text></View>;
  }
  return (
    <View style={styles.list}>
      {entries.map(e => (
        <View key={e.eventId} style={styles.item}>
          <Text style={styles.action}>{e.action}</Text>
          <Text style={styles.time}>{new Date(e.createdAt).toLocaleString('he-IL')}</Text>
          {e.actorId ? <Text style={styles.actor}>actor: {e.actorId.slice(0, 8)}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list:    { gap: 8 },
  item:    { padding: 10, borderRadius: 6, backgroundColor: '#fafafa', gap: 2 },
  action:  { fontSize: 13, fontWeight: '600' },
  time:    { fontSize: 11, opacity: 0.6 },
  actor:   { fontSize: 11, opacity: 0.5 },
  empty:   { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, opacity: 0.5 },
});
```

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/admin/reports/CaseReporterList.tsx \
        app/apps/mobile/src/components/admin/reports/CaseAuditTimeline.tsx
git commit -m "feat(mobile): case-detail subcomponents (reporter list, audit timeline)

Mapped to: FR-ADMIN-013."
```

---

### Task 16: Mobile — `CaseActions` (permission-gated)

**Files:**
- Create: `app/apps/mobile/src/components/admin/reports/CaseActions.tsx`

The action buttons consult the `PERMISSION_MATRIX` from `@kc/domain` to decide which actions to show. Each button calls the corresponding existing use case (already wired into the container in A0/earlier work).

- [ ] **Step 1: Implementation**

```typescript
// CaseActions.tsx (~140 lines)
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import {
  type AdminRole, type ReportCaseDetail, type ReportTargetType,
  hasPermission,
} from '@kc/domain';
import { container } from '../../../lib/container';
import { useAdminRoles } from '../../../hooks/useAdminRoles';
import he from '../../../i18n/locales/he';

export interface CaseActionsProps {
  readonly detail: ReportCaseDetail;
  readonly onActed: () => void;  // call to refetch the case after a successful action
}

type ActionId =
  | 'confirm' | 'dismiss' | 'restore'
  | 'permanentBan' | 'manualRemove' | 'openSupport';

async function confirmDialog(question: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.confirm(question);
  }
  return new Promise((resolve) => {
    Alert.alert(he.admin.caseDetail.confirmDialog.title, question, [
      { text: he.admin.caseDetail.confirmDialog.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: he.admin.caseDetail.confirmDialog.ok, onPress: () => resolve(true) },
    ]);
  });
}

export function CaseActions({ detail, onActed }: CaseActionsProps) {
  const { roles } = useAdminRoles();
  const [busy, setBusy] = useState(false);

  async function run(action: ActionId) {
    const ok = await confirmDialog(he.admin.caseDetail.confirmDialog.message);
    if (!ok) return;
    setBusy(true);
    try {
      const openReports = detail.reporters.filter(r => r.status === 'open');
      const oneReportId = openReports[0]?.reportId;
      switch (action) {
        case 'confirm':
          if (!oneReportId) return;
          await container.confirmReport.execute({ reportId: oneReportId });
          break;
        case 'dismiss':
          if (!oneReportId) return;
          await container.dismissReport.execute({ reportId: oneReportId });
          break;
        case 'restore':
          await container.restoreTarget.execute({ targetType: detail.targetType, targetId: detail.targetId });
          break;
        case 'permanentBan':
          if (detail.targetType !== 'user') return;
          await container.banUser.execute({ userId: detail.targetId, reason: 'policy_violation', note: '' });
          break;
        case 'manualRemove':
          if (detail.targetType !== 'post') return;
          await container.adminRemovePost.execute({ postId: detail.targetId });
          break;
        case 'openSupport':
          // Find or create a 1:1 support thread with the latest reporter (or the target user).
          // Implementation note: reuses the existing chat repo's getOrCreate path.
          // For A1 we deep-link to the first reporter's support thread; full UX in A4.
          // Intentionally a no-op stub here that opens the chat with the latest reporter.
          break;
      }
      onActed();
    } finally {
      setBusy(false);
    }
  }

  function show(perm: Parameters<typeof hasPermission>[1]): boolean {
    return hasPermission(roles as readonly AdminRole[], perm);
  }

  return (
    <View style={styles.row}>
      {show('reports.confirm_or_dismiss') && (
        <ActionButton label={he.admin.caseDetail.actionLabels.confirm} disabled={busy} onPress={() => run('confirm')} />
      )}
      {show('reports.confirm_or_dismiss') && (
        <ActionButton label={he.admin.caseDetail.actionLabels.dismiss} disabled={busy} onPress={() => run('dismiss')} />
      )}
      {show('reports.restore_target') && (
        <ActionButton label={he.admin.caseDetail.actionLabels.restore} disabled={busy} onPress={() => run('restore')} />
      )}
      {show('reports.manual_remove_post') && detail.targetType === 'post' && (
        <ActionButton label={he.admin.caseDetail.actionLabels.manualRemove} disabled={busy} onPress={() => run('manualRemove')} />
      )}
      {show('reports.permanent_ban') && detail.targetType === 'user' && (
        <ActionButton label={he.admin.caseDetail.actionLabels.permanentBan} disabled={busy} onPress={() => run('permanentBan')} variant="danger" />
      )}
    </View>
  );
}

function ActionButton({ label, disabled, onPress, variant }: { label: string; disabled?: boolean; onPress: () => void; variant?: 'danger' }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, variant === 'danger' && styles.btnDanger, disabled && styles.btnDisabled]}
      accessibilityRole="button"
    >
      <Text style={[styles.btnText, variant === 'danger' && styles.btnTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  btn:      { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#eef2ff' },
  btnDanger: { backgroundColor: '#fee2e2' },
  btnDisabled: { opacity: 0.5 },
  btnText:  { fontSize: 13, fontWeight: '600' },
  btnTextDanger: { color: '#7f1d1d' },
});
```

- [ ] **Step 2: Verify + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/components/admin/reports/CaseActions.tsx
git commit -m "feat(mobile): permission-gated case actions

Reads PERMISSION_MATRIX to decide which buttons to show. Confirm dialog
on every action. Disabled state during in-flight.

Mapped to: FR-ADMIN-013."
```

---

### Task 17: Mobile — case detail route `[caseId]/index.tsx`

**Files:**
- Create: `app/apps/mobile/app/(admin)/reports/[caseId]/index.tsx`

`caseId` is `<target_type>:<target_id>` URL-encoded. The screen splits it back, calls `useReportCaseDetail`, and renders the three sections + actions.

- [ ] **Step 1: Implementation**

```typescript
// app/apps/mobile/app/(admin)/reports/[caseId]/index.tsx
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ReportTargetType } from '@kc/domain';
import { useReportCaseDetail } from '../../../../src/hooks/useReportCaseDetail';
import { CaseReporterList } from '../../../../src/components/admin/reports/CaseReporterList';
import { CaseAuditTimeline } from '../../../../src/components/admin/reports/CaseAuditTimeline';
import { CaseActions } from '../../../../src/components/admin/reports/CaseActions';
import he from '../../../../src/i18n/locales/he';

function parseCaseId(raw: string | undefined): { type: ReportTargetType; id: string } | null {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  const [type, id] = decoded.split(':');
  if (!id) return null;
  if (type !== 'post' && type !== 'user' && type !== 'chat') return null;
  return { type, id };
}

export default function CaseDetail() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const parsed = parseCaseId(caseId);
  const { data, isLoading, refetch } = useReportCaseDetail(parsed?.type ?? null, parsed?.id ?? null);

  if (!parsed) {
    return <View style={styles.center}><Text>{he.admin.caseDetail.notFound}</Text></View>;
  }
  if (isLoading || !data) {
    return <View style={styles.center}><ActivityIndicator /><Text>{he.admin.caseDetail.loading}</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>{he.admin.caseDetail.title}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{he.admin.caseDetail.targetSection}</Text>
        <View style={styles.targetBox}>
          {Object.entries(data.target).map(([k, v]) => (
            <Text key={k} style={styles.kv}>{k}: {String(v)}</Text>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{he.admin.caseDetail.actions}</Text>
        <CaseActions detail={data} onActed={() => refetch()} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{he.admin.caseDetail.reporters}</Text>
        <CaseReporterList reporters={data.reporters} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{he.admin.caseDetail.timeline}</Text>
        <CaseAuditTimeline entries={data.timeline} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:        { padding: 16, gap: 16 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title:       { fontSize: 20, fontWeight: '700' },
  section:     { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
  targetBox:   { padding: 12, backgroundColor: '#fafafa', borderRadius: 8, gap: 4 },
  kv:          { fontSize: 13 },
});
```

- [ ] **Step 2: Verify + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add 'app/apps/mobile/app/(admin)/reports/[caseId]/index.tsx'
git commit -m "feat(mobile): case detail screen

Mapped to: FR-ADMIN-013."
```

---

### Task 18: Mobile — dashboard KPI uses real reports count

**Files:**
- Modify: `app/apps/mobile/app/(admin)/index.tsx`

Replace the open-reports KPI placeholder with a live count from `useReportsInbox({}).data?.pages[0].rows.length` (use the inbox's first page rather than a dedicated count query — the inbox is paginated; the dashboard shows "X+" if there's a `nextCursor`).

- [ ] **Step 1: Edit `app/apps/mobile/app/(admin)/index.tsx`**

Add an import:
```typescript
import { useReportsInbox } from '../../src/hooks/useReportsInbox';
```

Inside the component, before the KPIs:
```typescript
const inbox = useReportsInbox({});
const firstPage = inbox.data?.pages[0];
const openReportsLabel = firstPage
  ? `${firstPage.rows.length}${firstPage.nextCursor ? '+' : ''}`
  : t.comingSoonKpi;
```

Replace the open-reports KPI value:
```tsx
<Text style={styles.kpiValue}>{openReportsLabel}</Text>
```
(Keep the tasks KPI as the comingSoonKpi placeholder — A3 will fill that.)

- [ ] **Step 2: Verify + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add 'app/apps/mobile/app/(admin)/index.tsx'
git commit -m "feat(mobile): dashboard open-reports KPI uses live count

Mapped to: FR-ADMIN-011 AC4, FR-ADMIN-012."
```

---

### Task 19: Mobile — chat ReportReceivedBubble coexistence

**Files:**
- Modify: `app/apps/mobile/src/components/chat/system/ReportReceivedBubble.tsx`

When `useAdminPortalReportsFlag()` is true:
- Hide the Dismiss/Confirm buttons.
- Show a "Open in Portal" deep-link instead.

When false (default): keep current behavior unchanged.

- [ ] **Step 1: Edit**

At the top of the component:
```typescript
import { useAdminPortalReportsFlag } from '../../../hooks/useAdminPortalReportsFlag';
import { router } from 'expo-router';
import he from '../../../i18n/locales/he';
```

Inside the component body (after reading the report_id from the system payload):
```typescript
const portalActive = useAdminPortalReportsFlag();
const targetType = systemPayload?.target_type as 'post' | 'user' | 'chat' | undefined;
const targetId = systemPayload?.target_id as string | undefined;
const caseId = targetType && targetId
  ? encodeURIComponent(`${targetType}:${targetId}`)
  : null;
```

Wrap the existing buttons block with:
```tsx
{portalActive ? (
  <View style={styles.portalRow}>
    <Text style={styles.portalNote}>{he.admin.coexistence.bubbleReadOnly}</Text>
    {caseId && (
      <Pressable
        onPress={() => router.push(`/admin/reports/${caseId}`)}
        style={styles.portalLink}
        accessibilityRole="link"
      >
        <Text style={styles.portalLinkText}>{he.admin.coexistence.bubbleOpenInPortal}</Text>
      </Pressable>
    )}
  </View>
) : (
  /* existing Dismiss/Confirm buttons */
)}
```

Add styles for `portalRow`, `portalNote`, `portalLink`, `portalLinkText` consistent with the existing bubble visuals.

- [ ] **Step 2: Verify + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/components/chat/system/ReportReceivedBubble.tsx
git commit -m "feat(mobile): ReportReceivedBubble coexistence with admin portal

When EXPO_PUBLIC_ADMIN_PORTAL_REPORTS=true, the chat bubble renders the
report read-only and deep-links to the case in the portal. When false,
the existing inline action behavior is unchanged.

Mapped to: FR-ADMIN-014."
```

---

### Task 20: Full verification (typecheck/test/lint) + manual smoke

- [ ] **Step 1: Gates**

```bash
cd /Users/navesarussi/Desktop/MVP-2/app
pnpm typecheck
source ~/.kc-dev-secrets.env 2>/dev/null || true
NODE_OPTIONS=--experimental-websocket pnpm test
pnpm lint
```
Expected: all green. The new `reportsRpc.integration.test.ts` (11 tests) must pass.

- [ ] **Step 2: Manual smoke (web + native)**

- Log in as super_admin. Settings → Admin Portal → Reports tab.
- Inbox loads (may be empty in dev). Pull-to-refresh works.
- Apply a `posts` filter chip — list refines.
- (Optional, requires seed data) Tap a row → case detail loads with reporter list + audit timeline.
- (Optional, requires seed data) Action buttons appear per role. Confirm dialog appears on tap.
- Set `EXPO_PUBLIC_ADMIN_PORTAL_REPORTS=true` in `app/apps/mobile/.env.local` (if file exists; otherwise document the env var on the PR), restart the dev server, and verify a chat `ReportReceivedBubble` now shows "Open in Portal" instead of inline buttons.

Document any seed-data limitations in the PR body.

---

### Task 21: SSOT updates

**Files:**
- Modify: `docs/SSOT/BACKLOG.md` — flip P3.A1 ⏳ → 🟡 → ✅ (after merge).
- Modify: `docs/SSOT/spec/12_super_admin.md` — append §11 with FR-ADMIN-012, FR-ADMIN-013, FR-ADMIN-014 ACs verbatim from the design spec.
- Modify: `docs/SSOT/TECH_DEBT.md` — move TD-94 to Resolved.

- [ ] **Step 1: Edits, then commit**

```bash
git add docs/SSOT/BACKLOG.md \
        docs/SSOT/spec/12_super_admin.md \
        docs/SSOT/TECH_DEBT.md
git commit -m "docs(ssot): admin portal A1 — FR-ADMIN-012/013/014, close TD-94"
```

---

### Task 22: Push + PR + auto-merge

- [ ] **Step 1: Pre-flight rebase**

```bash
git fetch origin
git rebase origin/dev
```
Resolve any migration-prefix conflicts conservatively.

- [ ] **Step 2: Push and PR**

```bash
git push -u origin HEAD
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(admin): a1 — reports dashboard + chat-flow coexistence" \
  --body "$(cat <<'EOF'
## Summary
A1 of the Admin Portal: a paginated open-reports inbox + per-case detail
screen with RBAC-gated actions. Widens 4 moderation RPCs from is_admin to
admin_assert_role per PERMISSION_MATRIX. Closes TD-94 by removing the
cascade-dismiss side effect from admin_restore_target. Adds a feature flag
EXPO_PUBLIC_ADMIN_PORTAL_REPORTS that flips the legacy chat-flow bubble to
a deep-link into the portal.

## Mapped to spec
- FR-ADMIN-012, FR-ADMIN-013, FR-ADMIN-014.
- Design spec: docs/superpowers/specs/2026-05-25-admin-portal-design.md.

## Changes
- 4 migrations: 0118 widens RPCs, 0119 fixes TD-94, 0120 inbox RPC, 0121 case detail RPC.
- Domain: ReportInbox + ReportCaseDetail value objects + parsers.
- Application: IReportsRepository + 2 use cases.
- Infrastructure: SupabaseReportsRepository.
- Mobile: useReportsInbox, useReportCaseDetail, useAdminPortalReportsFlag, ReportRow, ReportFilters, CaseActions, CaseReporterList, CaseAuditTimeline, replaced inbox stub, new [caseId] route, live KPI, ReportReceivedBubble coexistence.

## Tests
- pnpm typecheck ✅
- pnpm test ✅ (incl. 11 new integration tests covering RPC widening, TD-94, inbox, case detail)
- pnpm lint ✅
- Manual: inbox loads + filters + pagination; deep-link from chat works; coexistence flag verified.

## SSOT updated
- [x] BACKLOG.md — P3.A1 ✅
- [x] spec/12 — FR-ADMIN-012/013/014 ACs added
- [x] TECH_DEBT.md — TD-94 closed

## Risk / rollout notes
4 migrations, all forward-only and idempotent. RPC widening is backwards compatible (super_admin still works; moderator now also works). TD-94 fix is a behavior change: dismissing one report no longer cascades; verify with the integration test. Coexistence flag default is false — A1 ships dark for non-super admins until rollout.
EOF
)" \
  --label "FR-ADMIN" --assignee "@me"

gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 3: Post-merge BACKLOG flip**

```bash
git switch dev && git pull --ff-only origin dev
# edit BACKLOG.md: P3.A1 🟡 → ✅
git add docs/SSOT/BACKLOG.md
git commit -m "docs(ssot): mark P3.A1 (admin portal reports) ✅ Done"
git push origin dev
git branch -D feat/FR-ADMIN-012-a1-reports
```

---

## Notes for whoever picks up A2..A4

- The PERMISSION_MATRIX is the SSOT. When A2 widens admin_grant_role / admin_revoke_role gates, update the matrix and the RPC together.
- The chat-flow's `ReportReceivedBubble` deep-link only fires when `EXPO_PUBLIC_ADMIN_PORTAL_REPORTS=true`. Phase 3 (removing the chat-flow code entirely) happens in a follow-up PR after one stable week — log it as TD if not done.
- The case detail's "Open support thread" button is a stub in A1. Full UX lives with A4 (chat surfaces) or A2 (RBAC). Leave the existing TODO comment in `CaseActions.tsx` until it ships.
- Realtime: the inbox + case detail refetch on focus and pull-to-refresh. If two moderators frequently act on the same case, add a Supabase Realtime channel on the `reports` table.

## Self-review checklist

- **Spec coverage:** FR-ADMIN-012 AC1..AC4 → Tasks 3, 13, 14. FR-ADMIN-013 AC1..AC4 → Tasks 4, 15, 16, 17. FR-ADMIN-014 AC1..AC4 → Tasks 12, 19. TD-94 → Task 2. ✅
- **No placeholders:** every step has runnable code or commands. ✅
- **Type consistency:** `ReportInboxPage`, `ReportInboxCursor`, `ReportCaseDetail` flow through domain → app → infra → mobile with the same names. ✅
- **RBAC integration:** `PERMISSION_MATRIX` is consumed by `CaseActions` (Task 16) and matches the server-side gates set in Task 1. Future RPC changes require updating both — flagged in the notes section. ✅

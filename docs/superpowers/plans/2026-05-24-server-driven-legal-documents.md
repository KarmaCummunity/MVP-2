# Server-Driven Legal Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static `/legal` screen with a server-driven, two-document model (Terms of Service + Privacy Policy) editable from Supabase Studio, with mandatory re-acknowledgement on material changes and per-version consent logging for GDPR/ILITA compliance.

**Architecture:** New Postgres tables (`legal_documents`, `legal_document_versions`, `user_legal_acceptances`) plus three RPCs (`publish_legal_document`, `accept_legal_document`, `needs_legal_reacknowledgement`) drive a Markdown renderer on mobile. Three UI surfaces share one renderer: Settings entries, post-OAuth consent screen, and a material-update gate. The 7-day standard→critical promotion is computed server-side; the client never makes "should-block" decisions locally.

**Tech Stack:** Postgres 15 + pgcrypto (SHA-256), Supabase RPC + RLS, TypeScript (`packages/domain`, `packages/application`, `packages/infrastructure-supabase`), React Native + expo-router (`apps/mobile`), `react-native-markdown-display`, AsyncStorage cache, Vitest for unit tests, `supabase test db` for RLS smoke tests.

**Spec:** `docs/superpowers/specs/2026-05-24-server-driven-legal-documents-design.md`
**Mapped to spec:** `FR-SETTINGS-010` (rewrite), `FR-AUTH-002` (new AC). Closes TD-80. Backlog P2.18.

**Repository layout note:** the monorepo lives under `app/` at the repo root (per `CLAUDE.md` §11). All `apps/mobile/...` and `packages/...` paths in this plan are rooted at `app/`. Supabase migrations live at the repo root in `supabase/migrations/`.

---

## Phase 0 — Branch + scaffolding

### Task 0: Create working branch

**Files:** none (git only)

- [ ] **Step 1: Sync `dev` and branch off**

```bash
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feat/FR-SETTINGS-010-server-driven-legal-docs
```

- [ ] **Step 2: Flip BACKLOG to In progress**

Edit `docs/SSOT/BACKLOG.md`: locate the `P2.18` row and change its status from `⏳ Planned` to `🟡 In progress`. Do not change the row content yet — final ✅ flip happens in Task 28.

- [ ] **Step 3: Commit the status flip**

```bash
git add docs/SSOT/BACKLOG.md
git commit -m "chore(ssot): flip P2.18 legal-docs to in-progress"
```

---

## Phase 1 — Database migration (single file, single transaction)

All of Phase 1 lands in **one migration file**: `supabase/migrations/0108_legal_documents_and_consent.sql`. We build it incrementally across Tasks 1–6 but only execute it against the dev DB at the end of Task 7. Each task appends to the same file; commit after each task so the file's evolution is reviewable.

### Task 1: Migration scaffold — extensions, enum, tables

**Files:**
- Create: `supabase/migrations/0108_legal_documents_and_consent.sql`

- [ ] **Step 1: Create the migration file with extensions, enum, and the three tables**

Write `supabase/migrations/0108_legal_documents_and_consent.sql`:

```sql
-- 0108_legal_documents_and_consent.sql
-- Spec: docs/superpowers/specs/2026-05-24-server-driven-legal-documents-design.md
-- Replaces the static /legal screen with a server-driven two-document model
-- (Terms of Service + Privacy Policy), captures per-version consent for
-- GDPR Art. 7 / Israeli Privacy Protection Law audit-readiness.

begin;

-- pgcrypto provides digest() for SHA-256 content_hash computation.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enum: legal_doc_type
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'legal_doc_type') then
    create type public.legal_doc_type as enum ('terms', 'privacy');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Table: legal_documents (current pointer, two rows total)
-- ---------------------------------------------------------------------------
create table if not exists public.legal_documents (
  id                       uuid primary key default gen_random_uuid(),
  doc_type                 public.legal_doc_type not null unique,
  current_version          int not null default 1,
  current_effective_date   timestamptz not null,
  last_material_version    int not null default 1,
  last_material_severity   text null,
  updated_at               timestamptz not null default now(),
  constraint legal_documents_last_material_severity_chk
    check (last_material_severity is null or last_material_severity in ('standard', 'critical'))
);

comment on table public.legal_documents is
  'Current-pointer table for legal documents. Exactly two rows: one per doc_type.';

-- ---------------------------------------------------------------------------
-- Table: legal_document_versions (immutable history, append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.legal_document_versions (
  id              uuid primary key default gen_random_uuid(),
  doc_type        public.legal_doc_type not null,
  version         int not null,
  language        text not null default 'he',
  effective_date  timestamptz not null,
  body_md         text not null,
  content_hash    text not null default '',  -- filled by BEFORE INSERT trigger
  severity        text not null,
  change_summary  text null,
  published_by    uuid not null references auth.users(id),
  published_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  constraint legal_document_versions_unique unique (doc_type, version),
  constraint legal_document_versions_severity_chk
    check (severity in ('minor', 'standard', 'critical')),
  constraint legal_document_versions_summary_required_for_material
    check (severity = 'minor' or (change_summary is not null and length(trim(change_summary)) > 0))
);

comment on table public.legal_document_versions is
  'Append-only history of every legal document publish. Immutability enforced by trigger.';

-- ---------------------------------------------------------------------------
-- Table: user_legal_acceptances (append-only event log)
-- ---------------------------------------------------------------------------
create table if not exists public.user_legal_acceptances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  doc_type     public.legal_doc_type not null,
  version      int not null,
  accepted_at  timestamptz not null default now(),
  ip_inet      inet null,
  user_agent   text null,
  locale       text null,
  constraint user_legal_acceptances_version_fk
    foreign key (doc_type, version)
    references public.legal_document_versions (doc_type, version)
);

comment on table public.user_legal_acceptances is
  'Append-only event log. One row per acceptance event per user per doc_type. GDPR Art. 7(1).';

commit;
```

- [ ] **Step 2: Verify the file parses (syntax-only check) by dry-running against the dev DB**

```bash
# from repo root
psql "$KC_DEV_DB_URL" --single-transaction --set ON_ERROR_STOP=on -c "begin; \i supabase/migrations/0108_legal_documents_and_consent.sql; rollback;"
```

`$KC_DEV_DB_URL` is sourced from `~/.kc-dev-secrets.env` (per `CLAUDE.md` §13). Expected: `ROLLBACK` with no errors. The migration is wrapped in its own `begin/commit`, but the outer `begin/rollback` keeps the schema untouched.

If you do not have `psql` access, skip this step and verify in Task 7 instead.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0108_legal_documents_and_consent.sql
git commit -m "feat(infra): scaffold legal docs tables and enum (FR-SETTINGS-010)"
```

---

### Task 2: Triggers (content_hash + append-only enforcement)

**Files:**
- Modify: `supabase/migrations/0108_legal_documents_and_consent.sql`

- [ ] **Step 1: Append triggers to the migration**

Add this block **before the final `commit;`** in `supabase/migrations/0108_legal_documents_and_consent.sql`:

```sql
-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- BEFORE INSERT: compute SHA-256 of body_md into content_hash.
create or replace function public.legal_document_versions_set_content_hash()
returns trigger
language plpgsql
as $$
begin
  new.content_hash := encode(digest(new.body_md, 'sha256'), 'hex');
  return new;
end;
$$;

drop trigger if exists legal_document_versions_content_hash_trg on public.legal_document_versions;
create trigger legal_document_versions_content_hash_trg
before insert on public.legal_document_versions
for each row execute function public.legal_document_versions_set_content_hash();

-- BEFORE UPDATE OR DELETE: block. legal_document_versions is append-only.
create or replace function public.legal_document_versions_block_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'legal_document_versions is append-only';
end;
$$;

drop trigger if exists legal_document_versions_immutable_trg on public.legal_document_versions;
create trigger legal_document_versions_immutable_trg
before update or delete on public.legal_document_versions
for each row execute function public.legal_document_versions_block_mutation();

-- BEFORE UPDATE OR DELETE: block. user_legal_acceptances is append-only.
create or replace function public.user_legal_acceptances_block_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'user_legal_acceptances is append-only';
end;
$$;

drop trigger if exists user_legal_acceptances_immutable_trg on public.user_legal_acceptances;
create trigger user_legal_acceptances_immutable_trg
before update or delete on public.user_legal_acceptances
for each row execute function public.user_legal_acceptances_block_mutation();
```

- [ ] **Step 2: Re-verify with dry-run**

```bash
psql "$KC_DEV_DB_URL" --single-transaction --set ON_ERROR_STOP=on -c "begin; \i supabase/migrations/0108_legal_documents_and_consent.sql; rollback;"
```

Expected: `ROLLBACK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0108_legal_documents_and_consent.sql
git commit -m "feat(infra): add content_hash + append-only triggers for legal docs"
```

---

### Task 3: Indexes + view

**Files:**
- Modify: `supabase/migrations/0108_legal_documents_and_consent.sql`

- [ ] **Step 1: Append indexes and the latest-acceptance view**

Add **before the final `commit;`**:

```sql
-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists legal_document_versions_latest_idx
  on public.legal_document_versions (doc_type, version desc);

-- Partial index for diagnostic queries on material publishes.
-- (Hot-path gate query uses denormalized last_material_version, not this index.)
create index if not exists legal_document_versions_material_idx
  on public.legal_document_versions (doc_type, version)
  where severity in ('standard', 'critical');

create index if not exists user_legal_acceptances_latest_idx
  on public.user_legal_acceptances (user_id, doc_type, accepted_at desc);

-- ---------------------------------------------------------------------------
-- View: user_legal_acceptances_latest
-- ---------------------------------------------------------------------------
create or replace view public.user_legal_acceptances_latest as
select distinct on (user_id, doc_type)
  user_id, doc_type, version, accepted_at
from public.user_legal_acceptances
order by user_id, doc_type, accepted_at desc;

comment on view public.user_legal_acceptances_latest is
  'Most recent acceptance per (user_id, doc_type). Used by needs_legal_reacknowledgement.';
```

- [ ] **Step 2: Re-verify**

```bash
psql "$KC_DEV_DB_URL" --single-transaction --set ON_ERROR_STOP=on -c "begin; \i supabase/migrations/0108_legal_documents_and_consent.sql; rollback;"
```

Expected: `ROLLBACK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0108_legal_documents_and_consent.sql
git commit -m "feat(infra): add indexes and latest-acceptance view for legal docs"
```

---

### Task 4: RLS + grants

**Files:**
- Modify: `supabase/migrations/0108_legal_documents_and_consent.sql`

- [ ] **Step 1: Append RLS and grants**

Add **before the final `commit;`**:

```sql
-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------

alter table public.legal_documents          enable row level security;
alter table public.legal_document_versions  enable row level security;
alter table public.user_legal_acceptances   enable row level security;

-- Documents: any authenticated user can read; nobody writes directly.
drop policy if exists legal_documents_select_authenticated on public.legal_documents;
create policy legal_documents_select_authenticated
  on public.legal_documents
  for select to authenticated
  using (true);

drop policy if exists legal_document_versions_select_authenticated on public.legal_document_versions;
create policy legal_document_versions_select_authenticated
  on public.legal_document_versions
  for select to authenticated
  using (true);

revoke all on public.legal_documents          from anon, authenticated;
revoke all on public.legal_document_versions  from anon, authenticated;
grant select on public.legal_documents          to authenticated;
grant select on public.legal_document_versions  to authenticated;

-- Acceptances: a user can read & insert only their own rows.
-- UPDATE/DELETE blocked by the append-only trigger (RLS alone is insufficient
-- because the insert RPC runs SECURITY DEFINER).
drop policy if exists user_legal_acceptances_select_self on public.user_legal_acceptances;
create policy user_legal_acceptances_select_self
  on public.user_legal_acceptances
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_legal_acceptances_insert_self on public.user_legal_acceptances;
create policy user_legal_acceptances_insert_self
  on public.user_legal_acceptances
  for insert to authenticated
  with check (auth.uid() = user_id);

revoke all on public.user_legal_acceptances from anon, authenticated;
grant select, insert on public.user_legal_acceptances to authenticated;

-- The view inherits the underlying table's RLS (security_invoker by default
-- in PG15+). Be explicit:
alter view public.user_legal_acceptances_latest set (security_invoker = true);
grant select on public.user_legal_acceptances_latest to authenticated;
```

- [ ] **Step 2: Re-verify**

```bash
psql "$KC_DEV_DB_URL" --single-transaction --set ON_ERROR_STOP=on -c "begin; \i supabase/migrations/0108_legal_documents_and_consent.sql; rollback;"
```

Expected: `ROLLBACK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0108_legal_documents_and_consent.sql
git commit -m "feat(infra): RLS + grants for legal_documents and acceptances"
```

---

### Task 5: RPCs (publish, accept, needs_reacknowledgement)

**Files:**
- Modify: `supabase/migrations/0108_legal_documents_and_consent.sql`

- [ ] **Step 1: Append the three RPCs**

Add **before the final `commit;`**:

```sql
-- ---------------------------------------------------------------------------
-- RPC: publish_legal_document (super-admin only, SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.publish_legal_document(
  p_doc_type        public.legal_doc_type,
  p_body_md         text,
  p_severity        text,
  p_change_summary  text,
  p_effective_date  timestamptz
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new_version int;
  v_hash        text;
begin
  -- 1. Auth + role
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- 2. Severity validation
  if p_severity not in ('minor', 'standard', 'critical') then
    raise exception 'severity must be one of minor|standard|critical' using errcode = '22023';
  end if;

  -- 3. change_summary required for non-minor
  if p_severity <> 'minor' and (p_change_summary is null or length(trim(p_change_summary)) = 0) then
    raise exception 'change_summary required for non-minor severity' using errcode = '22023';
  end if;

  -- 4. effective_date in the future or now
  if p_effective_date < now() then
    raise exception 'effective_date must be in the future or now' using errcode = '22023';
  end if;

  -- 5. critical must publish immediately (within 1 hour)
  if p_severity = 'critical' and p_effective_date > now() + interval '1 hour' then
    raise exception 'critical severity must be effective immediately (within 1 hour)' using errcode = '22023';
  end if;

  -- 6. Compute next version per doc_type
  select current_version + 1 into v_new_version
    from public.legal_documents
   where doc_type = p_doc_type
   for update;
  if v_new_version is null then
    raise exception 'unknown doc_type %', p_doc_type using errcode = '22023';
  end if;

  -- 7. Insert immutable version row (trigger computes content_hash)
  insert into public.legal_document_versions (
    doc_type, version, language, effective_date, body_md, severity, change_summary, published_by
  ) values (
    p_doc_type, v_new_version, 'he', p_effective_date, p_body_md, p_severity, p_change_summary, auth.uid()
  )
  returning content_hash into v_hash;

  -- 8. Update current pointer; bump last_material_* only on material severities
  update public.legal_documents
     set current_version          = v_new_version,
         current_effective_date   = p_effective_date,
         updated_at               = now(),
         last_material_version    = case
                                      when p_severity in ('standard','critical') then v_new_version
                                      else last_material_version
                                    end,
         last_material_severity   = case
                                      when p_severity in ('standard','critical') then p_severity
                                      else last_material_severity
                                    end
   where doc_type = p_doc_type;

  return json_build_object(
    'version', v_new_version,
    'effective_date', p_effective_date,
    'content_hash', v_hash
  );
end;
$$;

revoke all on function public.publish_legal_document(public.legal_doc_type, text, text, text, timestamptz) from public, anon;
grant execute on function public.publish_legal_document(public.legal_doc_type, text, text, text, timestamptz) to authenticated;

comment on function public.publish_legal_document is
  'Super-admin only. Publishes a new version of a legal document; bumps last_material_* on standard|critical severity.';


-- ---------------------------------------------------------------------------
-- RPC: accept_legal_document (any authenticated user, SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.accept_legal_document(
  p_doc_type    public.legal_doc_type,
  p_version     int,
  p_locale      text,
  p_user_agent  text
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid          uuid := auth.uid();
  v_last_material int;
  v_current      int;
  v_id           uuid;
  v_ts           timestamptz;
  v_ua_trim      text;
begin
  if v_uid is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  -- Atomic read of last_material_version + current_version
  select last_material_version, current_version
    into v_last_material, v_current
    from public.legal_documents
   where doc_type = p_doc_type;

  if v_last_material is null then
    raise exception 'unknown doc_type %', p_doc_type using errcode = '22023';
  end if;

  -- Acceptance must satisfy the gate: at least the latest material version,
  -- and not beyond the current published version.
  if p_version < v_last_material or p_version > v_current then
    raise exception 'accepted version % must be in [%, %]', p_version, v_last_material, v_current
      using errcode = '22023';
  end if;

  v_ua_trim := case
    when p_user_agent is null then null
    else substring(p_user_agent for 500)
  end;

  insert into public.user_legal_acceptances (
    user_id, doc_type, version, ip_inet, user_agent, locale
  ) values (
    v_uid, p_doc_type, p_version, inet_client_addr(), v_ua_trim, p_locale
  )
  returning id, accepted_at into v_id, v_ts;

  return json_build_object('acceptance_id', v_id, 'accepted_at', v_ts);
end;
$$;

revoke all on function public.accept_legal_document(public.legal_doc_type, int, text, text) from public, anon;
grant execute on function public.accept_legal_document(public.legal_doc_type, int, text, text) to authenticated;

comment on function public.accept_legal_document is
  'Logs a per-version legal-document acceptance for auth.uid(). Enforces version >= last_material_version.';


-- ---------------------------------------------------------------------------
-- RPC: needs_legal_reacknowledgement (any authenticated user, SECURITY INVOKER)
-- ---------------------------------------------------------------------------
create or replace function public.needs_legal_reacknowledgement()
returns table (
  doc_type                public.legal_doc_type,
  current_version         int,
  current_effective_date  timestamptz,
  last_material_version   int,
  last_material_severity  text,
  last_accepted_version   int,
  block_mode              text
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    ld.doc_type,
    ld.current_version,
    ld.current_effective_date,
    ld.last_material_version,
    ld.last_material_severity,
    coalesce(ula.version, 0) as last_accepted_version,
    case
      when ld.last_material_severity = 'critical' then 'modal'
      when ld.last_material_severity = 'standard'
           and (now() - ld.current_effective_date) >= interval '7 days' then 'modal'
      else 'banner'
    end as block_mode
  from public.legal_documents ld
  left join public.user_legal_acceptances_latest ula
    on ula.doc_type = ld.doc_type
   and ula.user_id  = auth.uid()
  where
    auth.uid() is not null
    and ld.current_effective_date <= now()
    and coalesce(ula.version, 0) < ld.last_material_version;
$$;

revoke all on function public.needs_legal_reacknowledgement() from public, anon;
grant execute on function public.needs_legal_reacknowledgement() to authenticated;

comment on function public.needs_legal_reacknowledgement is
  'Returns one row per doc_type where auth.uid() owes re-acknowledgement. block_mode (banner|modal) is computed server-side from severity and the database clock.';
```

- [ ] **Step 2: Re-verify**

```bash
psql "$KC_DEV_DB_URL" --single-transaction --set ON_ERROR_STOP=on -c "begin; \i supabase/migrations/0108_legal_documents_and_consent.sql; rollback;"
```

Expected: `ROLLBACK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0108_legal_documents_and_consent.sql
git commit -m "feat(infra): RPCs for publish/accept/needs-reacknowledgement"
```

---

### Task 6: Seed v1 content + current pointers

**Files:**
- Modify: `supabase/migrations/0108_legal_documents_and_consent.sql`

This task seeds the two v1 documents and sets `last_material_*` so existing users go through the 7-day soft-grace flow on next foreground (per spec §8).

- [ ] **Step 1: Append seed inserts**

Add **before the final `commit;`**. Keep the Hebrew Markdown short here — the placeholders `{{LEGAL_ENTITY_NAME}}`, `{{CONTACT_EMAIL}}`, `{{CONTACT_ADDRESS}}` (see spec §10) stay as literal placeholders in the seed; PM fills them in via a `minor` publish before launch.

```sql
-- ---------------------------------------------------------------------------
-- Seed: v1 of both documents (severity='standard' so existing users see the
-- 7-day soft-grace flow on next foreground — see spec §8).
-- ---------------------------------------------------------------------------

-- We need a "system" published_by uuid. Use the first super-admin if any
-- exists; otherwise fail loudly so the operator can pre-provision one.
do $$
declare
  v_admin uuid;
begin
  select user_id into v_admin
    from public.users
   where is_super_admin = true
   order by created_at asc
   limit 1;

  if v_admin is null then
    raise exception 'no super-admin found; pre-provision one before applying 0108';
  end if;

  -- Idempotent inserts: re-running the migration on a partially applied state succeeds.
  insert into public.legal_document_versions (
    doc_type, version, language, effective_date, body_md, severity, change_summary, published_by
  )
  values (
    'terms', 1, 'he', now(),
    $md$# תנאי שימוש

**1. מי אנחנו ומה האפליקציה**
{{LEGAL_ENTITY_NAME}} מפעילה את אפליקציית "קהילת קארמה" — מרחב חברתי לנתינה. ניתן לפנות אלינו ב-{{CONTACT_EMAIL}}.

**2. תנאי שימוש כחוזה מחייב**
עצם השימוש באפליקציה מהווה אישור לתנאים אלה.

**3. גיל מינימום (13+)**
האפליקציה מיועדת לבני 13 ומעלה. נשמור לעצמנו את הזכות להסיר חשבונות של משתמשים שמתחת לגיל.

**4. חשבון משתמש**
שמור על סודיות הסיסמה. אין להתחזות, אין לנהל יותר מחשבון אחד.

**5. תוכן שמשתמשים מעלים**
התוכן נשאר בבעלותך; אתה מעניק לנו רישיון להציג, לשמור ולהפיץ אותו כחלק מהשירות. אתה אחראי לחוקיות התוכן.

**6. שימוש אסור**
ספאם, הטעיה, הסתה, הטרדה, חשיפת פרטים אישיים של אחרים, פוסטים מסחריים, וניסיונות פריצה — אסורים.

**7. מודרציה**
אנחנו רשאים להסיר תוכן ולהשעות חשבונות לפי שיקול דעתנו. ניתן לערער דרך "דווח על בעיה".

**8. השירות As-Is**
השירות מסופק "כמות שהוא"; אין התחייבות לזמינות, לדיוק תוכן או להצלחת עסקאות. אנחנו לא צד לעסקאות בין משתמשים.

**9. הגבלת אחריות**
בכפוף לחוק, אחריותנו מוגבלת לסכום סמלי (ברירת מחדל: 0 ש"ח לשירות חינמי).

**10. שינויים בתנאים**
ייתכן שנעדכן את התנאים מעת לעת. שינוי מהותי = הודעה בתוך האפליקציה ובקשה לאישור מחודש.

**11. דין וסמכות שיפוט**
הדין הישראלי חל; סמכות שיפוט בלעדית לבתי המשפט המוסמכים בתל אביב-יפו.

**12. יצירת קשר**
{{CONTACT_EMAIL}} · {{CONTACT_ADDRESS}}
$md$,
    'standard',
    $cs$- העברנו את תנאי השימוש ומדיניות הפרטיות לפורמט חי שמתעדכן ישירות בלי צורך בעדכון של האפליקציה.
- התוכן עצמו לא השתנה מהותית מהגרסה הקודמת שהוצגה במסך ההגדרות.
- אנא קרא ואשר תוך 7 ימים כדי להמשיך להשתמש באפליקציה.$cs$,
    v_admin
  )
  on conflict (doc_type, version) do nothing;

  insert into public.legal_document_versions (
    doc_type, version, language, effective_date, body_md, severity, change_summary, published_by
  )
  values (
    'privacy', 1, 'he', now(),
    $md$# מדיניות פרטיות

**1. מי בעל הבקרה על המידע**
{{LEGAL_ENTITY_NAME}}. ליצירת קשר: {{CONTACT_EMAIL}}.

**2. איזה מידע אנחנו אוספים**
- שמסרת: שם, עיר, ביוגרפיה, אווטר, טלפון/אימייל (לאימות), פוסטים, הודעות.
- שנאסף אוטומטית: סוג מכשיר, גרסת אפליקציה, IP, לוגים תפעוליים, אירועי הסכמה משפטיים.

**3. למה אנחנו צריכים את המידע**
תפעול השירות, אבטחה, מודרציה, תמיכה, סטטיסטיקות אגרגטיביות.

**4. הבסיס החוקי**
הסכמה; אינטרס לגיטימי (אבטחה, מניעת ספאם); חובה חוקית (תגובה לדרישת רשויות מוסמכות).

**5. שיתוף עם צדדים שלישיים (sub-processors)**
- **Supabase, Inc.** (US/EU regions) — אחסון מסד נתונים, אימות, אחסון קבצים, Realtime.
- **Google LLC / Apple Inc.** — לאימות SSO בלבד; מקבלים display name, email, avatar.
- **Expo / EAS** — לשליחת push notifications.

אין מכירת מידע. אין שימוש פרסומי. אין tracking של גורמי צד שלישי.

**6. העברה לחו"ל**
חלק מהמידע מאוחסן בשרתי Supabase מחוץ לישראל; ההעברה בכפוף ל-EU Standard Contractual Clauses.

**7. זמן שמירה**
תוכן פעיל: כל עוד החשבון פעיל. תוכן שהוסר על-ידי מודרציה: 90 יום ואז מחיקה. חשבון מחוק: 30 יום ואז מחיקה קשה.

**8. זכויותיך**
גישה, תיקון, מחיקה, ניידות (data export — JSON תוך 30 יום דרך "דווח על בעיה" → קטגוריה Privacy), ביטול הסכמה (מחיקת חשבון).

**9. קטינים (13-18)**
שירות מגיל 13. הורים שמעוניינים שחשבון של ילדם יוסר יכולים לפנות באמצעות "דווח על בעיה" → קטגוריה Privacy.

**10. אבטחה**
TLS בתעבורה, הצפנה במנוחה אצל Supabase, RLS על כל הטבלאות. אין אחריות מוחלטת.

**11. שינויים במדיניות**
שינוי מהותי = חובת אישור מחדש.

**12. תלונות וערעורים**
פנייה אלינו ב-{{CONTACT_EMAIL}}; זכות פנייה לרשות להגנת הפרטיות בישראל (https://www.gov.il/he/departments/the_privacy_protection_authority).
$md$,
    'standard',
    $cs$- העברנו את תנאי השימוש ומדיניות הפרטיות לפורמט חי שמתעדכן ישירות בלי צורך בעדכון של האפליקציה.
- התוכן עצמו לא השתנה מהותית מהגרסה הקודמת שהוצגה במסך ההגדרות.
- אנא קרא ואשר תוך 7 ימים כדי להמשיך להשתמש באפליקציה.$cs$,
    v_admin
  )
  on conflict (doc_type, version) do nothing;
end$$;

-- Current-pointer rows. last_material_* mirrors v1 so existing users
-- enter the 7-day soft-grace flow (block_mode='banner' until day 7).
insert into public.legal_documents (doc_type, current_version, current_effective_date, last_material_version, last_material_severity)
values
  ('terms',   1, now(), 1, 'standard'),
  ('privacy', 1, now(), 1, 'standard')
on conflict (doc_type) do nothing;
```

- [ ] **Step 2: Re-verify the migration parses**

```bash
psql "$KC_DEV_DB_URL" --single-transaction --set ON_ERROR_STOP=on -c "begin; \i supabase/migrations/0108_legal_documents_and_consent.sql; rollback;"
```

Expected: `ROLLBACK` (no errors). If you see "no super-admin found", you need to pre-provision one row in `public.users` with `is_super_admin = true` against the dev DB — talk to the PM before continuing.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0108_legal_documents_and_consent.sql
git commit -m "feat(infra): seed v1 Hebrew content for terms and privacy"
```

---

### Task 7: Apply the migration to dev DB

**Files:** none (DB only)

- [ ] **Step 1: Apply the migration**

Use the Supabase MCP `apply_migration` tool (or the Supabase CLI) against the **dev** project `roeefqpdbftlndzsvhfj`. **Do not run this against production.**

Using CLI:

```bash
supabase db push --linked --include-all
# or, more targeted:
psql "$KC_DEV_DB_URL" -f supabase/migrations/0108_legal_documents_and_consent.sql
```

Expected output: `COMMIT` with no errors.

- [ ] **Step 2: Smoke-check the new schema**

```bash
psql "$KC_DEV_DB_URL" -c "select doc_type, current_version, last_material_version, last_material_severity from public.legal_documents;"
psql "$KC_DEV_DB_URL" -c "select doc_type, version, severity, length(body_md) as md_len, content_hash from public.legal_document_versions order by doc_type, version;"
```

Expected:
- Two rows in `legal_documents` (`terms`, `privacy`), both `current_version=1`, `last_material_version=1`, `last_material_severity='standard'`.
- Two rows in `legal_document_versions`, both `severity='standard'`, both with non-empty `content_hash` (64 hex chars).

- [ ] **Step 3: Smoke-check RPCs as an authenticated user**

Get any authenticated user's `auth.uid()` via the dev console, then in a `psql` session set `request.jwt.claim.sub` to that uuid and call:

```sql
select * from public.needs_legal_reacknowledgement();
```

Expected: two rows (`terms` + `privacy`), each with `block_mode='banner'`, `last_accepted_version=0`.

- [ ] **Step 4: Generate updated Supabase types**

The TypeScript types in `app/packages/infrastructure-supabase/src/database.types.ts` need to know about the new tables, view, and RPCs. Regenerate via Supabase MCP `generate_typescript_types` or:

```bash
supabase gen types typescript --linked > app/packages/infrastructure-supabase/src/database.types.ts
```

- [ ] **Step 5: Commit the regenerated types**

```bash
git add app/packages/infrastructure-supabase/src/database.types.ts
git commit -m "chore(infra): regenerate Supabase types after 0108 migration"
```

---

### Task 8: RLS smoke tests (supabase test db)

**Files:**
- Create: `supabase/tests/legal_documents_rls_test.sql`

- [ ] **Step 1: Write the RLS test file**

Create `supabase/tests/legal_documents_rls_test.sql`:

```sql
-- supabase test db smoke tests for 0108_legal_documents_and_consent.sql.
-- Mapped to spec §12 RLS smoke tests.

begin;
select plan(8);

-- Set up two test users: one regular, one super-admin.
-- (Adjust per your supabase test db helper convention; the project's
-- existing tests in supabase/tests/ should set the pattern.)
do $$
declare
  v_regular uuid;
  v_admin   uuid;
begin
  insert into auth.users (id, email) values (gen_random_uuid(), 'regular@test.com')
    returning id into v_regular;
  insert into public.users (user_id, share_handle, is_super_admin) values (v_regular, 'regular', false);

  insert into auth.users (id, email) values (gen_random_uuid(), 'admin@test.com')
    returning id into v_admin;
  insert into public.users (user_id, share_handle, is_super_admin) values (v_admin, 'admin', true);

  perform set_config('test.regular_uid', v_regular::text, false);
  perform set_config('test.admin_uid',   v_admin::text,   false);
end$$;

-- 1. Anon cannot SELECT legal_documents.
set local role anon;
select is_empty(
  'select * from public.legal_documents',
  'anon cannot read legal_documents'
);

-- 2. Authenticated user can SELECT legal_documents.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.regular_uid'), true);
select isnt_empty(
  'select * from public.legal_documents',
  'authenticated user can read legal_documents'
);

-- 3. Authenticated user can SELECT their own acceptances only.
select set_config('request.jwt.claim.sub', current_setting('test.regular_uid'), true);
insert into public.user_legal_acceptances (user_id, doc_type, version)
  values (current_setting('test.regular_uid')::uuid, 'terms', 1);

select set_config('request.jwt.claim.sub', current_setting('test.admin_uid'), true);
select is_empty(
  format(
    'select * from public.user_legal_acceptances where user_id = %L',
    current_setting('test.regular_uid')
  ),
  'user cannot read another user''s acceptances'
);

-- 4. Authenticated user cannot INSERT acceptance for another user.
select set_config('request.jwt.claim.sub', current_setting('test.regular_uid'), true);
select throws_ok(
  format(
    'insert into public.user_legal_acceptances (user_id, doc_type, version) values (%L, %L, 1)',
    current_setting('test.admin_uid'),
    'terms'
  ),
  '42501',
  null,
  'user cannot insert acceptance with foreign user_id'
);

-- 5. UPDATE on legal_document_versions is blocked by trigger.
set local role postgres;  -- even as owner, trigger fires
select throws_ok(
  'update public.legal_document_versions set body_md = ''hacked'' where version = 1',
  null,
  'legal_document_versions is append-only',
  'update legal_document_versions blocked by trigger'
);

-- 6. DELETE on user_legal_acceptances is blocked by trigger.
select throws_ok(
  'delete from public.user_legal_acceptances where doc_type = ''terms''',
  null,
  'user_legal_acceptances is append-only',
  'delete user_legal_acceptances blocked by trigger'
);

-- 7. publish_legal_document rejects non-admin.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.regular_uid'), true);
select throws_ok(
  $$select public.publish_legal_document('terms', 'body', 'minor', null, now())$$,
  '42501',
  null,
  'publish_legal_document rejects non-admin'
);

-- 8. publish_legal_document accepts admin.
select set_config('request.jwt.claim.sub', current_setting('test.admin_uid'), true);
select lives_ok(
  $$select public.publish_legal_document('terms', '# new terms', 'minor', null, now())$$,
  'publish_legal_document accepts admin'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run the tests against the dev DB**

```bash
supabase test db --linked
```

Expected: 8 tests passing. If your project doesn't have `supabase test db` wired up, run the file manually:

```bash
psql "$KC_DEV_DB_URL" -f supabase/tests/legal_documents_rls_test.sql
```

and verify each `is_empty` / `throws_ok` line behaves as commented.

- [ ] **Step 3: Commit**

```bash
git add supabase/tests/legal_documents_rls_test.sql
git commit -m "test(infra): RLS smoke tests for legal docs and acceptances"
```

---

## Phase 2 — Domain layer

### Task 9: Domain types + pure policy function + tests

**Files:**
- Create: `app/packages/domain/src/legal.ts`
- Create: `app/packages/domain/src/__tests__/legal.test.ts`
- Modify: `app/packages/domain/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `app/packages/domain/src/__tests__/legal.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { shouldBlockImmediately, type LegalPendingItem } from '../legal';

const base = (overrides: Partial<LegalPendingItem> = {}): LegalPendingItem => ({
  docType: 'terms',
  currentVersion: 2,
  currentEffectiveDate: new Date(),
  lastAcceptedVersion: 1,
  severity: 'standard',
  blockMode: 'banner',
  ...overrides,
});

describe('shouldBlockImmediately', () => {
  it('returns false when the pending list is empty', () => {
    expect(shouldBlockImmediately([])).toBe(false);
  });

  it('returns false when every item is in banner mode', () => {
    expect(
      shouldBlockImmediately([
        base({ docType: 'terms', blockMode: 'banner' }),
        base({ docType: 'privacy', blockMode: 'banner' }),
      ]),
    ).toBe(false);
  });

  it('returns true when any item is in modal mode', () => {
    expect(
      shouldBlockImmediately([
        base({ docType: 'terms', blockMode: 'banner' }),
        base({ docType: 'privacy', blockMode: 'modal', severity: 'critical' }),
      ]),
    ).toBe(true);
  });

  it('returns true when all items are in modal mode', () => {
    expect(
      shouldBlockImmediately([
        base({ docType: 'terms', blockMode: 'modal' }),
        base({ docType: 'privacy', blockMode: 'modal' }),
      ]),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd app && pnpm --filter @kc/domain test -- legal
```

Expected: FAIL with "Cannot find module '../legal'".

- [ ] **Step 3: Implement the domain module**

Create `app/packages/domain/src/legal.ts`:

```ts
export type LegalDocType = 'terms' | 'privacy';
export type LegalSeverity = 'minor' | 'standard' | 'critical';
export type LegalBlockMode = 'banner' | 'modal';

export interface LegalDocument {
  readonly docType: LegalDocType;
  readonly currentVersion: number;
  readonly currentEffectiveDate: Date;
  readonly lastMaterialVersion: number;
  readonly lastMaterialSeverity: LegalSeverity | null;
}

export interface LegalDocumentContent {
  readonly docType: LegalDocType;
  readonly version: number;
  readonly effectiveDate: Date;
  readonly bodyMd: string;
  readonly contentHash: string;
  readonly severity: LegalSeverity;
  readonly changeSummary: string | null;
  readonly publishedAt: Date;
}

export interface LegalPendingItem {
  readonly docType: LegalDocType;
  readonly currentVersion: number;
  readonly currentEffectiveDate: Date;
  readonly lastAcceptedVersion: number; // 0 if never accepted
  readonly severity: LegalSeverity;     // 'standard' | 'critical' in practice
  readonly blockMode: LegalBlockMode;
}

/**
 * True if any pending item requires immediate blocking. Source of truth for
 * blockMode is the server (needs_legal_reacknowledgement); the client never
 * derives it from local time.
 */
export function shouldBlockImmediately(pending: LegalPendingItem[]): boolean {
  return pending.some((p) => p.blockMode === 'modal');
}
```

- [ ] **Step 4: Wire the barrel export**

Edit `app/packages/domain/src/index.ts`. Append:

```ts
export * from './legal';
```

- [ ] **Step 5: Run the test to confirm it passes**

```bash
cd app && pnpm --filter @kc/domain test -- legal
```

Expected: 4 tests passing.

- [ ] **Step 6: Run typecheck**

```bash
cd app && pnpm --filter @kc/domain typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/packages/domain/src/legal.ts app/packages/domain/src/__tests__/legal.test.ts app/packages/domain/src/index.ts
git commit -m "feat(domain): legal document types and shouldBlockImmediately policy"
```

---

## Phase 3 — Application layer

### Task 10: Repository port

**Files:**
- Create: `app/packages/application/src/ports/ILegalDocumentRepository.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Define the port**

Create `app/packages/application/src/ports/ILegalDocumentRepository.ts`:

```ts
import type {
  LegalDocType,
  LegalDocumentContent,
  LegalPendingItem,
} from '@kc/domain';

export interface AcceptLegalDocumentInput {
  readonly docType: LegalDocType;
  readonly version: number;
  readonly locale: string;
  readonly userAgent: string;
}

export interface AcceptLegalDocumentResult {
  readonly acceptanceId: string;
  readonly acceptedAt: Date;
}

export interface ILegalDocumentRepository {
  /**
   * Loads the current (published, in-effect) version of the document.
   * Implementations should cache and return cached content on network failure.
   */
  getCurrentContent(docType: LegalDocType): Promise<LegalDocumentContent>;

  /**
   * Returns pending items for `auth.uid()`. Server uses the JWT's sub claim
   * — no client-side user id is passed (privacy hole closed in spec §5).
   */
  getPendingForCurrentUser(): Promise<LegalPendingItem[]>;

  /**
   * Logs an acceptance. Server validates version >= last_material_version.
   */
  acceptVersion(input: AcceptLegalDocumentInput): Promise<AcceptLegalDocumentResult>;
}
```

- [ ] **Step 2: Barrel export**

Edit `app/packages/application/src/index.ts`. Append:

```ts
export * from './ports/ILegalDocumentRepository';
```

- [ ] **Step 3: Typecheck**

```bash
cd app && pnpm --filter @kc/application typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/packages/application/src/ports/ILegalDocumentRepository.ts app/packages/application/src/index.ts
git commit -m "feat(application): ILegalDocumentRepository port"
```

---

### Task 11: LoadLegalDocumentUseCase + test

**Files:**
- Create: `app/packages/application/src/legal/LoadLegalDocumentUseCase.ts`
- Create: `app/packages/application/src/legal/__tests__/LoadLegalDocumentUseCase.test.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `app/packages/application/src/legal/__tests__/LoadLegalDocumentUseCase.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { LoadLegalDocumentUseCase } from '../LoadLegalDocumentUseCase';
import type { ILegalDocumentRepository } from '../../ports/ILegalDocumentRepository';
import type { LegalDocumentContent } from '@kc/domain';

const sample: LegalDocumentContent = {
  docType: 'terms',
  version: 3,
  effectiveDate: new Date('2026-05-24T00:00:00Z'),
  bodyMd: '# Terms',
  contentHash: 'abc123',
  severity: 'standard',
  changeSummary: '- thing 1',
  publishedAt: new Date('2026-05-24T00:00:00Z'),
};

const fakeRepo = (impl: Partial<ILegalDocumentRepository>): ILegalDocumentRepository => ({
  getCurrentContent: vi.fn(),
  getPendingForCurrentUser: vi.fn(),
  acceptVersion: vi.fn(),
  ...impl,
});

describe('LoadLegalDocumentUseCase', () => {
  it('returns content for the requested doc type', async () => {
    const repo = fakeRepo({ getCurrentContent: vi.fn().mockResolvedValue(sample) });
    const useCase = new LoadLegalDocumentUseCase(repo);

    const result = await useCase.execute({ docType: 'terms' });

    expect(result).toEqual(sample);
    expect(repo.getCurrentContent).toHaveBeenCalledWith('terms');
  });

  it('propagates repository errors unchanged', async () => {
    const err = new Error('network');
    const repo = fakeRepo({ getCurrentContent: vi.fn().mockRejectedValue(err) });
    const useCase = new LoadLegalDocumentUseCase(repo);

    await expect(useCase.execute({ docType: 'privacy' })).rejects.toBe(err);
  });
});
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
cd app && pnpm --filter @kc/application test -- LoadLegalDocumentUseCase
```

Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Implement the use case**

Create `app/packages/application/src/legal/LoadLegalDocumentUseCase.ts`:

```ts
import type { LegalDocType, LegalDocumentContent } from '@kc/domain';
import type { ILegalDocumentRepository } from '../ports/ILegalDocumentRepository';

export interface LoadLegalDocumentInput {
  readonly docType: LegalDocType;
}

export class LoadLegalDocumentUseCase {
  constructor(private readonly repo: ILegalDocumentRepository) {}

  execute(input: LoadLegalDocumentInput): Promise<LegalDocumentContent> {
    return this.repo.getCurrentContent(input.docType);
  }
}
```

- [ ] **Step 4: Barrel export**

Edit `app/packages/application/src/index.ts`. Append:

```ts
export * from './legal/LoadLegalDocumentUseCase';
```

- [ ] **Step 5: Run tests**

```bash
cd app && pnpm --filter @kc/application test -- LoadLegalDocumentUseCase
```

Expected: 2 tests passing.

- [ ] **Step 6: Commit**

```bash
git add app/packages/application/src/legal/LoadLegalDocumentUseCase.ts app/packages/application/src/legal/__tests__/LoadLegalDocumentUseCase.test.ts app/packages/application/src/index.ts
git commit -m "feat(application): LoadLegalDocumentUseCase"
```

---

### Task 12: CheckPendingLegalAcksUseCase + test

**Files:**
- Create: `app/packages/application/src/legal/CheckPendingLegalAcksUseCase.ts`
- Create: `app/packages/application/src/legal/__tests__/CheckPendingLegalAcksUseCase.test.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `app/packages/application/src/legal/__tests__/CheckPendingLegalAcksUseCase.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { CheckPendingLegalAcksUseCase } from '../CheckPendingLegalAcksUseCase';
import type { ILegalDocumentRepository } from '../../ports/ILegalDocumentRepository';
import type { LegalPendingItem } from '@kc/domain';

const item = (overrides: Partial<LegalPendingItem> = {}): LegalPendingItem => ({
  docType: 'terms',
  currentVersion: 2,
  currentEffectiveDate: new Date('2026-05-20T00:00:00Z'),
  lastAcceptedVersion: 0,
  severity: 'standard',
  blockMode: 'banner',
  ...overrides,
});

const fakeRepo = (pending: LegalPendingItem[]): ILegalDocumentRepository => ({
  getCurrentContent: vi.fn(),
  getPendingForCurrentUser: vi.fn().mockResolvedValue(pending),
  acceptVersion: vi.fn(),
});

describe('CheckPendingLegalAcksUseCase', () => {
  it('returns an empty result when nothing is pending', async () => {
    const useCase = new CheckPendingLegalAcksUseCase(fakeRepo([]));
    const result = await useCase.execute();
    expect(result.pending).toEqual([]);
    expect(result.mustBlockImmediately).toBe(false);
  });

  it('orders terms before privacy', async () => {
    const useCase = new CheckPendingLegalAcksUseCase(
      fakeRepo([item({ docType: 'privacy' }), item({ docType: 'terms' })]),
    );
    const result = await useCase.execute();
    expect(result.pending.map((p) => p.docType)).toEqual(['terms', 'privacy']);
  });

  it('dedupes by docType, keeping the first occurrence', async () => {
    const useCase = new CheckPendingLegalAcksUseCase(
      fakeRepo([
        item({ docType: 'terms', currentVersion: 2 }),
        item({ docType: 'terms', currentVersion: 99 }), // duplicate; should be dropped
      ]),
    );
    const result = await useCase.execute();
    expect(result.pending).toHaveLength(1);
    expect(result.pending[0].currentVersion).toBe(2);
  });

  it('flags mustBlockImmediately when any item is modal', async () => {
    const useCase = new CheckPendingLegalAcksUseCase(
      fakeRepo([item({ docType: 'terms', blockMode: 'modal' })]),
    );
    const result = await useCase.execute();
    expect(result.mustBlockImmediately).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to confirm failure**

```bash
cd app && pnpm --filter @kc/application test -- CheckPendingLegalAcksUseCase
```

Expected: FAIL.

- [ ] **Step 3: Implement the use case**

Create `app/packages/application/src/legal/CheckPendingLegalAcksUseCase.ts`:

```ts
import { shouldBlockImmediately, type LegalDocType, type LegalPendingItem } from '@kc/domain';
import type { ILegalDocumentRepository } from '../ports/ILegalDocumentRepository';

export interface CheckPendingLegalAcksResult {
  readonly pending: readonly LegalPendingItem[];
  readonly mustBlockImmediately: boolean;
}

const ORDER: Record<LegalDocType, number> = { terms: 0, privacy: 1 };

export class CheckPendingLegalAcksUseCase {
  constructor(private readonly repo: ILegalDocumentRepository) {}

  async execute(): Promise<CheckPendingLegalAcksResult> {
    const raw = await this.repo.getPendingForCurrentUser();

    // Dedupe by docType, keep first.
    const seen = new Set<LegalDocType>();
    const deduped: LegalPendingItem[] = [];
    for (const item of raw) {
      if (seen.has(item.docType)) continue;
      seen.add(item.docType);
      deduped.push(item);
    }

    // Stable sort: terms before privacy.
    deduped.sort((a, b) => ORDER[a.docType] - ORDER[b.docType]);

    return {
      pending: deduped,
      mustBlockImmediately: shouldBlockImmediately(deduped),
    };
  }
}
```

- [ ] **Step 4: Barrel export**

Edit `app/packages/application/src/index.ts`. Append:

```ts
export * from './legal/CheckPendingLegalAcksUseCase';
```

- [ ] **Step 5: Run tests**

```bash
cd app && pnpm --filter @kc/application test -- CheckPendingLegalAcksUseCase
```

Expected: 4 tests passing.

- [ ] **Step 6: Commit**

```bash
git add app/packages/application/src/legal/CheckPendingLegalAcksUseCase.ts app/packages/application/src/legal/__tests__/CheckPendingLegalAcksUseCase.test.ts app/packages/application/src/index.ts
git commit -m "feat(application): CheckPendingLegalAcksUseCase with dedupe and ordering"
```

---

### Task 13: AcceptLegalDocumentUseCase + test

**Files:**
- Create: `app/packages/application/src/legal/AcceptLegalDocumentUseCase.ts`
- Create: `app/packages/application/src/legal/__tests__/AcceptLegalDocumentUseCase.test.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `app/packages/application/src/legal/__tests__/AcceptLegalDocumentUseCase.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { AcceptLegalDocumentUseCase } from '../AcceptLegalDocumentUseCase';
import type { ILegalDocumentRepository } from '../../ports/ILegalDocumentRepository';

const fakeRepo = (impl: Partial<ILegalDocumentRepository>): ILegalDocumentRepository => ({
  getCurrentContent: vi.fn(),
  getPendingForCurrentUser: vi.fn(),
  acceptVersion: vi.fn(),
  ...impl,
});

describe('AcceptLegalDocumentUseCase', () => {
  it('accepts and returns the acceptance id + timestamp', async () => {
    const ts = new Date('2026-05-24T10:00:00Z');
    const repo = fakeRepo({
      acceptVersion: vi.fn().mockResolvedValue({ acceptanceId: 'a1', acceptedAt: ts }),
    });
    const useCase = new AcceptLegalDocumentUseCase(repo);

    const result = await useCase.execute({
      docType: 'terms',
      version: 3,
      locale: 'he',
      userAgent: 'iOS 17 / Expo',
    });

    expect(result).toEqual({ acceptanceId: 'a1', acceptedAt: ts });
    expect(repo.acceptVersion).toHaveBeenCalledWith({
      docType: 'terms',
      version: 3,
      locale: 'he',
      userAgent: 'iOS 17 / Expo',
    });
  });

  it('truncates user agent to 500 chars before calling the repo', async () => {
    const repo = fakeRepo({
      acceptVersion: vi.fn().mockResolvedValue({ acceptanceId: 'a1', acceptedAt: new Date() }),
    });
    const useCase = new AcceptLegalDocumentUseCase(repo);

    const longUA = 'A'.repeat(1000);
    await useCase.execute({ docType: 'privacy', version: 1, locale: 'he', userAgent: longUA });

    const calledWith = (repo.acceptVersion as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(calledWith.userAgent.length).toBe(500);
  });

  it('propagates repo failure', async () => {
    const err = new Error('rpc rejected');
    const repo = fakeRepo({ acceptVersion: vi.fn().mockRejectedValue(err) });
    const useCase = new AcceptLegalDocumentUseCase(repo);

    await expect(
      useCase.execute({ docType: 'terms', version: 1, locale: 'he', userAgent: 'ua' }),
    ).rejects.toBe(err);
  });
});
```

- [ ] **Step 2: Run failing test**

```bash
cd app && pnpm --filter @kc/application test -- AcceptLegalDocumentUseCase
```

Expected: FAIL.

- [ ] **Step 3: Implement the use case**

Create `app/packages/application/src/legal/AcceptLegalDocumentUseCase.ts`:

```ts
import type { LegalDocType } from '@kc/domain';
import type {
  AcceptLegalDocumentResult,
  ILegalDocumentRepository,
} from '../ports/ILegalDocumentRepository';

const MAX_USER_AGENT_LEN = 500;

export interface AcceptLegalDocumentInput {
  readonly docType: LegalDocType;
  readonly version: number;
  readonly locale: string;
  readonly userAgent: string;
}

export class AcceptLegalDocumentUseCase {
  constructor(private readonly repo: ILegalDocumentRepository) {}

  execute(input: AcceptLegalDocumentInput): Promise<AcceptLegalDocumentResult> {
    return this.repo.acceptVersion({
      docType: input.docType,
      version: input.version,
      locale: input.locale,
      userAgent: input.userAgent.slice(0, MAX_USER_AGENT_LEN),
    });
  }
}
```

- [ ] **Step 4: Barrel export**

Edit `app/packages/application/src/index.ts`. Append:

```ts
export * from './legal/AcceptLegalDocumentUseCase';
```

- [ ] **Step 5: Run tests**

```bash
cd app && pnpm --filter @kc/application test -- AcceptLegalDocumentUseCase
```

Expected: 3 tests passing.

- [ ] **Step 6: Typecheck the package**

```bash
cd app && pnpm --filter @kc/application typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/packages/application/src/legal/AcceptLegalDocumentUseCase.ts app/packages/application/src/legal/__tests__/AcceptLegalDocumentUseCase.test.ts app/packages/application/src/index.ts
git commit -m "feat(application): AcceptLegalDocumentUseCase with UA truncation"
```

---

## Phase 4 — Infrastructure layer (Supabase adapter)

### Task 14: SupabaseLegalDocumentRepository + tests

**Files:**
- Create: `app/packages/infrastructure-supabase/src/legal/SupabaseLegalDocumentRepository.ts`
- Create: `app/packages/infrastructure-supabase/src/legal/legalCache.ts`
- Create: `app/packages/infrastructure-supabase/src/__tests__/SupabaseLegalDocumentRepository.test.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts`

- [ ] **Step 1: Write the cache helper (in-memory abstraction, AsyncStorage injected)**

Create `app/packages/infrastructure-supabase/src/legal/legalCache.ts`:

```ts
import type { LegalDocType, LegalDocumentContent } from '@kc/domain';

export interface AsyncKVStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const CACHE_KEY_PREFIX = 'legal:';

function cacheKey(docType: LegalDocType, version: number, contentHash: string): string {
  return `${CACHE_KEY_PREFIX}${docType}:v${version}:${contentHash}`;
}

function pointerKey(docType: LegalDocType): string {
  return `${CACHE_KEY_PREFIX}${docType}:pointer`;
}

interface SerializedContent {
  docType: LegalDocType;
  version: number;
  effectiveDateIso: string;
  bodyMd: string;
  contentHash: string;
  severity: LegalDocumentContent['severity'];
  changeSummary: string | null;
  publishedAtIso: string;
}

function serialize(c: LegalDocumentContent): SerializedContent {
  return {
    docType: c.docType,
    version: c.version,
    effectiveDateIso: c.effectiveDate.toISOString(),
    bodyMd: c.bodyMd,
    contentHash: c.contentHash,
    severity: c.severity,
    changeSummary: c.changeSummary,
    publishedAtIso: c.publishedAt.toISOString(),
  };
}

function deserialize(s: SerializedContent): LegalDocumentContent {
  return {
    docType: s.docType,
    version: s.version,
    effectiveDate: new Date(s.effectiveDateIso),
    bodyMd: s.bodyMd,
    contentHash: s.contentHash,
    severity: s.severity,
    changeSummary: s.changeSummary,
    publishedAt: new Date(s.publishedAtIso),
  };
}

export class LegalDocumentCache {
  constructor(private readonly storage: AsyncKVStorage) {}

  /**
   * Reads the latest cached content for the given doc_type, regardless of version.
   * Used for instant offline render at boot.
   */
  async readPointer(docType: LegalDocType): Promise<LegalDocumentContent | null> {
    const ptr = await this.storage.getItem(pointerKey(docType));
    if (!ptr) return null;
    const raw = await this.storage.getItem(ptr);
    if (!raw) return null;
    try {
      return deserialize(JSON.parse(raw) as SerializedContent);
    } catch {
      return null;
    }
  }

  /**
   * Reads a specific cached version (used to compare content_hash after a network fetch).
   */
  async read(docType: LegalDocType, version: number, contentHash: string): Promise<LegalDocumentContent | null> {
    const raw = await this.storage.getItem(cacheKey(docType, version, contentHash));
    if (!raw) return null;
    try {
      return deserialize(JSON.parse(raw) as SerializedContent);
    } catch {
      return null;
    }
  }

  async write(content: LegalDocumentContent): Promise<void> {
    const ck = cacheKey(content.docType, content.version, content.contentHash);
    await this.storage.setItem(ck, JSON.stringify(serialize(content)));
    await this.storage.setItem(pointerKey(content.docType), ck);
  }
}
```

- [ ] **Step 2: Write the failing test for the repository**

Create `app/packages/infrastructure-supabase/src/__tests__/SupabaseLegalDocumentRepository.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseLegalDocumentRepository } from '../legal/SupabaseLegalDocumentRepository';
import { LegalDocumentCache, type AsyncKVStorage } from '../legal/legalCache';

function makeMemStorage(): AsyncKVStorage {
  const map = new Map<string, string>();
  return {
    getItem: async (k) => map.get(k) ?? null,
    setItem: async (k, v) => {
      map.set(k, v);
    },
    removeItem: async (k) => {
      map.delete(k);
    },
  };
}

function makeClient(overrides: {
  fromQueryResult?: unknown;
  rpcResults?: Record<string, unknown>;
} = {}): any {
  return {
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(overrides.fromQueryResult ?? { data: null, error: { message: 'not found' } }),
    })),
    rpc: vi.fn().mockImplementation((name: string) => {
      const result = overrides.rpcResults?.[name];
      return Promise.resolve(result ?? { data: null, error: null });
    }),
  };
}

const FRESH_ROW = {
  doc_type: 'terms',
  version: 3,
  effective_date: '2026-05-24T00:00:00.000Z',
  body_md: '# Terms',
  content_hash: 'hash-v3',
  severity: 'standard',
  change_summary: '- bullet',
  published_at: '2026-05-24T00:00:00.000Z',
};

describe('SupabaseLegalDocumentRepository.getCurrentContent', () => {
  let storage: AsyncKVStorage;
  let cache: LegalDocumentCache;

  beforeEach(() => {
    storage = makeMemStorage();
    cache = new LegalDocumentCache(storage);
  });

  it('returns network content and writes to cache when the cache is empty', async () => {
    const client = makeClient({ fromQueryResult: { data: FRESH_ROW, error: null } });
    const repo = new SupabaseLegalDocumentRepository(client, cache);

    const result = await repo.getCurrentContent('terms');

    expect(result.version).toBe(3);
    expect(result.contentHash).toBe('hash-v3');
    // Cache was written
    const cached = await cache.readPointer('terms');
    expect(cached?.contentHash).toBe('hash-v3');
  });

  it('returns cached content on network failure (fall-open)', async () => {
    // Pre-seed the cache.
    await cache.write({
      docType: 'terms',
      version: 2,
      effectiveDate: new Date('2026-05-01T00:00:00Z'),
      bodyMd: '# Old',
      contentHash: 'hash-v2',
      severity: 'minor',
      changeSummary: null,
      publishedAt: new Date('2026-05-01T00:00:00Z'),
    });

    const client = makeClient({ fromQueryResult: { data: null, error: { message: 'offline' } } });
    const repo = new SupabaseLegalDocumentRepository(client, cache);

    const result = await repo.getCurrentContent('terms');
    expect(result.version).toBe(2);
  });

  it('throws when the cache is empty and the network fails', async () => {
    const client = makeClient({ fromQueryResult: { data: null, error: { message: 'offline' } } });
    const repo = new SupabaseLegalDocumentRepository(client, cache);

    await expect(repo.getCurrentContent('terms')).rejects.toThrow();
  });

  it('writes a new cache entry when content_hash differs from cached version', async () => {
    await cache.write({
      docType: 'terms',
      version: 2,
      effectiveDate: new Date('2026-05-01T00:00:00Z'),
      bodyMd: '# Old',
      contentHash: 'hash-v2',
      severity: 'minor',
      changeSummary: null,
      publishedAt: new Date('2026-05-01T00:00:00Z'),
    });

    const client = makeClient({ fromQueryResult: { data: FRESH_ROW, error: null } });
    const repo = new SupabaseLegalDocumentRepository(client, cache);

    const result = await repo.getCurrentContent('terms');
    expect(result.contentHash).toBe('hash-v3');

    const cached = await cache.readPointer('terms');
    expect(cached?.contentHash).toBe('hash-v3');
  });
});

describe('SupabaseLegalDocumentRepository.getPendingForCurrentUser', () => {
  it('maps RPC rows to LegalPendingItem domain shape', async () => {
    const client = makeClient({
      rpcResults: {
        needs_legal_reacknowledgement: {
          data: [
            {
              doc_type: 'terms',
              current_version: 2,
              current_effective_date: '2026-05-20T00:00:00.000Z',
              last_material_version: 2,
              last_material_severity: 'standard',
              last_accepted_version: 0,
              block_mode: 'banner',
            },
          ],
          error: null,
        },
      },
    });
    const repo = new SupabaseLegalDocumentRepository(
      client,
      new LegalDocumentCache(makeMemStorage()),
    );

    const result = await repo.getPendingForCurrentUser();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      docType: 'terms',
      currentVersion: 2,
      currentEffectiveDate: new Date('2026-05-20T00:00:00.000Z'),
      lastAcceptedVersion: 0,
      severity: 'standard',
      blockMode: 'banner',
    });
  });

  it('returns [] when the RPC returns null data', async () => {
    const client = makeClient({
      rpcResults: { needs_legal_reacknowledgement: { data: null, error: null } },
    });
    const repo = new SupabaseLegalDocumentRepository(
      client,
      new LegalDocumentCache(makeMemStorage()),
    );

    const result = await repo.getPendingForCurrentUser();
    expect(result).toEqual([]);
  });

  it('throws when the RPC returns an error', async () => {
    const client = makeClient({
      rpcResults: { needs_legal_reacknowledgement: { data: null, error: { message: 'rpc fail' } } },
    });
    const repo = new SupabaseLegalDocumentRepository(
      client,
      new LegalDocumentCache(makeMemStorage()),
    );

    await expect(repo.getPendingForCurrentUser()).rejects.toThrow();
  });
});

describe('SupabaseLegalDocumentRepository.acceptVersion', () => {
  it('calls accept_legal_document RPC and maps the response', async () => {
    const client = makeClient({
      rpcResults: {
        accept_legal_document: {
          data: { acceptance_id: 'uuid-1', accepted_at: '2026-05-24T12:00:00.000Z' },
          error: null,
        },
      },
    });
    const repo = new SupabaseLegalDocumentRepository(
      client,
      new LegalDocumentCache(makeMemStorage()),
    );

    const result = await repo.acceptVersion({
      docType: 'terms',
      version: 3,
      locale: 'he',
      userAgent: 'iOS 17',
    });

    expect(result).toEqual({
      acceptanceId: 'uuid-1',
      acceptedAt: new Date('2026-05-24T12:00:00.000Z'),
    });
    expect(client.rpc).toHaveBeenCalledWith('accept_legal_document', {
      p_doc_type: 'terms',
      p_version: 3,
      p_locale: 'he',
      p_user_agent: 'iOS 17',
    });
  });

  it('throws when the RPC returns an error', async () => {
    const client = makeClient({
      rpcResults: {
        accept_legal_document: {
          data: null,
          error: { message: 'accepted version 1 must be in [2, 2]' },
        },
      },
    });
    const repo = new SupabaseLegalDocumentRepository(
      client,
      new LegalDocumentCache(makeMemStorage()),
    );

    await expect(
      repo.acceptVersion({ docType: 'terms', version: 1, locale: 'he', userAgent: 'ua' }),
    ).rejects.toThrow(/accepted version/);
  });
});
```

- [ ] **Step 3: Run the failing tests**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabaseLegalDocumentRepository
```

Expected: FAIL ("Cannot find module").

- [ ] **Step 4: Implement the repository**

Create `app/packages/infrastructure-supabase/src/legal/SupabaseLegalDocumentRepository.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LegalDocType,
  LegalDocumentContent,
  LegalPendingItem,
  LegalSeverity,
  LegalBlockMode,
} from '@kc/domain';
import type {
  AcceptLegalDocumentInput,
  AcceptLegalDocumentResult,
  ILegalDocumentRepository,
} from '@kc/application';
import type { Database } from '../database.types';
import { LegalDocumentCache } from './legalCache';

type VersionRow = {
  doc_type: LegalDocType;
  version: number;
  effective_date: string;
  body_md: string;
  content_hash: string;
  severity: LegalSeverity;
  change_summary: string | null;
  published_at: string;
};

type PendingRow = {
  doc_type: LegalDocType;
  current_version: number;
  current_effective_date: string;
  last_material_version: number;
  last_material_severity: LegalSeverity | null;
  last_accepted_version: number;
  block_mode: LegalBlockMode;
};

function mapVersionRow(row: VersionRow): LegalDocumentContent {
  return {
    docType: row.doc_type,
    version: row.version,
    effectiveDate: new Date(row.effective_date),
    bodyMd: row.body_md,
    contentHash: row.content_hash,
    severity: row.severity,
    changeSummary: row.change_summary,
    publishedAt: new Date(row.published_at),
  };
}

function mapPendingRow(row: PendingRow): LegalPendingItem {
  // last_material_severity is guaranteed non-null when the row appears
  // (the gate query only returns rows where last_material_version > 0).
  return {
    docType: row.doc_type,
    currentVersion: row.current_version,
    currentEffectiveDate: new Date(row.current_effective_date),
    lastAcceptedVersion: row.last_accepted_version,
    severity: (row.last_material_severity ?? 'standard') as LegalSeverity,
    blockMode: row.block_mode,
  };
}

export class SupabaseLegalDocumentRepository implements ILegalDocumentRepository {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly cache: LegalDocumentCache,
  ) {}

  async getCurrentContent(docType: LegalDocType): Promise<LegalDocumentContent> {
    try {
      // Use the denormalized current_version pointer on legal_documents
      // and fetch the matching legal_document_versions row in one round-trip
      // via a join. We do it as two reads here for clarity; in practice the
      // hot-path is the cache, so the cost is fine.
      const ptr = await this.client
        .from('legal_documents')
        .select('current_version')
        .eq('doc_type', docType)
        .single();

      if (ptr.error || !ptr.data) {
        return await this.fallbackToCacheOrThrow(docType, ptr.error?.message ?? 'no pointer row');
      }

      const versionQ = await this.client
        .from('legal_document_versions')
        .select('doc_type, version, effective_date, body_md, content_hash, severity, change_summary, published_at')
        .eq('doc_type', docType)
        .eq('version', ptr.data.current_version)
        .single();

      if (versionQ.error || !versionQ.data) {
        return await this.fallbackToCacheOrThrow(docType, versionQ.error?.message ?? 'no version row');
      }

      const fresh = mapVersionRow(versionQ.data as VersionRow);
      await this.cache.write(fresh);
      return fresh;
    } catch (err) {
      return this.fallbackToCacheOrThrow(docType, (err as Error).message);
    }
  }

  private async fallbackToCacheOrThrow(docType: LegalDocType, reason: string): Promise<LegalDocumentContent> {
    const cached = await this.cache.readPointer(docType);
    if (cached) return cached;
    throw new Error(`legal:getCurrentContent failed for ${docType}: ${reason}`);
  }

  async getPendingForCurrentUser(): Promise<LegalPendingItem[]> {
    const { data, error } = await this.client.rpc('needs_legal_reacknowledgement');
    if (error) {
      throw new Error(`legal:getPendingForCurrentUser failed: ${error.message}`);
    }
    if (!data) return [];
    const rows = data as unknown as PendingRow[];
    return rows.map(mapPendingRow);
  }

  async acceptVersion(input: AcceptLegalDocumentInput): Promise<AcceptLegalDocumentResult> {
    const { data, error } = await this.client.rpc('accept_legal_document', {
      p_doc_type: input.docType,
      p_version: input.version,
      p_locale: input.locale,
      p_user_agent: input.userAgent,
    });
    if (error) {
      throw new Error(`legal:acceptVersion failed: ${error.message}`);
    }
    const row = data as unknown as { acceptance_id: string; accepted_at: string };
    return {
      acceptanceId: row.acceptance_id,
      acceptedAt: new Date(row.accepted_at),
    };
  }
}
```

- [ ] **Step 5: Barrel export**

Edit `app/packages/infrastructure-supabase/src/index.ts`. Append:

```ts
export { SupabaseLegalDocumentRepository } from './legal/SupabaseLegalDocumentRepository';
export { LegalDocumentCache, type AsyncKVStorage } from './legal/legalCache';
```

- [ ] **Step 6: Run tests**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase test -- SupabaseLegalDocumentRepository
```

Expected: 10 tests passing.

- [ ] **Step 7: Typecheck**

```bash
cd app && pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: no errors. If you see "property does not exist on type 'Database'" for `legal_documents` or RPCs, ensure Task 7 Step 4 (regenerate types) was done.

- [ ] **Step 8: Commit**

```bash
git add app/packages/infrastructure-supabase/src/legal app/packages/infrastructure-supabase/src/__tests__/SupabaseLegalDocumentRepository.test.ts app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): SupabaseLegalDocumentRepository with offline cache"
```

---

## Phase 5 — Mobile UI

### Task 15: Add `react-native-markdown-display` dependency

**Files:**
- Modify: `app/apps/mobile/package.json`

- [ ] **Step 1: Add the dependency**

From the repo root:

```bash
cd app && pnpm --filter @kc/mobile add react-native-markdown-display@7.0.2
```

(Use whatever the current stable version is at execution time. `7.0.2` is the last published version as of writing.)

- [ ] **Step 2: Verify install**

```bash
cd app && pnpm --filter @kc/mobile exec node -e "console.log(require('react-native-markdown-display/package.json').version)"
```

Expected: prints a version string.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/package.json app/pnpm-lock.yaml
git commit -m "chore(mobile): add react-native-markdown-display dependency"
```

---

### Task 16: i18n keys for legal UX

**Files:**
- Create: `app/apps/mobile/src/i18n/locales/he/modules/legal.ts`
- Modify: `app/apps/mobile/src/i18n/locales/he/modules/settings.ts`
- Modify: `app/apps/mobile/src/i18n/locales/he/index.ts`

All Hebrew strings used by the legal UI live here, not inline (per `CLAUDE.md` §8 R-MVP-Core-4).

- [ ] **Step 1: Create the legal module**

Create `app/apps/mobile/src/i18n/locales/he/modules/legal.ts`:

```ts
export const legal = {
  // Document titles (shown in reader header)
  termsTitle: 'תנאי שימוש',
  privacyTitle: 'מדיניות פרטיות',

  // Reader chrome
  effectiveDate: 'בתוקף מ-{{date}}',
  versionChip: 'גרסה {{version}}',
  futureEffective: 'ייכנס לתוקף ב-{{date}}',
  offlineBanner: 'מציג גרסה שמורה — לא ניתן לעדכן כרגע',
  loadFailed: 'לא הצלחנו לטעון את המסמך. נסה שוב מאוחר יותר.',
  closeReader: 'סגור',

  // Consent screen — signup mode
  signupHeading: 'עוד דבר אחרון לפני שמתחילים — נשמח שתכיר/י את הכללים שלנו.',
  cardOpenFull: 'פתח וקרא במלואו',
  checkboxTerms: 'קראתי ואני מאשר/ת את תנאי השימוש',
  checkboxPrivacy: 'קראתי ואני מאשר/ת את מדיניות הפרטיות',
  signupContinue: 'המשך',
  exitLink: 'אפשר לחזור בהמשך — יציאה',
  exitConfirmTitle: 'להתנתק?',
  exitConfirmBody: 'תאבד/י גישה לפרופיל ולשיחות עד שתחזור/י להיכנס.',
  exitConfirmConfirm: 'התנתק',
  exitConfirmCancel: 'ביטול',

  // Update modes
  updateModalHeading: 'המסמך התעדכן — נדרש אישור',
  updateBannerHeading: 'המסמך התעדכן',
  updateBannerCountdown: 'אישור נדרש תוך {{days}} ימים',
  updateCheckbox: 'קראתי ואני מאשר/ת',
  updateConfirmCta: 'אישור',

  // Bottom sheet (first banner appearance)
  updateSheetOpen: 'פתח לקריאה',
  updateSheetSnooze: 'אזכיר לי בעוד יום',
  updateSheetAccept: 'אישור עכשיו',
};
```

- [ ] **Step 2: Update settings i18n: split the combined row key**

Open `app/apps/mobile/src/i18n/locales/he/modules/settings.ts`. Find the line:

```ts
termsAndPrivacy: 'תנאי שימוש ומדיניות פרטיות',
```

Replace with:

```ts
termsOfService: 'תנאי שימוש',
privacyPolicy: 'מדיניות פרטיות',
```

(Leave the rest of the file unchanged.)

- [ ] **Step 3: Wire the new module + remove inline `legalContent` keys**

Open `app/apps/mobile/src/i18n/locales/he/index.ts`. Two changes:

1. Add the import + spread of the new module. Locate where other modules are imported and spread (e.g. `settings`, `auth`) — mirror that pattern:

```ts
import { legal } from './modules/legal';
```

And in the exported object:

```ts
legal,
```

2. **Remove** the `legalContent` block (the 6 keys: `title`, `lastUpdated`, `termsTitle`, `termsText`, `privacyTitle`, `privacyText`) that the explorer found at lines 70-77. The whole `legalContent` object goes away — those strings will not appear anywhere in the new code.

- [ ] **Step 4: Search for stale references**

```bash
cd app && grep -rn "legalContent\." apps/mobile/src apps/mobile/app
cd app && grep -rn "termsAndPrivacy" apps/mobile/src apps/mobile/app
```

Expected: zero hits. If any hits remain in non-test files, fix them now (replace with `t('legal.termsTitle')` etc.). The next task (split settings rows) will use the new keys.

- [ ] **Step 5: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors (or only errors that Task 17–22 fix).

- [ ] **Step 6: Commit**

```bash
git add app/apps/mobile/src/i18n/locales/he
git commit -m "feat(mobile): legal i18n module + split settings keys"
```

---

### Task 17: Markdown styles (RTL-corrected)

**Files:**
- Create: `app/apps/mobile/src/components/legal/LegalMarkdownStyles.ts`

- [ ] **Step 1: Write the styles**

Create `app/apps/mobile/src/components/legal/LegalMarkdownStyles.ts`:

```ts
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { colors, typography, spacing } from '@kc/ui';

// Style map consumed by react-native-markdown-display.
// Keys come from the library's internal renderer node names.
export function makeLegalMarkdownStyles(scheme: 'light' | 'dark') {
  const text = scheme === 'dark' ? colors.dark.text.primary : colors.light.text.primary;
  const muted = scheme === 'dark' ? colors.dark.text.muted : colors.light.text.muted;
  const accent = scheme === 'dark' ? colors.dark.primary : colors.light.primary;
  const blockquoteBg = scheme === 'dark' ? colors.dark.surfaceAlt : colors.light.surfaceAlt;

  return StyleSheet.create({
    body: {
      ...typography.body,
      color: text,
      writingDirection: 'rtl',
      textAlign: 'right',
    } as TextStyle,
    paragraph: {
      ...typography.body,
      color: text,
      marginBottom: spacing.md,
      writingDirection: 'rtl',
      textAlign: 'right',
      lineHeight: 24,
    } as TextStyle,
    heading1: {
      ...typography.h2,
      color: text,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
      textAlign: 'right',
    } as TextStyle,
    heading2: {
      ...typography.h3,
      color: text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      textAlign: 'right',
    } as TextStyle,
    heading3: {
      ...typography.h4,
      color: text,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textAlign: 'right',
    } as TextStyle,
    link: {
      color: accent,
      textDecorationLine: 'underline',
    } as TextStyle,
    list_item: {
      flexDirection: 'row-reverse',
      marginBottom: spacing.xs,
    } as ViewStyle,
    bullet_list_icon: {
      ...typography.body,
      color: muted,
      marginLeft: spacing.sm,
      marginRight: 0,
    } as TextStyle,
    ordered_list_icon: {
      ...typography.body,
      color: muted,
      marginLeft: spacing.sm,
      marginRight: 0,
    } as TextStyle,
    blockquote: {
      backgroundColor: blockquoteBg,
      borderRightWidth: 3,
      borderLeftWidth: 0,
      borderRightColor: accent,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginVertical: spacing.sm,
    } as ViewStyle,
    strong: {
      ...typography.body,
      fontWeight: '700',
    } as TextStyle,
    em: {
      ...typography.body,
      fontStyle: 'italic',
    } as TextStyle,
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors. If `@kc/ui` token names differ from `colors.dark.text.primary` etc., fix the names to match the actual exports — open `app/packages/ui/src/index.ts` (or the colors module) and substitute the real token paths. Do **not** invent missing tokens; if the design system lacks one, use the closest existing one.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/legal/LegalMarkdownStyles.ts
git commit -m "feat(mobile): RTL-corrected markdown styles for legal docs"
```

---

### Task 18: `LegalDocumentReader` component

**Files:**
- Create: `app/apps/mobile/src/components/legal/LegalDocumentReader.tsx`

- [ ] **Step 1: Implement the reader**

Create `app/apps/mobile/src/components/legal/LegalDocumentReader.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useColorScheme, View, ScrollView, Text, ActivityIndicator, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTranslation } from 'react-i18next';
import type { LegalDocType, LegalDocumentContent } from '@kc/domain';
import { useComposition } from '../../composition/CompositionContext';
import { makeLegalMarkdownStyles } from './LegalMarkdownStyles';
import { colors, spacing, typography } from '@kc/ui';

function formatHebrewDate(d: Date): string {
  // Display as DD.MM.YYYY per spec §7.1
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

interface Props {
  docType: LegalDocType;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; content: LegalDocumentContent; offline: boolean }
  | { kind: 'error' };

export function LegalDocumentReader({ docType }: Props) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const styles = makeLegalMarkdownStyles(scheme);
  const { loadLegalDocument } = useComposition();
  const { t } = useTranslation();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const content = await loadLegalDocument.execute({ docType });
        if (!cancelled) setState({ kind: 'ready', content, offline: false });
      } catch {
        if (!cancelled) setState({ kind: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docType, loadLegalDocument]);

  if (state.kind === 'loading') {
    return <LoadingSkeleton scheme={scheme} />;
  }

  if (state.kind === 'error') {
    const errText = scheme === 'dark' ? colors.dark.text.primary : colors.light.text.primary;
    return (
      <View style={{ padding: spacing.lg }}>
        <Text style={{ ...typography.body, color: errText, textAlign: 'right' }}>
          {t('legal.loadFailed')}
        </Text>
      </View>
    );
  }

  const { content } = state;
  const isFutureDated = content.effectiveDate.getTime() > Date.now();
  const headerMuted = scheme === 'dark' ? colors.dark.text.muted : colors.light.text.muted;
  const headerText = scheme === 'dark' ? colors.dark.text.primary : colors.light.text.primary;
  const containerStyle =
    Platform.OS === 'web' ? { maxWidth: 720, alignSelf: 'center' as const, width: '100%' as const } : undefined;

  return (
    <ScrollView contentContainerStyle={[{ padding: spacing.lg }, containerStyle]}>
      <View style={{ marginBottom: spacing.md }}>
        <Text
          accessibilityRole="header"
          accessibilityLevel={1}
          style={{ ...typography.h2, color: headerText, textAlign: 'right' }}
        >
          {docType === 'terms' ? t('legal.termsTitle') : t('legal.privacyTitle')}
        </Text>
        <Text style={{ ...typography.caption, color: headerMuted, textAlign: 'right' }}>
          {isFutureDated
            ? t('legal.futureEffective', { date: formatHebrewDate(content.effectiveDate) })
            : t('legal.effectiveDate', { date: formatHebrewDate(content.effectiveDate) })}
          {'  ·  '}
          {t('legal.versionChip', { version: content.version })}
        </Text>
        {state.offline ? (
          <Text style={{ ...typography.caption, color: headerMuted, textAlign: 'right', marginTop: spacing.xs }}>
            {t('legal.offlineBanner')}
          </Text>
        ) : null}
      </View>

      <Markdown style={styles}>{content.bodyMd}</Markdown>
    </ScrollView>
  );
}

function LoadingSkeleton({ scheme }: { scheme: 'light' | 'dark' }) {
  const bg = scheme === 'dark' ? colors.dark.surfaceAlt : colors.light.surfaceAlt;
  const bar = (width: number | string, marginTop: number) => (
    <View style={{ alignSelf: 'flex-end', width, height: 14, backgroundColor: bg, borderRadius: 4, marginTop }} />
  );
  return (
    <View style={{ padding: spacing.lg }}>
      {bar('40%', 0)}
      {bar('60%', spacing.md)}
      {bar('55%', spacing.md)}
      {bar('90%', spacing.lg)}
      {bar('85%', spacing.xs)}
      {bar('80%', spacing.xs)}
      {bar('70%', spacing.xs)}
      {bar('90%', spacing.lg)}
      {bar('85%', spacing.xs)}
      {bar('80%', spacing.xs)}
      {bar('70%', spacing.xs)}
      <ActivityIndicator style={{ alignSelf: 'flex-end', marginTop: spacing.lg }} />
    </View>
  );
}
```

> The component depends on `useComposition()` — a hook that exposes the wired use cases. If your project has a different composition convention (e.g. a Zustand-backed `useServices()` or a per-feature provider), adapt the import path to match it. Task 21 will create or extend the composition context if it doesn't exist.

- [ ] **Step 2: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

If `useComposition` doesn't exist yet, you'll see an import error. That's expected — it'll resolve after Task 21. You can stub it temporarily as `() => ({ loadLegalDocument: { execute: async () => { throw new Error('not wired'); } } })` or skip the typecheck and come back after Task 21.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/legal/LegalDocumentReader.tsx
git commit -m "feat(mobile): LegalDocumentReader with offline cache and RTL"
```

---

### Task 19: Settings entries — split row + new routes

**Files:**
- Modify: `app/apps/mobile/app/settings.tsx`
- Create: `app/apps/mobile/app/legal/_layout.tsx`
- Create: `app/apps/mobile/app/legal/terms.tsx`
- Create: `app/apps/mobile/app/legal/privacy.tsx`
- Delete: `app/apps/mobile/app/legal.tsx`

- [ ] **Step 1: Split the settings row**

Open `app/apps/mobile/app/settings.tsx`. Locate the row referencing `settings.termsAndPrivacy` (around line 160 per the explorer). Replace that single row with two rows. The existing pattern looks roughly like:

```tsx
<SettingsRow label={t('settings.termsAndPrivacy')} onPress={() => router.push('/legal')} />
```

Replace with:

```tsx
<SettingsRow label={t('settings.termsOfService')} onPress={() => router.push('/legal/terms')} />
<SettingsRow label={t('settings.privacyPolicy')} onPress={() => router.push('/legal/privacy')} />
```

(Use whatever the existing component / pattern is — match the surrounding rows exactly. Don't refactor unrelated rows.)

- [ ] **Step 2: Create the `/legal` group layout**

Create `app/apps/mobile/app/legal/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function LegalLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackTitle: '' }}>
      <Stack.Screen name="terms" options={{ title: t('legal.termsTitle') }} />
      <Stack.Screen name="privacy" options={{ title: t('legal.privacyTitle') }} />
    </Stack>
  );
}
```

- [ ] **Step 3: Create the terms screen**

Create `app/apps/mobile/app/legal/terms.tsx`:

```tsx
import { LegalDocumentReader } from '../../src/components/legal/LegalDocumentReader';

export default function TermsScreen() {
  return <LegalDocumentReader docType="terms" />;
}
```

- [ ] **Step 4: Create the privacy screen**

Create `app/apps/mobile/app/legal/privacy.tsx`:

```tsx
import { LegalDocumentReader } from '../../src/components/legal/LegalDocumentReader';

export default function PrivacyScreen() {
  return <LegalDocumentReader docType="privacy" />;
}
```

- [ ] **Step 5: Delete the old legal screen**

```bash
git rm app/apps/mobile/app/legal.tsx
```

- [ ] **Step 6: Verify no broken imports**

```bash
cd app && grep -rn "from.*\/legal['\"]" apps/mobile/src apps/mobile/app
cd app && grep -rn "router.push(.*/legal[^/]" apps/mobile/src apps/mobile/app
```

Expected: every match should now point to `/legal/terms` or `/legal/privacy`, not bare `/legal`.

- [ ] **Step 7: Commit**

```bash
git add app/apps/mobile/app/settings.tsx app/apps/mobile/app/legal
git commit -m "feat(mobile): split legal route into terms + privacy entries"
```

---

### Task 20: `useActiveModalStack` ref-counter

**Files:**
- Create: `app/apps/mobile/src/components/legal/useActiveModalStack.tsx`

A small global ref-counter so `<LegalConsentGate>` can defer when any modal/sheet is open. This is opt-in — the gate is the only consumer that *reads* the count; other modal-providing components *increment* on mount and *decrement* on unmount.

- [ ] **Step 1: Implement the provider + hook**

Create `app/apps/mobile/src/components/legal/useActiveModalStack.tsx`:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface ModalStackApi {
  push(): void;
  pop(): void;
  count: number;
}

const ModalStackContext = createContext<ModalStackApi | null>(null);

export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const push = useCallback(() => setCount((c) => c + 1), []);
  const pop = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const value = useMemo(() => ({ push, pop, count }), [push, pop, count]);
  return <ModalStackContext.Provider value={value}>{children}</ModalStackContext.Provider>;
}

/** Read-only: returns true when no modals/sheets are currently open. */
export function useModalStackIsEmpty(): boolean {
  const ctx = useContext(ModalStackContext);
  if (!ctx) return true; // If provider isn't mounted, assume empty (gate won't be deferred forever).
  return ctx.count === 0;
}

/** Auto-registers a "modal is currently open" reservation for the lifetime of the calling component. */
export function useActiveModalReservation(active: boolean): void {
  const ctx = useContext(ModalStackContext);
  useEffect(() => {
    if (!ctx || !active) return;
    ctx.push();
    return () => ctx.pop();
  }, [ctx, active]);
}
```

> **Note for the future:** wiring `useActiveModalReservation(visible)` into existing sheets (`PhotoSourceSheet`, `ClosureSheet`, `PostFilterSheet`, composer modals) is out of scope for this PR — the gate's "fall open" behavior handles the worst case gracefully, and the modal-stack provider mostly matters in steady-state. Add a tech-debt entry in Task 28 for the broader wire-up.

- [ ] **Step 2: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/legal/useActiveModalStack.tsx
git commit -m "feat(mobile): modal-stack provider + reservation hook for gate defer"
```

---

### Task 21: Composition wiring — repository + use cases

**Files:**
- Locate or create: `app/apps/mobile/src/composition/CompositionContext.tsx` (or wherever the existing composition root lives)
- Modify: `app/apps/mobile/app/_layout.tsx`

The mobile composition root needs to instantiate `LegalDocumentCache`, `SupabaseLegalDocumentRepository`, and the three use cases, then expose them via context. Names and structure must match the existing composition convention.

- [ ] **Step 1: Find the existing composition root**

```bash
cd app && grep -rln "new Supabase.*Repository" apps/mobile/src
```

This should point to the file where existing repositories like `SupabaseUserRepository`, `SupabasePostRepository`, etc. are instantiated. Read it. Mirror its pattern.

- [ ] **Step 2: Extend the composition root**

In whatever file owns composition (likely something like `apps/mobile/src/composition/index.ts`, `services.ts`, or `Providers.tsx`), add:

```ts
import { getSupabaseClient, SupabaseLegalDocumentRepository, LegalDocumentCache } from '@kc/infrastructure-supabase';
import {
  LoadLegalDocumentUseCase,
  CheckPendingLegalAcksUseCase,
  AcceptLegalDocumentUseCase,
} from '@kc/application';
import AsyncStorage from '@react-native-async-storage/async-storage';

const legalCache = new LegalDocumentCache(AsyncStorage);
const legalRepo = new SupabaseLegalDocumentRepository(getSupabaseClient(), legalCache);

export const loadLegalDocument         = new LoadLegalDocumentUseCase(legalRepo);
export const checkPendingLegalAcks     = new CheckPendingLegalAcksUseCase(legalRepo);
export const acceptLegalDocument       = new AcceptLegalDocumentUseCase(legalRepo);
```

And expose them through whatever context provider the project uses. If composition is a flat module (singletons exported at module top level), the use cases are already available to importers — Task 18's `useComposition` import needs to be swapped for a direct import from the composition module. Update `LegalDocumentReader.tsx` accordingly:

```ts
import { loadLegalDocument } from '../../composition'; // or wherever it lives
```

and replace `const { loadLegalDocument } = useComposition();` with a no-op (use the imported singleton directly inside the effect).

If composition does use a context provider, add the new fields to the provider's value object and the consumer hook's return type.

- [ ] **Step 3: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors. Fix as needed.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/composition app/apps/mobile/src/components/legal/LegalDocumentReader.tsx
git commit -m "feat(mobile): wire legal document use cases into composition root"
```

---

### Task 22: `LegalConsentScreen` (shared UI for signup + update modes)

**Files:**
- Create: `app/apps/mobile/src/components/legal/LegalConsentScreen.tsx`

This is the consent surface, used by the gate in three modes: `signup`, `update-banner-sheet`, `update-modal`. It composes the reader, checkboxes, and sign-out fallback. For brevity in this plan we ship one component that takes a `mode` prop; internal branches handle the differences.

- [ ] **Step 1: Implement the consent screen**

Create `app/apps/mobile/src/components/legal/LegalConsentScreen.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import type { LegalDocumentContent, LegalPendingItem } from '@kc/domain';
import { LegalDocumentReader } from './LegalDocumentReader';
import { acceptLegalDocument, loadLegalDocument } from '../../composition'; // adjust to match Task 21
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography } from '@kc/ui';

export type LegalConsentMode = 'signup' | 'update';

interface Props {
  mode: LegalConsentMode;
  pending: readonly LegalPendingItem[];
  /** Called after all required acceptances are logged. */
  onResolved: () => void;
}

export function LegalConsentScreen({ mode, pending, onResolved }: Props) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [readerOpenFor, setReaderOpenFor] = useState<LegalPendingItem | null>(null);

  const allChecked = useMemo(() => pending.every((p) => accepted[p.docType]), [pending, accepted]);

  const onSubmit = async () => {
    if (submitting || !allChecked) return;
    setSubmitting(true);
    try {
      await Promise.all(
        pending.map((p) =>
          acceptLegalDocument.execute({
            docType: p.docType,
            version: p.currentVersion,
            locale: 'he',
            userAgent: `${Platform.OS}/${Platform.Version}`,
          }),
        ),
      );
      onResolved();
    } finally {
      setSubmitting(false);
    }
  };

  const onExit = async () => {
    setExitConfirmOpen(false);
    await useAuthStore.getState().signOut?.();
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {mode === 'signup' ? (
          <Text style={{ ...typography.h3, textAlign: 'right', marginBottom: spacing.lg }}>
            {t('legal.signupHeading')}
          </Text>
        ) : (
          <Text style={{ ...typography.h3, textAlign: 'right', marginBottom: spacing.lg }}>
            {t('legal.updateModalHeading')}
          </Text>
        )}

        {pending.map((p) => (
          <ConsentCard
            key={p.docType}
            item={p}
            checked={!!accepted[p.docType]}
            onToggle={(v) => setAccepted((s) => ({ ...s, [p.docType]: v }))}
            onOpenReader={() => setReaderOpenFor(p)}
          />
        ))}

        <Pressable
          onPress={onSubmit}
          disabled={!allChecked || submitting}
          style={({ pressed }) => ({
            marginTop: spacing.lg,
            paddingVertical: spacing.md,
            borderRadius: 12,
            backgroundColor: !allChecked || submitting ? colors.light.surfaceAlt : colors.light.primary,
            opacity: pressed ? 0.85 : 1,
            alignItems: 'center',
          })}
        >
          <Text style={{ ...typography.button, color: colors.light.text.inverse }}>
            {mode === 'signup' ? t('legal.signupContinue') : t('legal.updateConfirmCta')}
          </Text>
        </Pressable>

        <Pressable onPress={() => setExitConfirmOpen(true)} style={{ marginTop: spacing.md, alignSelf: 'center' }}>
          <Text style={{ ...typography.bodySm, color: colors.light.text.muted }}>{t('legal.exitLink')}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={exitConfirmOpen} transparent animationType="fade" onRequestClose={() => setExitConfirmOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: colors.light.surface, borderRadius: 12, padding: spacing.lg }}>
            <Text style={{ ...typography.h4, textAlign: 'right' }}>{t('legal.exitConfirmTitle')}</Text>
            <Text style={{ ...typography.body, textAlign: 'right', marginVertical: spacing.md }}>
              {t('legal.exitConfirmBody')}
            </Text>
            <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
              <Pressable
                onPress={onExit}
                style={{ flex: 1, paddingVertical: spacing.md, borderRadius: 8, backgroundColor: colors.light.danger, alignItems: 'center' }}
              >
                <Text style={{ ...typography.button, color: colors.light.text.inverse }}>{t('legal.exitConfirmConfirm')}</Text>
              </Pressable>
              <Pressable
                onPress={() => setExitConfirmOpen(false)}
                style={{ flex: 1, paddingVertical: spacing.md, borderRadius: 8, backgroundColor: colors.light.surfaceAlt, alignItems: 'center' }}
              >
                <Text style={{ ...typography.button, color: colors.light.text.primary }}>{t('legal.exitConfirmCancel')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!readerOpenFor} animationType="slide" onRequestClose={() => setReaderOpenFor(null)}>
        {readerOpenFor ? (
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => setReaderOpenFor(null)} style={{ padding: spacing.md }}>
              <Text style={{ ...typography.button, color: colors.light.primary, textAlign: 'left' }}>{t('legal.closeReader')}</Text>
            </Pressable>
            <LegalDocumentReader docType={readerOpenFor.docType} />
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

interface CardProps {
  item: LegalPendingItem;
  checked: boolean;
  onToggle: (v: boolean) => void;
  onOpenReader: () => void;
}

function ConsentCard({ item, checked, onToggle, onOpenReader }: CardProps) {
  const { t } = useTranslation();
  const title = item.docType === 'terms' ? t('legal.termsTitle') : t('legal.privacyTitle');
  const checkboxLabel = item.docType === 'terms' ? t('legal.checkboxTerms') : t('legal.checkboxPrivacy');
  const [content, setContent] = useState<LegalDocumentContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await loadLegalDocument.execute({ docType: item.docType });
        if (!cancelled) setContent(c);
      } catch {
        // Cache fallback handles offline; nothing to do here on hard failure.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.docType]);

  // Change-summary bullets (server enforces NOT NULL when severity != minor).
  const bullets = content?.changeSummary
    ? content.changeSummary
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('-'))
        .map((l) => l.replace(/^-\s*/, ''))
        .slice(0, 3)
    : [];

  return (
    <View
      style={{
        backgroundColor: colors.light.surfaceAlt,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <Text style={{ ...typography.h4, textAlign: 'right' }}>{title}</Text>

      {bullets.length > 0 ? (
        <View style={{ marginTop: spacing.sm }}>
          {bullets.map((b, i) => (
            <Text
              key={i}
              style={{ ...typography.body, color: colors.light.text.primary, textAlign: 'right', marginBottom: spacing.xs }}
            >
              {`• ${b}`}
            </Text>
          ))}
        </View>
      ) : null}

      <Pressable onPress={onOpenReader} style={{ marginTop: spacing.sm }}>
        <Text style={{ ...typography.body, color: colors.light.primary, textAlign: 'right' }}>
          {t('legal.cardOpenFull')}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onToggle(!checked)}
        style={{ flexDirection: 'row-reverse', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: colors.light.primary,
            backgroundColor: checked ? colors.light.primary : 'transparent',
          }}
        />
        <Text style={{ ...typography.body, color: colors.light.text.primary, flex: 1, textAlign: 'right' }}>
          {checkboxLabel}
        </Text>
      </Pressable>
    </View>
  );
}
```

> If `useAuthStore.getState().signOut` is named differently in your store, update the call. The intent is "tear down the session and route to the welcome screen."

- [ ] **Step 2: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors (or only errors that come from missing `@kc/ui` token names — substitute the closest available token).

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/legal/LegalConsentScreen.tsx
git commit -m "feat(mobile): LegalConsentScreen with consent cards and sign-out fallback"
```

---

### Task 23: `LegalConsentGate` root-level gate

**Files:**
- Create: `app/apps/mobile/src/components/legal/LegalConsentGate.tsx`

The gate that owns the policy logic per spec §7.4 and §7.5. It calls `checkPendingLegalAcks` on mount + AppState transitions + auth changes, and decides which of three things to render: nothing, banner (in-shell), or fullscreen modal.

- [ ] **Step 1: Implement the gate**

Create `app/apps/mobile/src/components/legal/LegalConsentGate.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, View, Text, Pressable, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'expo-router';
import type { LegalPendingItem } from '@kc/domain';
import type { CheckPendingLegalAcksResult } from '@kc/application';
import { useAuthStore } from '../../store/authStore';
import { checkPendingLegalAcks } from '../../composition';
import { useModalStackIsEmpty } from './useActiveModalStack';
import { LegalConsentScreen, type LegalConsentMode } from './LegalConsentScreen';
import { colors, spacing, typography } from '@kc/ui';

const FOREGROUND_DEBOUNCE_MS = 500;

interface Props {
  children: ReactNode;
}

type GateState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'clear' }
  | {
      kind: 'pending';
      result: CheckPendingLegalAcksResult;
      sheetDismissedThisSession: boolean;
      userOptedToAcceptNow: boolean;
    };

export function LegalConsentGate({ children }: Props) {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const userId = session?.userId ?? null;
  const pathname = usePathname();
  const modalStackEmpty = useModalStackIsEmpty();
  const [state, setState] = useState<GateState>({ kind: 'idle' });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onReadingDoc = pathname.startsWith('/legal/');

  const runCheck = useMemo(
    () => async () => {
      if (!userId) {
        setState({ kind: 'clear' });
        return;
      }
      setState((prev) => (prev.kind === 'pending' ? prev : { kind: 'loading' }));
      try {
        const result = await checkPendingLegalAcks.execute();
        if (result.pending.length === 0) {
          setState({ kind: 'clear' });
        } else {
          setState({
            kind: 'pending',
            result,
            sheetDismissedThisSession: false,
            userOptedToAcceptNow: false,
          });
        }
      } catch (err) {
        // Fall open: log and let the user through (spec §7.5).
        // eslint-disable-next-line no-console
        console.warn('[legal] consent_check_skipped_offline', {
          reason: (err as Error).message,
          timestamp: new Date().toISOString(),
        });
        setState({ kind: 'clear' });
      }
    },
    [userId],
  );

  // Trigger: mount + auth change
  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  // Trigger: AppState 'active' transition (debounced)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void runCheck();
      }, FOREGROUND_DEBOUNCE_MS);
    });
    return () => {
      sub.remove();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [runCheck]);

  // Trigger: modal stack just emptied (re-check deferred items)
  useEffect(() => {
    if (modalStackEmpty && state.kind === 'idle') {
      void runCheck();
    }
  }, [modalStackEmpty, state.kind, runCheck]);

  // Trigger: route changed away from /legal/* (re-check deferred items)
  useEffect(() => {
    if (!onReadingDoc && state.kind === 'idle') {
      void runCheck();
    }
  }, [onReadingDoc, state.kind, runCheck]);

  // Defer rendering when modal is open or user is on /legal/*
  const shouldDefer = !modalStackEmpty || onReadingDoc;

  if (state.kind !== 'pending' || shouldDefer) {
    return <>{children}</>;
  }

  const mustBlock = state.result.mustBlockImmediately;
  const isSignupShape = state.result.pending.every((p) => p.lastAcceptedVersion === 0);
  const screenMode: LegalConsentMode = isSignupShape ? 'signup' : 'update';

  // ─────────────────────────────────────────
  // Full-screen consent: server says block, or user voluntarily opted to accept now from the sheet
  // ─────────────────────────────────────────
  if (mustBlock || state.userOptedToAcceptNow) {
    return (
      <Modal visible animationType="slide" onRequestClose={() => void 0 /* swallow */}>
        <LegalConsentScreen
          mode={screenMode}
          pending={state.result.pending}
          onResolved={() => void runCheck()}
        />
      </Modal>
    );
  }

  // ─────────────────────────────────────────
  // Banner mode: in-shell affordance + first-foreground sheet
  // ─────────────────────────────────────────
  const dismissed = state.sheetDismissedThisSession;
  return (
    <View style={{ flex: 1 }}>
      <BannerStrip
        pending={state.result.pending}
        onOpen={() => setState({ ...state, userOptedToAcceptNow: true })}
      />
      {children}
      {!dismissed ? (
        <Modal visible animationType="slide" presentationStyle="pageSheet" transparent>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: colors.light.surface,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: spacing.lg,
              }}
            >
              <Text style={{ ...typography.h4, textAlign: 'right' }}>{t('legal.updateBannerHeading')}</Text>
              <Text style={{ ...typography.body, textAlign: 'right', marginTop: spacing.sm }}>
                {t('legal.updateBannerCountdown', { days: daysRemaining(state.result.pending) })}
              </Text>
              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.lg }}>
                <Pressable
                  onPress={() => setState({ ...state, sheetDismissedThisSession: true })}
                  style={{ flex: 1, padding: spacing.md, borderRadius: 8, backgroundColor: colors.light.surfaceAlt, alignItems: 'center' }}
                >
                  <Text style={typography.button}>{t('legal.updateSheetSnooze')}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setState({ ...state, sheetDismissedThisSession: true, userOptedToAcceptNow: true })
                  }
                  style={{ flex: 1, padding: spacing.md, borderRadius: 8, backgroundColor: colors.light.primary, alignItems: 'center' }}
                >
                  <Text style={{ ...typography.button, color: colors.light.text.inverse }}>{t('legal.updateSheetAccept')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function daysRemaining(pending: readonly LegalPendingItem[]): number {
  // Display-only; server is the source of truth for the banner→modal flip (spec §7.4).
  const earliest = pending.reduce<Date | null>((acc, p) => {
    if (!acc) return p.currentEffectiveDate;
    return p.currentEffectiveDate < acc ? p.currentEffectiveDate : acc;
  }, null);
  if (!earliest) return 7;
  const elapsedDays = Math.floor((Date.now() - earliest.getTime()) / 86_400_000);
  return Math.max(0, 7 - elapsedDays);
}

function BannerStrip({ pending, onOpen }: { pending: readonly LegalPendingItem[]; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onOpen}
      style={{
        backgroundColor: colors.light.warning,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <Text style={{ ...typography.bodySm, color: colors.light.text.primary, textAlign: 'right' }}>
        {t('legal.updateBannerHeading')} · {t('legal.updateBannerCountdown', { days: daysRemaining(pending) })}
      </Text>
    </Pressable>
  );
}
```

> **Behavioral note:** the banner-mode path simplifies one thing from spec §7.4: rather than tracking a separate "promotion" code, the gate re-runs `checkPendingLegalAcks` on every foreground; when the server flips `block_mode` to `modal`, the next state transition naturally renders the modal branch. The client never decides the promotion locally.

- [ ] **Step 2: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/legal/LegalConsentGate.tsx
git commit -m "feat(mobile): LegalConsentGate with server-driven block mode"
```

---

### Task 24: Wire the gate into the root layout

**Files:**
- Modify: `app/apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Insert the gate above `OnboardingSoftGate` and the `ModalStackProvider` above the gate**

Open `app/apps/mobile/app/_layout.tsx`. Locate the line that mounts `<SoftGateProvider>` wrapping `<ShellWithResponsiveChrome>` (around line 170 per the explorer report).

Add imports near the top:

```tsx
import { LegalConsentGate } from '../src/components/legal/LegalConsentGate';
import { ModalStackProvider } from '../src/components/legal/useActiveModalStack';
```

Wrap the existing tree so the structure is:

```tsx
<ModalStackProvider>
  <LegalConsentGate>
    <SoftGateProvider>
      <ShellWithResponsiveChrome>
        {/* existing children */}
      </ShellWithResponsiveChrome>
    </SoftGateProvider>
  </LegalConsentGate>
</ModalStackProvider>
```

Keep all other providers (theme, query, i18n, etc.) in their existing positions — only the section that wraps the authenticated shell changes.

- [ ] **Step 2: Typecheck**

```bash
cd app && pnpm --filter @kc/mobile typecheck
```

Expected: no errors.

- [ ] **Step 3: Smoke test in the simulator**

```bash
cd app && pnpm --filter @kc/mobile ios
```

Verify:
- Sign in as an existing dev user → bottom sheet appears with the v1 standard-grace banner (per the seed in Task 6).
- Tap "פתח לקריאה" → reader opens with the Hebrew Markdown.
- Dismiss with "אזכיר לי בעוד יום" → top-bar banner persists.
- Force-quit and reopen → bottom sheet appears again (per-session dismiss).
- Tap "אישור עכשיו" → consent screen → check the box → "אישור" → gate clears.

If the gate doesn't render (e.g. session is null), confirm via dev console that `useAuthStore.getState().session.userId` is populated.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): mount LegalConsentGate above onboarding gate"
```

---

## Phase 6 — Studio snippets + operator runbook

### Task 25: Operator runbook snippets

**Files:**
- Modify: `docs/SSOT/OPERATOR_RUNBOOK.md`

- [ ] **Step 1: Append a "Publish legal documents" section**

Open `docs/SSOT/OPERATOR_RUNBOOK.md` and append a new section. The exact heading style should match the file's existing convention; the content is:

````markdown
## Publishing legal documents (FR-SETTINGS-010)

Editable from Supabase Studio without a frontend deploy. Each publish is an immutable `legal_document_versions` row plus an update to the current-pointer row in `legal_documents`.

### Snippet 1 — Publish Terms (minor): typo/cosmetic, no re-ack

```sql
select public.publish_legal_document(
  p_doc_type       => 'terms',
  p_body_md        => $$
# תנאי שימוש
<full Markdown body here>
$$,
  p_severity       => 'minor',
  p_change_summary => null,
  p_effective_date => now()
);
```

### Snippet 2 — Publish Terms (material): user re-ack required, 7-day soft grace

```sql
select public.publish_legal_document(
  p_doc_type       => 'terms',
  p_body_md        => $$
# תנאי שימוש
<full Markdown body here>
$$,
  p_severity       => 'standard',
  p_change_summary => $$- בולט 1
- בולט 2
- בולט 3$$,
  p_effective_date => now()
);
```

### Snippet 3 — Publish Privacy (minor): same as Snippet 1, doc_type=`privacy`.

### Snippet 4 — Publish Privacy (material): same as Snippet 2, doc_type=`privacy`.

### Snippet 5 — Publish CRITICAL (blocks all users immediately on next foreground)

```sql
-- Use sparingly. Critical must be effective within 1 hour.
select public.publish_legal_document(
  p_doc_type       => 'privacy',
  p_body_md        => $$<full Markdown>$$,
  p_severity       => 'critical',
  p_change_summary => $$- שינוי דחוף שדורש אישור מיידי$$,
  p_effective_date => now()
);
```

### Verification after publish

```sql
select doc_type, current_version, last_material_version, last_material_severity
  from public.legal_documents;
```

The published row should show the new `current_version`. For `standard`/`critical`, `last_material_version` advances; for `minor`, it stays.
````

- [ ] **Step 2: Commit**

```bash
git add docs/SSOT/OPERATOR_RUNBOOK.md
git commit -m "docs(ssot): operator runbook snippets for publishing legal docs"
```

---

## Phase 7 — SSOT updates

### Task 26: Update `FR-SETTINGS-010` spec

**Files:**
- Modify: `docs/SSOT/spec/11_settings.md`

- [ ] **Step 1: Replace the existing `FR-SETTINGS-010` block**

Open `docs/SSOT/spec/11_settings.md`. Replace the current `FR-SETTINGS-010 — Legal section` block (which currently has 3 ACs about web views + remote config) with:

```markdown
## FR-SETTINGS-010 — Legal section

**Status.** ✅ Implemented.

**Description.**
Two settings rows ("תנאי שימוש", "מדיניות פרטיות") open dedicated screens that render server-driven Markdown content natively (no WebView). Document content is editable from Supabase Studio via `publish_legal_document` RPC; no app deploy required. Material changes trigger a re-acknowledgement flow per spec `docs/superpowers/specs/2026-05-24-server-driven-legal-documents-design.md`.

**Acceptance Criteria.**
- AC1. Two settings rows ("תנאי שימוש", "מדיניות פרטיות") open dedicated screens rendering server-driven Markdown content natively (no WebView). RTL-correct on iOS, Android, and web.
- AC2. Document content is editable via the `publish_legal_document` RPC. No remote-config URL configuration is involved.
- AC3. Re-acknowledgement is required when a published version has `severity ∈ ('standard','critical')`. `critical` blocks on next foreground; `standard` shows a 7-day soft banner that escalates to blocking on day 7. The banner→modal promotion is computed server-side from the database clock, not the client.
- AC4. Post-OAuth consent screen presents both documents as cards; the user must check both before proceeding. Skipping is only possible via sign-out (with confirmation).
- AC5. Documents support `effective_date` in the future; until the date arrives, the document is visible in Settings with a "ייכנס לתוקף ב-DATE" banner but does not trigger the gate.
- AC6. Network failure during the gate check falls open (allows the user through) and logs the bypass via `console.warn`. Next online foreground re-checks. (TD-XXX-BE tracks the upgrade to a server-side `legal_events` log.)
```

- [ ] **Step 2: Update the file's status header if all settings ACs are now ✅**

Check the file's `## Status` header (top of file). If FR-SETTINGS-010 was the last 🔴/🟡 in the settings domain, flip the overall status to ✅. Otherwise leave it.

- [ ] **Step 3: Commit**

```bash
git add docs/SSOT/spec/11_settings.md
git commit -m "docs(ssot): rewrite FR-SETTINGS-010 for server-driven legal docs"
```

---

### Task 27: Update `FR-AUTH-002` spec

**Files:**
- Modify: `docs/SSOT/spec/01_auth_and_onboarding.md`

- [ ] **Step 1: Add a new AC to `FR-AUTH-002`**

Open `docs/SSOT/spec/01_auth_and_onboarding.md`. Locate the `FR-AUTH-002 — Authentication entry screen` block. After AC4, append AC5:

```markdown
- AC5. On successful OAuth completion (Google / Apple / email-password), the user is routed to the legal consent gate BEFORE the authenticated shell renders and before the onboarding soft gate is evaluated. The gate is satisfied either by an existing `user_legal_acceptances` row clearing `needs_legal_reacknowledgement`, or by completing the post-OAuth consent screen (`FR-SETTINGS-010` AC4). Sign-out from the consent screen returns the user to the welcome screen with the OAuth session terminated.
```

- [ ] **Step 2: Commit**

```bash
git add docs/SSOT/spec/01_auth_and_onboarding.md
git commit -m "docs(ssot): FR-AUTH-002 AC5 — post-OAuth legal gate handoff"
```

---

### Task 28: Update `BACKLOG.md`, `TECH_DEBT.md`, `DECISIONS.md`

**Files:**
- Modify: `docs/SSOT/BACKLOG.md`
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/SSOT/DECISIONS.md`

- [ ] **Step 1: Flip P2.18 to Done**

Open `docs/SSOT/BACKLOG.md`. Locate the P2.18 row. Change status from `🟡 In progress` to `✅ Done`. Trim its title if needed to reflect the actual delivery: replace "in-app web views, canonical URLs configurable via remote config" with "server-driven Markdown".

- [ ] **Step 2: Close TD-80 and add the new TDs**

Open `docs/SSOT/TECH_DEBT.md`. Move TD-80 from Active to the Resolved section, with a one-line note `Closed by FR-SETTINGS-010 server-driven legal docs (PR <#>).`

Append the following new TD rows to the Active section. Use the next free IDs in the BE (`TD-50..99`) and FE (`TD-100..149`) ranges per `CLAUDE.md` §9 — open the file to see what's free and pick the lowest available IDs (replace the `XXX` placeholders below):

```markdown
| TD-XXX-BE | 🟡 | **Wire `consent_check_skipped_offline` events to a server-side `legal_events` log table.** Currently `console.warn` only. Required to defend offline-fall-open posture in an ILITA audit. | P2 |
| TD-XXX-FE | 🟡 | In-app super-admin UI for legal document editing with Markdown preview, severity selector, scheduled-publish, and diff vs previous version. Replaces Supabase Studio snippet workflow. | P3 |
| TD-XXX-BE | 🟡 | Two-person approval workflow for `publish_legal_document` (second super_admin must approve before `effective_date` arrives). Audit-readiness hardening. | P3 |
| TD-XXX-FE | 🟡 | Add date-of-birth field to signup flow (`FR-AUTH-002`) to satisfy תיקון 13 minor-data heightened expectations. | P2 |
| TD-XXX-BE | 🟡 | Periodic check + alert when ILITA database-registration threshold per תיקון 13 §17B is approached. | P3 |
| TD-XXX-FE | 🟢 | "View my consent history" surface for users in Settings → Privacy (reads `user_legal_acceptances` for `auth.uid()`). | P3 |
| TD-XXX-BE | 🟢 | Multi-language support — extend `language` column usage; add locale-aware variant selection in `LoadLegalDocumentUseCase`. Deferred per R-MVP-Core-4. | P3 |
| TD-XXX-FE | 🟢 | Wire `useActiveModalReservation` into existing sheets (PhotoSourceSheet, ClosureSheet, PostFilterSheet, composer modals) so LegalConsentGate defers correctly when those are open. Currently gate may render over an open sheet on edge cases. | P3 |
```

- [ ] **Step 3: Add decisions**

Open `docs/SSOT/DECISIONS.md`. Append the following decisions, using the next free `D-*` IDs (replace `XX`):

```markdown
### D-XX — Legal docs delivery model: server-driven Markdown, native render

Legal documents are delivered as server-driven Markdown rendered natively in the app, not as WebViews of canonical URLs.

**Rationale.** Native RTL/theming/offline consistency on iOS+Android+web; no website CMS dependency for a free MVP; simpler editing workflow (one SQL snippet vs. a CMS publish).
**Trade-off.** No rich layout beyond Markdown.

### D-XX — Severity tiers: minor / standard / critical

Three-tier severity replaces the originally-proposed `is_material_change` boolean.

**Rationale.** Protects the user from "wall of text on app open" while still meeting consent requirements; publisher decides per release.

### D-XX — Append-only acceptance log

`user_legal_acceptances` is an append-only event log, not an upsert table. UPDATE/DELETE blocked by trigger.

**Rationale.** GDPR Art. 7(1) requires demonstrating consent per version; council legal review identified upsert-only as the highest-priority blocker.

### D-XX — No grandfather backfill of acceptances

Existing users at launch are NOT issued fabricated `accepted_at = users.created_at` records. They are routed through the 7-day soft-grace flow on next foreground.

**Rationale.** A backfilled timestamp for a v1 the user never saw is a fabricated audit record; one-time soft-grace UX cost is the right trade.

### D-XX — Server-computed `block_mode`

The 7-day standard→critical promotion is computed in SQL inside `needs_legal_reacknowledgement`, not on the client.

**Rationale.** Client clocks can be wrong (DST, deliberate tampering, OS bug); enforcement must live with the source of truth. Client uses the server-supplied countdown for display only.

### D-XX — `critical` severity must publish immediately

`publish_legal_document` rejects `critical` with `effective_date > now() + 1 hour`.

**Rationale.** Critical = urgent; scheduled rollouts use `standard`. Prevents an "alarm bomb" critical that catches users off-guard.

### D-XX — Legal tables `authenticated`-only read

SELECT on `legal_documents` + `legal_document_versions` is granted to `authenticated`, not `anon`.

**Rationale.** Signup happens through OAuth before any legal text is shown — the user is always authenticated by the time they need to read. Removing the anon grant shrinks the public-facing surface.
```

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/BACKLOG.md docs/SSOT/TECH_DEBT.md docs/SSOT/DECISIONS.md
git commit -m "docs(ssot): close P2.18 + TD-80, add follow-up TDs and 7 decisions"
```

---

## Phase 8 — Local verification + PR

### Task 29: Pre-push verification

**Files:** none (verification only)

- [ ] **Step 1: Run typecheck, test, lint from `app/`**

```bash
cd app
pnpm typecheck
pnpm test
pnpm lint
```

Expected: all three green. If lint flags any of the new files (e.g. file > 300 lines, indent > 3 levels), refactor before proceeding — `CLAUDE.md` §5 hard constraints.

- [ ] **Step 2: Architecture lint**

```bash
cd app && pnpm lint:arch
```

Expected: no violations. The new files respect the inward dependency direction (domain ← application ← infrastructure-supabase ← apps/mobile).

- [ ] **Step 3: Manual QA in simulator (iOS)**

```bash
cd app && pnpm --filter @kc/mobile ios
```

Walk through the §12 spec checklist. **At minimum:**

- [ ] `/legal/terms` and `/legal/privacy` open from Settings; scroll smoothly.
- [ ] RTL correct (right-aligned, numbered list digits on right, blockquote bar on right).
- [ ] Dark mode contrast OK.
- [ ] Offline cache: airplane mode + open a previously-viewed doc → renders from cache.
- [ ] Existing-user post-migration flow: bottom sheet on first foreground, banner persists after "אזכיר לי בעוד יום".
- [ ] Tap "אישור עכשיו" → consent screen → check box → "אישור" → banner clears.
- [ ] Publish a `critical` v2 in Studio against the dev DB → next foreground → immediate blocking modal.

Record any defects directly into the PR body's "Manual QA" section.

- [ ] **Step 4: Manual QA in simulator (Android)** — same checklist.
- [ ] **Step 5: Manual QA on web** — same checklist, plus: browser back button in blocking modal does nothing.

---

### Task 30: Push + open PR

**Files:** none (git only)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin HEAD
```

- [ ] **Step 2: Open the PR against `dev`**

```bash
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(legal): server-driven Terms + Privacy with consent gate (FR-SETTINGS-010)" \
  --body-file - <<'EOF'
## Summary

Replaces the static `/legal` screen with a server-driven two-document model. Terms of Service and Privacy Policy are now editable from Supabase Studio via the `publish_legal_document` RPC, with no app deploy required. Material changes (standard/critical severity) trigger a re-acknowledgement flow: critical blocks immediately, standard shows a 7-day soft banner that the **server** promotes to blocking at day 7.

Captures per-version consent in an append-only log for GDPR Art. 7(1) / Israeli Privacy Protection Law audit-readiness. Closes TD-80.

## Mapped to spec

- FR-SETTINGS-010 — rewritten (`docs/SSOT/spec/11_settings.md`).
- FR-AUTH-002 — new AC5 covering the post-OAuth handoff to the legal gate.
- Design spec: `docs/superpowers/specs/2026-05-24-server-driven-legal-documents-design.md`
- Plan: `docs/superpowers/plans/2026-05-24-server-driven-legal-documents.md`

## Changes

- New migration `supabase/migrations/0108_legal_documents_and_consent.sql`: 3 tables, 1 enum, 3 RPCs, 1 view, append-only triggers, SHA-256 content hash, RLS + grants, v1 seed with `severity='standard'` so existing users enter the 7-day soft-grace flow.
- New domain types + `shouldBlockImmediately` policy in `@kc/domain`.
- 3 new use cases in `@kc/application`: `LoadLegalDocumentUseCase`, `CheckPendingLegalAcksUseCase`, `AcceptLegalDocumentUseCase`.
- New `SupabaseLegalDocumentRepository` in `@kc/infrastructure-supabase` with AsyncStorage cache + offline fall-back.
- Mobile: 3 UI surfaces sharing `LegalDocumentReader` (settings entries, post-OAuth consent screen, material-update gate). New `LegalConsentGate` at root layout. `ModalStackProvider` + `useActiveModalReservation` for defer-on-open-sheet behavior.
- i18n: new `he/modules/legal.ts` module; existing `legalContent.*` inline strings removed.
- SSOT: P2.18 → ✅, TD-80 → Resolved, 7 new TDs added, 7 new D-* decisions.

## Tests

- `pnpm typecheck` ✅
- `pnpm test`       ✅ (new unit tests in domain + application + infrastructure-supabase)
- `pnpm lint`       ✅
- `pnpm lint:arch`  ✅
- Manual: iOS + Android + web QA per spec §12. See checklist in commit history.
- RLS: `supabase/tests/legal_documents_rls_test.sql` runs 8 assertions covering anon/auth/admin × select/insert/update/delete.

## SSOT updated

- [x] `BACKLOG.md` — P2.18 flipped to ✅ Done.
- [x] `spec/11_settings.md` — FR-SETTINGS-010 rewritten.
- [x] `spec/01_auth_and_onboarding.md` — FR-AUTH-002 AC5 added.
- [x] `TECH_DEBT.md` — TD-80 closed; 8 follow-up TDs added (BE + FE).
- [x] `DECISIONS.md` — 7 new D-* entries.
- [x] `OPERATOR_RUNBOOK.md` — publish snippets section appended.

## Risk / rollout notes

- One-time consent activity spike on first foreground after deploy (existing users go through 7-day soft-grace per spec §8). No backfill of `user_legal_acceptances`.
- Network failure during gate check falls open (allows the user through). Currently logged via `console.warn`; server-side `legal_events` log is a P2 follow-up (TD-XXX-BE).
- `publish_legal_document` requires a super-admin row to exist in `public.users.is_super_admin = true`. Migration fails loudly if none exists.

## Open items for PM before public production launch

Per spec §16:
1. `{{LEGAL_ENTITY_NAME}}` — fill via a `minor` publish in Studio.
2. `{{CONTACT_EMAIL}}` — confirm or change `karmacommunity2.0@gmail.com`.
3. `{{CONTACT_ADDRESS}}` — required for GDPR Art. 13(1)(a).
4. Lawyer review of the v1 Hebrew text.
EOF
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 3: After merge, sync local `dev`**

```bash
git switch dev
git pull --ff-only origin dev
git branch -D feat/FR-SETTINGS-010-server-driven-legal-docs
```

---

## Notes for the executor

### Things that will probably need adjustment

1. **`@kc/ui` token names.** The UI components reference `colors.light.primary`, `typography.body`, etc. Open `app/packages/ui/src/index.ts` and substitute the actual exported names. Do not invent tokens that don't exist; use the closest existing one.
2. **Composition root.** Task 21 assumes a singleton-export composition module. If the actual convention is a React context (`<CompositionProvider value={…}>`), thread the use cases through that context instead.
3. **`useAuthStore.signOut`.** The exact method name may differ. Search the store and replace with the real one in `LegalConsentScreen.onExit`.
4. **i18n integration.** The plan assumes `react-i18next`. If the project uses a different i18n library, adapt `useTranslation` and the namespace shape.
5. **Existing migration runner.** If the project uses Supabase CLI migrations vs. direct `psql`, prefer the CLI in Task 7.

### What this plan deliberately defers

- In-app super-admin editor (TD-FE).
- Two-person approval workflow (TD-BE).
- Per-section/per-data-use consent.
- DOB field at signup (TD-FE).
- Wire-up of `useActiveModalReservation` into existing sheets (TD-FE).
- Server-side `legal_events` log for offline-skip events (TD-BE) — required within one sprint of merge.
- Multi-language support (TD-BE).
- COPPA verifiable parental consent.
- Self-service data export UI (handled via support channel + 30-day SLA in policy text).

All of these are captured as follow-up TDs in Task 28.

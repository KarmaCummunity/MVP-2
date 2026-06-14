-- 0194_org_formation_schema — FR-ADMIN-021 "Org Formation Journey" (המסע לעמותה).
--
-- A guided, country-pluggable checklist for establishing a non-profit, plus a
-- governance roster (board / audit committee) whose members are wired to real
-- RBAC role grants. Israel (country_code='IL') ships seeded; other countries can
-- be added later as pure data with no schema change.
--
-- Tables:
--   • org_formation_journeys       — one journey per country in this deployment.
--   • org_formation_steps          — editable step catalogue (body + tips), per country.
--   • org_formation_step_progress  — per-journey checklist state.
--   • org_formation_governance     — board / audit members, linked to admin_role_grants.
--
-- Governance assignment grants the org-scoped RBAC roles introduced here
-- (org_board_member / org_audit_member); scope_org_id = journey.org_id.
--
-- Reads/writes go through SECURITY DEFINER RPCs (migration 0195). Tables are
-- SELECT-only from the client for super_admin (UI uses the RPCs).
--
-- Mapped to spec: docs/SSOT/spec/12_super_admin.md §15, FR-ADMIN-021.

BEGIN;

-- ── 1. Widen RBAC role enum with the two governance roles (org-scoped) ──────
alter table public.admin_role_grants
  drop constraint if exists admin_role_grants_role_check;

alter table public.admin_role_grants
  add constraint admin_role_grants_role_check check (role in (
    'super_admin',
    'admin',
    'moderator', 'support',
    'operator', 'operators_manager',
    'org_admin', 'org_manager', 'org_employee',
    'volunteer_manager', 'org_volunteer',
    'org_board_member', 'org_audit_member'
  ));

-- They are org-scoped, so scope_org_id must be non-null (like the org_* family).
alter table public.admin_role_grants
  drop constraint if exists admin_role_grants_scope_shape;

alter table public.admin_role_grants
  add constraint admin_role_grants_scope_shape check (
    case
      when role in ('super_admin','admin','moderator','support')
        then scope_org_id is null
      when role in (
        'operator','operators_manager',
        'org_admin','org_manager','org_employee',
        'volunteer_manager','org_volunteer',
        'org_board_member','org_audit_member'
      )
        then scope_org_id is not null
    end
  );

-- ── 2. Widen audit_events action allow-list (v7 → v8) ───────────────────────
alter table public.audit_events
  drop constraint if exists audit_events_action_check;
alter table public.audit_events
  add constraint audit_events_action_check_v8 check (action in (
    'block_user','unblock_user',
    'report_target',
    'auto_remove_target','manual_remove_target','restore_target',
    'suspend_user','unsuspend_user',
    'ban_user',
    'false_report_sanction_applied',
    'dismiss_report','confirm_report',
    'delete_message',
    'delete_account',
    'unmark_recipient_self',
    'admin_role_grant','admin_role_revoke',
    'admin_task_create','admin_task_update','admin_task_delete',
    'org_application_approve','org_application_reject',
    'post_edited',
    'org_formation_step_progress','org_formation_content_edit',
    'org_formation_member_assign','org_formation_member_remove'
  )) not valid;
alter table public.audit_events validate constraint audit_events_action_check_v8;
alter table public.audit_events
  rename constraint audit_events_action_check_v8 to audit_events_action_check;

-- ── 3. journeys ─────────────────────────────────────────────────────────────
create table if not exists public.org_formation_journeys (
  journey_id   uuid primary key default gen_random_uuid(),
  org_id       uuid not null default gen_random_uuid(),
  country_code text not null unique
                 check (country_code ~ '^[A-Z]{2}$'),
  status       text not null default 'in_progress'
                 check (status in ('in_progress','registered','active')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references public.users(user_id) on delete set null
);

comment on table public.org_formation_journeys is
  'FR-ADMIN-021 — one nonprofit-formation journey per country in this deployment. org_id scopes governance role grants.';

-- ── 4. step catalogue (editable content) ────────────────────────────────────
create table if not exists public.org_formation_steps (
  step_id          uuid primary key default gen_random_uuid(),
  country_code     text not null check (country_code ~ '^[A-Z]{2}$'),
  step_key         text not null check (char_length(step_key) between 1 and 64),
  sort_order       int  not null,
  title_fallback   text not null,
  body_text        text not null default '' check (char_length(body_text) <= 4000),
  tips             jsonb not null default '[]'::jsonb,
  is_critical_gate boolean not null default false,
  is_active        boolean not null default true,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references public.users(user_id) on delete set null,
  unique (country_code, step_key)
);

comment on table public.org_formation_steps is
  'FR-ADMIN-021 — editable step content (body_text + tips). Titles also live in app i18n keyed by step_key; title_fallback is the safety net.';

create index if not exists org_formation_steps_country_idx
  on public.org_formation_steps (country_code, sort_order) where is_active;

-- ── 5. per-journey checklist progress ───────────────────────────────────────
create table if not exists public.org_formation_step_progress (
  journey_id uuid not null references public.org_formation_journeys(journey_id) on delete cascade,
  step_key   text not null,
  status     text not null default 'not_started'
               check (status in ('not_started','in_progress','done')),
  note       text check (note is null or char_length(note) <= 2000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(user_id) on delete set null,
  primary key (journey_id, step_key)
);

-- ── 6. governance roster (board / audit) linked to RBAC grants ──────────────
create table if not exists public.org_formation_governance (
  assignment_id   uuid primary key default gen_random_uuid(),
  journey_id      uuid not null references public.org_formation_journeys(journey_id) on delete cascade,
  user_id         uuid not null references public.users(user_id) on delete cascade,
  governance_role text not null check (governance_role in ('board_member','audit_member')),
  role_grant_id   uuid references public.admin_role_grants(grant_id) on delete set null,
  created_at      timestamptz not null default now(),
  created_by      uuid references public.users(user_id) on delete set null,
  unique (journey_id, user_id, governance_role)
);

comment on table public.org_formation_governance is
  'FR-ADMIN-021 — board (ועד מנהל) / audit committee (ועדת ביקורת) members. §30 forbids the same person on both — enforced in org_formation_assign_member.';

-- ── 7. RLS — admin SELECT only; writes via SECURITY DEFINER RPCs ────────────
alter table public.org_formation_journeys      enable row level security;
alter table public.org_formation_steps         enable row level security;
alter table public.org_formation_step_progress enable row level security;
alter table public.org_formation_governance    enable row level security;

drop policy if exists org_formation_journeys_select on public.org_formation_journeys;
create policy org_formation_journeys_select on public.org_formation_journeys
  for select to authenticated
  using (public.has_admin_role(auth.uid(), 'super_admin'));

drop policy if exists org_formation_steps_select on public.org_formation_steps;
create policy org_formation_steps_select on public.org_formation_steps
  for select to authenticated
  using (public.has_admin_role(auth.uid(), 'super_admin'));

drop policy if exists org_formation_progress_select on public.org_formation_step_progress;
create policy org_formation_progress_select on public.org_formation_step_progress
  for select to authenticated
  using (public.has_admin_role(auth.uid(), 'super_admin'));

drop policy if exists org_formation_governance_select on public.org_formation_governance;
create policy org_formation_governance_select on public.org_formation_governance
  for select to authenticated
  using (public.has_admin_role(auth.uid(), 'super_admin'));

revoke insert, update, delete on
  public.org_formation_journeys, public.org_formation_steps,
  public.org_formation_step_progress, public.org_formation_governance
  from anon, authenticated;
grant select on
  public.org_formation_journeys, public.org_formation_steps,
  public.org_formation_step_progress, public.org_formation_governance
  to authenticated;

-- ── 8. Seed the Israel (IL) step catalogue ──────────────────────────────────
-- General guidance per חוק העמותות התש"ם-1980 and רשם העמותות (רשות התאגידים).
-- Content is editable in-app; this is the starting point, not legal advice.
insert into public.org_formation_steps
  (country_code, step_key, sort_order, title_fallback, body_text, tips, is_critical_gate)
values
  ('IL','name_selection',1,'בחירת שם ובדיקת זמינות',
   'בוחרים שם לעמותה ומוודאים מול רשם העמותות שאינו זהה או דומה מדי לשם של תאגיד רשום אחר, אינו מטעה ואינו פוגע בתקנת הציבור.',
   '["אפשר להציע שם חלופי למקרה שהראשון נדחה","שם המכיל ביטוי מוגן (למשל ''לאומי'') עשוי לדרוש אישור מיוחד"]'::jsonb,
   false),
  ('IL','objectives',2,'גיבוש מטרות העמותה',
   'מנסחים את מטרות העמותה — מטרות חוקיות שאינן מכוונות לחלוקת רווחים בין החברים. המטרות מהוות בסיס לפעילות ולתקנון.',
   '["נסחו מטרות רחבות מספיק כדי לאפשר גמישות עתידית","מטרה לא חוקית או חלוקת רווחים תמנע רישום"]'::jsonb,
   false),
  ('IL','founders',3,'איתור מייסדים (לפחות שניים)',
   'נדרשים לפחות שני מייסדים בגירים (יחידים או תאגידים). המייסדים חותמים על בקשת הרישום ועל התקנון.',
   '["מומלץ לצרף יותר משני מייסדים לגיבוי","מייסד יכול לשמש גם כחבר ועד או ועדת ביקורת"]'::jsonb,
   false),
  ('IL','bylaws',4,'ניסוח או אימוץ תקנון',
   'מאמצים תקנון לעמותה — אפשר לאמץ את התקנון המצוי שבתוספת הראשונה לחוק העמותות, או לנסח תקנון מותאם. התקנון מסדיר שם, מטרות, חברות, מוסדות וקבלת החלטות.',
   '["התקנון המצוי הוא ברירת מחדל מהירה ומקובלת","תקנון מותאם כדאי שייבדק ע''י עו''ד לפני ההגשה"]'::jsonb,
   false),
  ('IL','institutions',5,'הקמת מוסדות העמותה',
   'מקימים את מוסדות העמותה: האסיפה הכללית (כלל החברים), הוועד המנהל (לפחות שני חברים) וועדת ביקורת או גוף מבקר (חובה). חבר ועד אינו יכול לכהן בוועדת הביקורת.',
   '["שייכו כאן את חברי הוועד וועדת הביקורת מתוך משתמשי המערכת","§30 לחוק: אסורה חפיפה בין הוועד לוועדת הביקורת","מומלץ מספר אי-זוגי בוועד למניעת תיקו בהצבעות"]'::jsonb,
   true),
  ('IL','founders_declarations',6,'חתימת תצהירי מייסדים',
   'המייסדים חותמים על תצהירים בפני עורך דין, המאשרים את נכונות הפרטים ואת נכונותם להקים את העמותה.',
   '["יש להזדהות בפני עו''ד עם תעודה מזהה","ודאו שכל המייסדים זמינים לחתימה לפני קביעת מועד"]'::jsonb,
   false),
  ('IL','registration',7,'הגשת בקשת רישום ותשלום אגרה',
   'מגישים לרשם העמותות בקשת רישום הכוללת את טופס הבקשה, פרטי המייסדים, התצהירים, המטרות והתקנון, ומשלמים את אגרת הרישום.',
   '["אפשר להגיש מקוון דרך אתר רשות התאגידים","שמרו אישור תשלום ומספר אסמכתא להגשה"]'::jsonb,
   false),
  ('IL','certificate',8,'קבלת תעודת רישום ומספר עמותה',
   'לאחר אישור הבקשה מתקבלת תעודת רישום ומספר עמותה בן תשע ספרות (בקידומת 58). מרגע זה העמותה היא תאגיד רשום.',
   '["מספר העמותה נדרש לפתיחת חשבון בנק ולדיווחים","שמרו עותק סרוק של התעודה"]'::jsonb,
   false),
  ('IL','first_assembly',9,'כינוס אסיפה כללית ראשונה',
   'מכנסים אסיפה כללית ראשונה הבוחרת את מוסדות העמותה ומקבלת החלטות פתיחה (כגון מורשי חתימה).',
   '["נהלו פרוטוקול מסודר של ההחלטות","קבעו מורשי חתימה לחשבון הבנק"]'::jsonb,
   false),
  ('IL','bank_and_accounting',10,'פתיחת חשבון בנק והנהלת חשבונות',
   'פותחים חשבון בנק על שם העמותה ומקימים מערך הנהלת חשבונות לניהול תקין ולדיווח.',
   '["הבנק ידרוש את תעודת הרישום ופרוטוקול מורשי חתימה","הקפידו על הפרדה בין כספי העמותה לכספים פרטיים"]'::jsonb,
   false),
  ('IL','annual_reports',11,'דיווחים שנתיים לרשם',
   'מגישים מדי שנה לרשם העמותות דיווחים שנתיים — דוח מילולי ודוחות כספיים — בהתאם להיקף הפעילות.',
   '["עמותות מעל מחזור מסוים נדרשות לביקורת רואה חשבון","איחור בדיווח עלול לפגוע באישור הניהול התקין"]'::jsonb,
   false),
  ('IL','proper_management',12,'בקשת אישור ניהול תקין',
   'לאחר עמידה בדרישות הדיווח מבקשים מרשם העמותות אישור ניהול תקין. האישור נדרש לקבלת תמיכות ותקציבים ציבוריים.',
   '["בדרך כלל ניתן להגיש מהשנה השנייה–שלישית לפעילות","היערכו מראש עם דוחות מסודרים ופרוטוקולים"]'::jsonb,
   false),
  ('IL','tax_status',13,'מעמד מס (סעיף 46 ומלכ''ר) — אופציונלי',
   'אפשר להגיש בקשות להכרה כמוסד ציבורי לעניין זיכוי תרומות (סעיף 46 לפקודת מס הכנסה) ולמעמד מלכ''ר לעניין מע''מ.',
   '["סעיף 46 מאפשר לתורמים לקבל זיכוי במס","מעמד מלכ''ר משפיע על אופן הדיווח למע''מ"]'::jsonb,
   false)
on conflict (country_code, step_key) do nothing;

COMMIT;

-- 0230_glowe_bilingual_names — FR-GLOWE-024 (bilingual person + org display names).
--
-- GloWe stores an English variant of person/org names so the EN interface can
-- show Latin names without routing proper names through the UGC translation cache
-- (FR-TRANSLATE-005 AC4 deliberately excludes names). Pattern mirrors cities
-- (name_he / name_en): source name stays in display_name / org_name;
-- display_name_en / org_name_en hold the English/Latin form (user-editable,
-- auto-generated on onboarding when the source is non-Latin).
--
-- Content snapshots (posts.author_name_en, opportunities.organization_en) are
-- stamped at create time so historical cards keep the EN name that existed then.
--
-- Mapped to: FR-GLOWE-024, D-179. KC public.users.display_name unchanged.

set search_path = public;

alter table public.glowe_profiles
  add column if not exists display_name_en text,
  add column if not exists org_name_en text;

alter table public.glowe_profiles
  drop constraint if exists glowe_profiles_display_name_en_len;
alter table public.glowe_profiles
  add constraint glowe_profiles_display_name_en_len
  check (display_name_en is null or char_length(display_name_en) between 1 and 120);

alter table public.glowe_profiles
  drop constraint if exists glowe_profiles_org_name_en_len;
alter table public.glowe_profiles
  add constraint glowe_profiles_org_name_en_len
  check (org_name_en is null or char_length(org_name_en) between 1 and 120);

comment on column public.glowe_profiles.display_name_en is
  'English/Latin display name for the person (FR-GLOWE-024). Nullable; UI falls back to display_name.';
comment on column public.glowe_profiles.org_name_en is
  'English/Latin organization name (FR-GLOWE-024). Nullable; UI falls back to org_name.';

alter table public.glowe_posts
  add column if not exists author_name_en text;

alter table public.glowe_posts
  drop constraint if exists glowe_posts_author_name_en_len;
alter table public.glowe_posts
  add constraint glowe_posts_author_name_en_len
  check (author_name_en is null or char_length(author_name_en) between 1 and 120);

comment on column public.glowe_posts.author_name_en is
  'English snapshot of author_name at create time (FR-GLOWE-024).';

alter table public.glowe_opportunities
  add column if not exists organization_en text;

alter table public.glowe_opportunities
  drop constraint if exists glowe_opportunities_organization_en_len;
alter table public.glowe_opportunities
  add constraint glowe_opportunities_organization_en_len
  check (organization_en is null or char_length(organization_en) between 1 and 120);

comment on column public.glowe_opportunities.organization_en is
  'English snapshot of organization at create time (FR-GLOWE-024).';

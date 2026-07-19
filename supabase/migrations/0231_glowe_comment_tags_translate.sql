-- 0231_glowe_comment_tags_translate — FR-TRANSLATE-005 extension + FR-GLOWE-024.
--
-- 1) Bilingual snapshot on comments (author_name_en), matching posts.
-- 2) Allow content_type = glowe_comment in the UGC translation cache.
-- 3) Allow post tag chips as dotted array fields (tags.0 …) like opportunity
--    requirements/responsibilities.
--
-- Additive / idempotent. Mapped to spec: FR-TRANSLATE-005, FR-GLOWE-024.

set search_path = public;

alter table public.glowe_comments
  add column if not exists author_name_en text;

alter table public.glowe_comments
  drop constraint if exists glowe_comments_author_name_en_len;

alter table public.glowe_comments
  add constraint glowe_comments_author_name_en_len
  check (author_name_en is null or char_length(author_name_en) between 1 and 120);

comment on column public.glowe_comments.author_name_en is
  'FR-GLOWE-024 English/Latin author snapshot; not UGC-translated.';

alter table public.glowe_content_translations drop constraint if exists glowe_ct_type_chk;
alter table public.glowe_content_translations
  add constraint glowe_ct_type_chk check (
    content_type in (
      'glowe_post',
      'glowe_opportunity',
      'glowe_project',
      'glowe_profile',
      'glowe_comment'
    )
  );

alter table public.glowe_content_translations drop constraint if exists glowe_ct_field_chk;
alter table public.glowe_content_translations
  add constraint glowe_ct_field_chk check (
    field in (
      'title', 'text', 'description', 'about', 'focus', 'needs',
      'org_description', 'org_field'
    )
    or field ~ '^(requirements|responsibilities|tags)\.[0-9]+$'
  );

-- Purge comment translations when body changes.
create or replace function public.glowe_ct_purge_comment_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.text is distinct from old.text then
    delete from public.glowe_content_translations
     where content_type = 'glowe_comment' and content_id = new.id::text;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_glowe_ct_purge_comment_edit on public.glowe_comments;
create trigger trg_glowe_ct_purge_comment_edit
  after update of text on public.glowe_comments
  for each row execute function public.glowe_ct_purge_comment_edit();

create or replace function public.glowe_ct_purge_comment_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.glowe_content_translations
   where content_type = 'glowe_comment' and content_id = old.id::text;
  return old;
end;
$$;

drop trigger if exists trg_glowe_ct_purge_comment_delete on public.glowe_comments;
create trigger trg_glowe_ct_purge_comment_delete
  after delete on public.glowe_comments
  for each row execute function public.glowe_ct_purge_comment_delete();

-- Also purge post translations when tags change (chips are tags.N).
create or replace function public.glowe_ct_purge_post_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.title is distinct from old.title
     or new.text is distinct from old.text
     or new.tags is distinct from old.tags then
    delete from public.glowe_content_translations
     where content_type = 'glowe_post' and content_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_glowe_ct_purge_post_edit on public.glowe_posts;
create trigger trg_glowe_ct_purge_post_edit
  after update of title, text, tags on public.glowe_posts
  for each row execute function public.glowe_ct_purge_post_edit();

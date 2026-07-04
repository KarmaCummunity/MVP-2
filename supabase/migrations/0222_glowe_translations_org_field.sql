-- 0222_glowe_translations_org_field — FR-TRANSLATE-005.
--
-- Organization cards render a category tag from glowe_profiles.org_field (the
-- free-text "Cause / field", e.g. "Education"). Add it as a translatable
-- glowe_profile field and extend the profile edit-purge trigger to cover it.
--
-- Additive / idempotent. Mapped to spec: FR-TRANSLATE-005 (spec/18_translation.md).

set search_path = public;

alter table public.glowe_content_translations drop constraint if exists glowe_ct_field_chk;
alter table public.glowe_content_translations
  add constraint glowe_ct_field_chk check (
    field in ('title','text','description','about','focus','needs','org_description','org_field')
  );

-- Purge cached org-profile translations when org_field changes too.
create or replace function public.glowe_ct_purge_profile_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.about is distinct from old.about
     or new.focus is distinct from old.focus
     or new.needs is distinct from old.needs
     or new.org_description is distinct from old.org_description
     or new.org_field is distinct from old.org_field then
    delete from public.glowe_content_translations
     where content_type = 'glowe_profile' and content_id = new.id::text;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_profile_edit on public.glowe_profiles;
create trigger trg_glowe_ct_purge_profile_edit
  after update of about, focus, needs, org_description, org_field on public.glowe_profiles
  for each row execute function public.glowe_ct_purge_profile_edit();

-- 0226_glowe_translations_opportunity_arrays — FR-TRANSLATE-005.
--
-- Opportunity detail pages render requirements/responsibilities as text[] chips.
-- Each chip caches independently so a single chip edit only re-translates that
-- element (AC4). The glowe-translate function encodes the element as a dotted
-- field ("requirements.0", "responsibilities.3"); the cache stores that verbatim.
-- The prior glowe_ct_field_chk allow-list only permitted the 8 scalar field
-- names, so inserting a dotted array-element field violated the CHECK and the
-- single-flight insert threw → 500. Extend the CHECK to also accept the
-- per-element pattern for the two opportunity array columns.
--
-- Also extend the opportunity edit-purge trigger to fire when the arrays change,
-- so a chip edit drops its stale cached translations (re-translated lazily).
--
-- Additive / idempotent. Mapped to spec: FR-TRANSLATE-005 (spec/18_translation.md).

set search_path = public;

alter table public.glowe_content_translations drop constraint if exists glowe_ct_field_chk;
alter table public.glowe_content_translations
  add constraint glowe_ct_field_chk check (
    field in ('title','text','description','about','focus','needs','org_description','org_field')
    or field ~ '^(requirements|responsibilities)\.[0-9]+$'
  );

-- Purge cached opportunity translations when the array fields change too.
create or replace function public.glowe_ct_purge_opportunity_edit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.requirements is distinct from old.requirements
     or new.responsibilities is distinct from old.responsibilities then
    delete from public.glowe_content_translations
     where content_type = 'glowe_opportunity' and content_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_glowe_ct_purge_opp_edit on public.glowe_opportunities;
create trigger trg_glowe_ct_purge_opp_edit
  after update of title, description, requirements, responsibilities on public.glowe_opportunities
  for each row execute function public.glowe_ct_purge_opportunity_edit();

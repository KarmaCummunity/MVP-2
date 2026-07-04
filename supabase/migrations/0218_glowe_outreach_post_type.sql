-- 0218_glowe_outreach_post_type — Reach-out contact posts (FR-GLOWE-010 AC6).
--
-- Phase B. The Organizations directory's "Reach Out" CTA persists a private
-- outreach message as a glowe_posts row with post_type='outreach', status='sent'
-- (the recipient organization is encoded in the audience column). Both values are
-- currently rejected by the 0215 CHECK constraints, so we widen them:
--   • post_type: 'wish' | 'community'  →  + 'outreach'
--   • status:    'open' | 'fulfilled'  →  + 'sent'
-- The changes are additive (they only permit more values), so all existing rows
-- and inserts remain valid — backward-compatible.
--
-- Mapped to spec: FR-GLOWE-010 AC6 (spec/17_glowe_frontend.md).

set search_path = public;

alter table public.glowe_posts drop constraint if exists glowe_posts_post_type_chk;
alter table public.glowe_posts
  add constraint glowe_posts_post_type_chk check (post_type in ('wish', 'community', 'outreach'));

alter table public.glowe_posts drop constraint if exists glowe_posts_status_chk;
alter table public.glowe_posts
  add constraint glowe_posts_status_chk check (status in ('open', 'fulfilled', 'sent'));

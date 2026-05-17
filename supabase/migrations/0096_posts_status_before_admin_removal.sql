-- 0096_posts_status_before_admin_removal | FR-POST-008 owner list + D-35
-- Track the prior status when a post transitions to 'removed_admin' so the
-- /profile/removed screen can split open- and closed-pre-removal lanes,
-- mirroring /profile/hidden. Legacy 'removed_admin' rows (NULL) render under
-- the open lane by default in the UI (no backfill: actual prior status is
-- unknown and inferring from audit history is fragile).

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS status_before_admin_removal text
  CHECK (
    status_before_admin_removal IS NULL
    OR status_before_admin_removal IN ('open', 'closed_delivered', 'deleted_no_recipient')
  );

COMMENT ON COLUMN public.posts.status_before_admin_removal IS
  'Snapshot of posts.status taken by admin_remove_post() before flipping to removed_admin. NULL for legacy rows or for posts not in removed_admin. Drives the open/closed split on /profile/removed (FR-POST-008, D-35).';

-- Update admin_remove_post to capture the prior status atomically with the
-- transition. Idempotent: re-running on an already-removed post is a quiet
-- no-op (status_before_admin_removal preserved from the first call).
CREATE OR REPLACE FUNCTION public.admin_remove_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;

  IF NOT public.is_admin(v_actor) THEN
    RAISE EXCEPTION 'forbidden' USING errcode = '42501';
  END IF;

  UPDATE public.posts
     SET status_before_admin_removal = status,
         status = 'removed_admin',
         updated_at = now()
   WHERE post_id = p_post_id
     AND status <> 'removed_admin'
     AND status IN ('open', 'closed_delivered', 'deleted_no_recipient');

  IF NOT FOUND THEN
    -- Either the post does not exist, is already removed_admin, or is in a
    -- terminal state (expired) we don't admin-remove. Quiet no-op preserves
    -- legacy idempotency contract.
    RETURN;
  END IF;

  INSERT INTO public.audit_events (actor_id, action, target_type, target_id, metadata)
  VALUES (v_actor, 'manual_remove_target', 'post', p_post_id, '{}'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_remove_post(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_remove_post(uuid) TO authenticated;

-- admin_restore_target (migration 0035) flips status back to 'open' and we
-- intentionally KEEP status_before_admin_removal — it has no meaning once
-- status <> 'removed_admin' but preserving it adds zero risk and avoids a
-- second function-replace migration. UI logic ignores the column unless
-- status = 'removed_admin'. If we revisit, drop it in a follow-up.

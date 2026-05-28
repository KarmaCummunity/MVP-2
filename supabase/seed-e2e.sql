-- E2E fixture notes for Supabase dev (roeefqpdbftlndzsvhfj).
-- Auth user must be created via Dashboard or scripts/ensure-e2e-user.mjs credentials.
-- After first sign-in, ensure public.users.account_status = 'active' for the E2E user if needed.

-- Example (run manually with real uuid from auth.users):
-- UPDATE public.users SET account_status = 'active' WHERE id = '<e2e-user-uuid>';

-- ════════════════════════════════════════════════════════════════
-- Migration: 010_enforce_email_verification.sql
-- Description: Enforce Firebase email_verified claim at the DB level
-- ════════════════════════════════════════════════════════════════

-- 1. Helper function to safely read email_verified claim from JWT
CREATE OR REPLACE FUNCTION public.is_email_verified()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email_verified')::boolean,
    false
  );
$$;

COMMENT ON FUNCTION public.is_email_verified() IS 
  'Extracts the email_verified boolean claim from the Firebase JWT.';

-- 2. Update RLS policies to strictly require email verification

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (select public.requesting_user_id()) = id
    AND (select public.is_email_verified()) = true
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (
    (select public.requesting_user_id()) = id
  )
  WITH CHECK (
    (select public.requesting_user_id()) = id
    AND (select public.is_email_verified()) = true
  );

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

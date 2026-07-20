-- ════════════════════════════════════════════════════════════════
-- SunarKhata — Production Authentication Schema
-- ════════════════════════════════════════════════════════════════
-- Run this ENTIRE script in Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════
-- 1. PROFILES TABLE
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  full_name       TEXT DEFAULT '',
  business_name   TEXT DEFAULT '',
  preferred_unit  TEXT DEFAULT 'gram',
  default_purity  NUMERIC DEFAULT 100,
  plan            TEXT DEFAULT 'free',
  auth_provider   TEXT DEFAULT 'email' CHECK (auth_provider IN ('email', 'google')),
  onboarding_complete BOOLEAN DEFAULT false,
  terms_accepted  BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  terms_version   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles — one row per auth.users entry';
COMMENT ON COLUMN public.profiles.username IS 'Globally unique username, stored lowercase';
COMMENT ON COLUMN public.profiles.auth_provider IS 'How the user signed up: email or google';
COMMENT ON COLUMN public.profiles.onboarding_complete IS 'false for Google users who haven''t chosen a username yet';


-- ═══════════════════════════════════════════════════
-- 2. INDEXES
-- ═══════════════════════════════════════════════════

-- Case-insensitive unique index on username (prevents duplicates regardless of case)
-- Excludes empty strings (Google users before onboarding)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (LOWER(username))
  WHERE username <> '';

-- Fast lookup for login-by-email
CREATE INDEX IF NOT EXISTS profiles_email_idx
  ON public.profiles (LOWER(email));


-- ═══════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert is handled by the trigger (SECURITY DEFINER), but also allow
-- direct inserts for the user's own row (edge cases / fallback)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to look up other profiles by username
-- (needed for mutual account partner display names)
DROP POLICY IF EXISTS "profiles_select_by_username" ON public.profiles;
CREATE POLICY "profiles_select_by_username"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════
-- 4. AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    email,
    full_name,
    business_name,
    auth_provider,
    onboarding_complete
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', ''),
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      ''
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', ''),
    CASE
      WHEN NEW.raw_app_meta_data ->> 'provider' = 'google' THEN 'google'
      ELSE 'email'
    END,
    CASE
      -- Email users are fully onboarded at signup (they provide username during registration)
      WHEN NEW.raw_app_meta_data ->> 'provider' = 'google' THEN false
      ELSE true
    END
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ═══════════════════════════════════════════════════
-- 5. RPC FUNCTIONS
-- ═══════════════════════════════════════════════════

-- Check if a username is available (case-insensitive)
-- Returns TRUE if available, FALSE if taken
CREATE OR REPLACE FUNCTION public.check_username_availability(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(username) = LOWER(p_username)
      AND username <> ''
  );
END;
$$;

-- Resolve username → email (for username-based login)
-- Returns the email address associated with a username, or NULL
CREATE OR REPLACE FUNCTION public.get_email_for_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM public.profiles
  WHERE LOWER(username) = LOWER(p_username)
    AND username <> ''
  LIMIT 1;
  RETURN v_email;
END;
$$;

-- Backward compatibility alias for existing code referencing check_khata_id
CREATE OR REPLACE FUNCTION public.check_khata_id(p_khata_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.check_username_availability(p_khata_id);
END;
$$;


-- ═══════════════════════════════════════════════════
-- 6. ENABLE REALTIME (for future mutual accounts)
-- ═══════════════════════════════════════════════════

-- Enable realtime on profiles so auth state propagates across tabs/devices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END
$$;


-- ═══════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════
-- After running this script, verify:
--   1. Table 'profiles' appears in Table Editor
--   2. RLS is enabled (lock icon visible)
--   3. Functions appear under Database → Functions
--   4. Trigger appears under Database → Triggers

-- ════════════════════════════════════════════════════════════════
-- Migration: 004_firebase_auth_migration.sql
-- Description: Migrate from Supabase Auth to Firebase Authentication.
--
-- Changes:
--   1. Create requesting_user_id() helper (returns JWT sub as TEXT)
--   2. Drop on_auth_user_created trigger and handle_new_user() function
--   3. Drop all foreign keys referencing auth.users
--   4. Convert all user ID columns from UUID to TEXT
--   5. Re-add primary key and foreign keys against profiles(id)
--   6. Rewrite all RLS policies to use requesting_user_id()
--   7. Rewrite join_mutual_account RPC
--
-- IMPORTANT: Run this AFTER configuring Supabase Third-Party Auth
--            for Firebase in the Supabase Dashboard.
-- ════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════
-- STEP 1: Create requesting_user_id() helper
-- Returns the JWT 'sub' claim as TEXT (works with Firebase UIDs)
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  );
$$;

COMMENT ON FUNCTION public.requesting_user_id() IS
  'Returns the authenticated user ID from the JWT sub claim as TEXT. '
  'Compatible with Firebase UIDs (non-UUID strings). '
  'Use this instead of auth.uid() in all RLS policies.';


-- ═══════════════════════════════════════════════════
-- STEP 2: Drop trigger and function for auto-profile creation
-- Firebase does not insert into auth.users, so this trigger is dead.
-- Profile creation now happens in the application layer.
-- ═══════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();


-- ═══════════════════════════════════════════════════
-- STEP 3: Drop all foreign keys referencing auth.users
-- ═══════════════════════════════════════════════════

-- profiles.id → auth.users(id)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- mutual_accounts.creator_id → auth.users(id)
ALTER TABLE public.mutual_accounts DROP CONSTRAINT IF EXISTS mutual_accounts_creator_id_fkey;

-- mutual_accounts.partner_id → auth.users(id)
ALTER TABLE public.mutual_accounts DROP CONSTRAINT IF EXISTS mutual_accounts_partner_id_fkey;

-- mutual_accounts.close_requested_by → auth.users(id)
ALTER TABLE public.mutual_accounts DROP CONSTRAINT IF EXISTS mutual_accounts_close_requested_by_fkey;

-- mutual_transactions.created_by → auth.users(id)
ALTER TABLE public.mutual_transactions DROP CONSTRAINT IF EXISTS mutual_transactions_created_by_fkey;

-- mutual_transactions.cancel_requested_by → auth.users(id)
ALTER TABLE public.mutual_transactions DROP CONSTRAINT IF EXISTS mutual_transactions_cancel_requested_by_fkey;


-- ═══════════════════════════════════════════════════
-- STEP 4: Convert all user ID columns from UUID to TEXT
-- UUID strings are valid TEXT values — no data loss.
-- ═══════════════════════════════════════════════════

ALTER TABLE public.profiles
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

ALTER TABLE public.mutual_accounts
  ALTER COLUMN creator_id TYPE TEXT USING creator_id::TEXT;

ALTER TABLE public.mutual_accounts
  ALTER COLUMN partner_id TYPE TEXT USING partner_id::TEXT;

ALTER TABLE public.mutual_accounts
  ALTER COLUMN close_requested_by TYPE TEXT USING close_requested_by::TEXT;

ALTER TABLE public.mutual_transactions
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE public.mutual_transactions
  ALTER COLUMN cancel_requested_by TYPE TEXT USING cancel_requested_by::TEXT;


-- ═══════════════════════════════════════════════════
-- STEP 5: Re-add primary key and foreign keys
-- Foreign keys now reference profiles(id) instead of auth.users(id)
-- ═══════════════════════════════════════════════════

ALTER TABLE public.profiles ADD PRIMARY KEY (id);

ALTER TABLE public.mutual_accounts
  ADD CONSTRAINT mutual_accounts_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.mutual_accounts
  ADD CONSTRAINT mutual_accounts_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.mutual_accounts
  ADD CONSTRAINT mutual_accounts_close_requested_by_fkey
  FOREIGN KEY (close_requested_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.mutual_transactions
  ADD CONSTRAINT mutual_transactions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.mutual_transactions
  ADD CONSTRAINT mutual_transactions_cancel_requested_by_fkey
  FOREIGN KEY (cancel_requested_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


-- ═══════════════════════════════════════════════════
-- STEP 6: Rewrite ALL RLS policies to use requesting_user_id()
-- ═══════════════════════════════════════════════════

-- ── profiles table ──

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING ((select public.requesting_user_id()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING ((select public.requesting_user_id()) = id)
  WITH CHECK ((select public.requesting_user_id()) = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK ((select public.requesting_user_id()) = id);

-- Allow authenticated users to look up other profiles by username
-- Uses auth.jwt() to check role claim instead of auth.role()
DROP POLICY IF EXISTS "profiles_select_by_username" ON public.profiles;
CREATE POLICY "profiles_select_by_username"
  ON public.profiles FOR SELECT
  USING (
    (select auth.jwt() ->> 'role') = 'authenticated'
  );


-- ── mutual_accounts table ──

DROP POLICY IF EXISTS "Users can select their mutual accounts" ON public.mutual_accounts;
CREATE POLICY "Users can select their mutual accounts"
  ON public.mutual_accounts FOR SELECT
  USING (
    (select public.requesting_user_id()) = creator_id
    OR (select public.requesting_user_id()) = partner_id
  );

DROP POLICY IF EXISTS "Users can insert mutual accounts as creator" ON public.mutual_accounts;
CREATE POLICY "Users can insert mutual accounts as creator"
  ON public.mutual_accounts FOR INSERT
  WITH CHECK ((select public.requesting_user_id()) = creator_id);

DROP POLICY IF EXISTS "Users can update their mutual accounts" ON public.mutual_accounts;
CREATE POLICY "Users can update their mutual accounts"
  ON public.mutual_accounts FOR UPDATE
  USING (
    (select public.requesting_user_id()) = creator_id
    OR (select public.requesting_user_id()) = partner_id
  );

DROP POLICY IF EXISTS "Users can delete their mutual accounts" ON public.mutual_accounts;
CREATE POLICY "Users can delete their mutual accounts"
  ON public.mutual_accounts FOR DELETE
  USING (
    (select public.requesting_user_id()) = creator_id
    OR (select public.requesting_user_id()) = partner_id
  );


-- ── mutual_transactions table ──

DROP POLICY IF EXISTS "Users can select transactions for their mutual accounts" ON public.mutual_transactions;
CREATE POLICY "Users can select transactions for their mutual accounts"
  ON public.mutual_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mutual_accounts
      WHERE id = mutual_transactions.account_id
      AND (
        creator_id = (select public.requesting_user_id())
        OR partner_id = (select public.requesting_user_id())
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert transactions for their mutual accounts" ON public.mutual_transactions;
CREATE POLICY "Users can insert transactions for their mutual accounts"
  ON public.mutual_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mutual_accounts
      WHERE id = account_id
      AND (
        creator_id = (select public.requesting_user_id())
        OR partner_id = (select public.requesting_user_id())
      )
    )
  );

DROP POLICY IF EXISTS "Users can update transactions for their mutual accounts" ON public.mutual_transactions;
CREATE POLICY "Users can update transactions for their mutual accounts"
  ON public.mutual_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.mutual_accounts
      WHERE id = mutual_transactions.account_id
      AND (
        creator_id = (select public.requesting_user_id())
        OR partner_id = (select public.requesting_user_id())
      )
    )
  );


-- ═══════════════════════════════════════════════════
-- STEP 7: Rewrite join_mutual_account RPC
-- Uses requesting_user_id() instead of auth.uid()
-- ═══════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.join_mutual_account(text, text, text);

CREATE OR REPLACE FUNCTION public.join_mutual_account(
    p_code text,
    p_creator_alias text,
    p_partner_name text
)
RETURNS SETOF public.mutual_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account public.mutual_accounts;
    v_user_id text;
BEGIN
    -- Get the authenticated user's ID from the JWT
    v_user_id := public.requesting_user_id();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Find the waiting account and lock it
    SELECT * INTO v_account
    FROM public.mutual_accounts
    WHERE invite_code = p_code
    AND status = 'waiting'
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    -- 2. Validate existence and expiry
    IF v_account.id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite code';
    END IF;

    IF v_account.creator_id = v_user_id THEN
        RAISE EXCEPTION 'Cannot join your own account';
    END IF;

    IF extract(epoch from (now() - v_account.invite_code_created_at)) >= 300 THEN
        RAISE EXCEPTION 'Invite code has expired';
    END IF;

    -- 3. Perform the update securely
    RETURN QUERY
    UPDATE public.mutual_accounts
    SET
        partner_id = v_user_id,
        partner_name = substring(trim(p_partner_name) from 1 for 50),
        creator_alias = substring(trim(p_creator_alias) from 1 for 50),
        status = 'connected',
        invite_code = NULL,
        last_activity = now()
    WHERE id = v_account.id
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_mutual_account(text, text, text) TO authenticated;


-- ═══════════════════════════════════════════════════
-- STEP 8: Update get_mutual_account_by_code RPC
-- No auth dependency — no changes needed, just re-verify signature
-- ═══════════════════════════════════════════════════

-- (No changes needed — this function is SECURITY DEFINER and
--  does not reference auth.uid() or auth.role())


-- ═══════════════════════════════════════════════════
-- DONE — Notify PostgREST to reload schema
-- ═══════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';

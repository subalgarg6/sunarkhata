-- ════════════════════════════════════════════════════════════════
-- Migration: 006_restore_rls_policies.sql
-- Description: Restores RLS policies that were dropped by the 
--              failed 004 migration attempt.
-- ════════════════════════════════════════════════════════════════

BEGIN;

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

COMMIT;
NOTIFY pgrst, 'reload schema';

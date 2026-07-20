-- ════════════════════════════════════════════════════════════════
-- Migration: 005_firebase_dynamic_migration.sql
-- Description: Introspective migration to Firebase Authentication.
--              Dynamically handles existing schema state, gracefully 
--              recovers from partial attempts, and rewrites policies.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════
-- 1. Helper Function
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

-- ═══════════════════════════════════════════════════
-- 2. Clean Up Legacy Auth Triggers
-- ═══════════════════════════════════════════════════
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ═══════════════════════════════════════════════════
-- 3. Dynamic Introspection & Alteration
-- ═══════════════════════════════════════════════════
DO $$
DECLARE
    r RECORD;
    pol_def_qual text;
    pol_def_with_check text;
    sql_cmd text;
    f_oid oid;
    f_def text;
BEGIN
    -- ---------------------------------------------------------
    -- A. Drop all foreign keys dependent on profiles(id) or auth.users(id)
    --    This allows us to alter the column types safely.
    -- ---------------------------------------------------------
    ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
    ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE IF EXISTS public.mutual_accounts DROP CONSTRAINT IF EXISTS mutual_accounts_creator_id_fkey;
    ALTER TABLE IF EXISTS public.mutual_accounts DROP CONSTRAINT IF EXISTS mutual_accounts_partner_id_fkey;
    ALTER TABLE IF EXISTS public.mutual_accounts DROP CONSTRAINT IF EXISTS mutual_accounts_close_requested_by_fkey;
    ALTER TABLE IF EXISTS public.mutual_transactions DROP CONSTRAINT IF EXISTS mutual_transactions_created_by_fkey;
    ALTER TABLE IF EXISTS public.mutual_transactions DROP CONSTRAINT IF EXISTS mutual_transactions_cancel_requested_by_fkey;
    ALTER TABLE IF EXISTS public.closure_activity DROP CONSTRAINT IF EXISTS closure_activity_by_user_id_fkey;
    ALTER TABLE IF EXISTS public.promo_redemptions DROP CONSTRAINT IF EXISTS promo_redemptions_user_id_fkey;
    ALTER TABLE IF EXISTS public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
    ALTER TABLE IF EXISTS public.individual_accounts DROP CONSTRAINT IF EXISTS individual_accounts_user_id_fkey;
    ALTER TABLE IF EXISTS public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

    -- ---------------------------------------------------------
    -- B. Introspect and back up all RLS policies in the public schema
    --    PostgreSQL blocks ALTER TYPE if a policy references the column.
    -- ---------------------------------------------------------
    CREATE TEMP TABLE temp_policies (
        schemaname text,
        tablename text,
        policyname text,
        cmd text,
        roles text[],
        qual text,
        with_check text
    );

    FOR r IN 
        SELECT 
            n.nspname AS schemaname,
            c.relname AS tablename,
            p.polname AS policyname,
            CASE p.polcmd
                WHEN 'r' THEN 'SELECT'
                WHEN 'a' THEN 'INSERT'
                WHEN 'w' THEN 'UPDATE'
                WHEN 'd' THEN 'DELETE'
                WHEN '*' THEN 'ALL'
            END AS cmd,
            (SELECT array_agg(rolname) FROM pg_roles WHERE oid = ANY(p.polroles)) AS roles,
            pg_get_expr(p.polqual, p.polrelid) AS qual,
            pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
        FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        -- Save exact live policy definitions
        INSERT INTO temp_policies VALUES (
            r.schemaname, r.tablename, r.policyname, r.cmd, r.roles, r.qual, r.with_check
        );
        
        -- Drop the live policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;

    -- ---------------------------------------------------------
    -- C. Alter all user ID columns from UUID to TEXT
    -- ---------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id') THEN
        ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'individual_accounts' AND column_name = 'user_id') THEN
        ALTER TABLE public.individual_accounts ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id') THEN
        ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mutual_accounts' AND column_name = 'creator_id') THEN
        ALTER TABLE public.mutual_accounts ALTER COLUMN creator_id TYPE TEXT USING creator_id::TEXT;
        ALTER TABLE public.mutual_accounts ALTER COLUMN partner_id TYPE TEXT USING partner_id::TEXT;
        ALTER TABLE public.mutual_accounts ALTER COLUMN close_requested_by TYPE TEXT USING close_requested_by::TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mutual_transactions' AND column_name = 'created_by') THEN
        ALTER TABLE public.mutual_transactions ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
        ALTER TABLE public.mutual_transactions ALTER COLUMN cancel_requested_by TYPE TEXT USING cancel_requested_by::TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'closure_activity' AND column_name = 'by_user_id') THEN
        ALTER TABLE public.closure_activity ALTER COLUMN by_user_id TYPE TEXT USING by_user_id::TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promo_redemptions' AND column_name = 'user_id') THEN
        ALTER TABLE public.promo_redemptions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    END IF;

    -- ---------------------------------------------------------
    -- D. Recreate policies exactly as they were, substituting auth.uid()
    -- ---------------------------------------------------------
    FOR r IN SELECT * FROM temp_policies LOOP
        sql_cmd := format('CREATE POLICY %I ON %I.%I FOR %s ', r.policyname, r.schemaname, r.tablename, r.cmd);
        
        IF array_length(r.roles, 1) > 0 AND r.roles[1] != 'public' THEN
            sql_cmd := sql_cmd || format('TO %s ', array_to_string(r.roles, ', '));
        END IF;

        IF r.qual IS NOT NULL THEN
            -- String replace auth.uid() with our helper
            pol_def_qual := replace(r.qual, 'auth.uid()', '(select public.requesting_user_id())');
            sql_cmd := sql_cmd || format('USING (%s) ', pol_def_qual);
        END IF;

        IF r.with_check IS NOT NULL THEN
            pol_def_with_check := replace(r.with_check, 'auth.uid()', '(select public.requesting_user_id())');
            sql_cmd := sql_cmd || format('WITH CHECK (%s)', pol_def_with_check);
        END IF;

        EXECUTE sql_cmd;
    END LOOP;
    
    DROP TABLE temp_policies;

    -- ---------------------------------------------------------
    -- E. Dynamically update RPC functions (UUID -> TEXT arguments)
    -- ---------------------------------------------------------
    FOR f_oid IN
        SELECT p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN ('soft_delete_account', 'get_account_count', 'get_transaction_count')
    LOOP
        f_def := pg_get_functiondef(f_oid);
        
        -- Generate overloaded TEXT versions of the functions
        f_def := replace(f_def, 'p_user_id uuid', 'p_user_id text');
        f_def := replace(f_def, 'p_user_id UUID', 'p_user_id text');
        
        EXECUTE f_def;
        
        -- Drop the old UUID versions
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(uuid)', (SELECT proname FROM pg_proc WHERE oid = f_oid));
    END LOOP;

END $$;

-- ═══════════════════════════════════════════════════
-- 4. Re-add Primary Key and Foreign Keys
-- ═══════════════════════════════════════════════════
ALTER TABLE public.profiles ADD PRIMARY KEY (id);

ALTER TABLE IF EXISTS public.mutual_accounts
  ADD CONSTRAINT mutual_accounts_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.mutual_accounts
  ADD CONSTRAINT mutual_accounts_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.mutual_accounts
  ADD CONSTRAINT mutual_accounts_close_requested_by_fkey
  FOREIGN KEY (close_requested_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.mutual_transactions
  ADD CONSTRAINT mutual_transactions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.mutual_transactions
  ADD CONSTRAINT mutual_transactions_cancel_requested_by_fkey
  FOREIGN KEY (cancel_requested_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.individual_accounts
  ADD CONSTRAINT individual_accounts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.transactions
  ADD CONSTRAINT transactions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.promo_redemptions
  ADD CONSTRAINT promo_redemptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.closure_activity
  ADD CONSTRAINT closure_activity_by_user_id_fkey
  FOREIGN KEY (by_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- ═══════════════════════════════════════════════════
-- 5. Hardcoded Override for join_mutual_account
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
    v_user_id := public.requesting_user_id();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_account
    FROM public.mutual_accounts
    WHERE invite_code = p_code
    AND status = 'waiting'
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF v_account.id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite code';
    END IF;

    IF v_account.creator_id = v_user_id THEN
        RAISE EXCEPTION 'Cannot join your own account';
    END IF;

    IF extract(epoch from (now() - v_account.invite_code_created_at)) >= 300 THEN
        RAISE EXCEPTION 'Invite code has expired';
    END IF;

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


-- Commit the entire transaction. If anything above fails, the DB rolls back exactly as it was.
COMMIT;
NOTIFY pgrst, 'reload schema';

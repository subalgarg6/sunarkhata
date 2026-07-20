-- Migration: 002_mutual_accounts.sql
-- Description: Creates the mutual_accounts and mutual_transactions tables with proper RLS policies.

-- 1. Create mutual_accounts table
CREATE TABLE IF NOT EXISTS public.mutual_accounts (
    id uuid primary key default gen_random_uuid(),
    status text not null default 'waiting',
    creator_id uuid not null references auth.users(id) on delete cascade,
    creator_role text not null,
    other_party_name text not null,
    mobile_number text,
    partner_id uuid references auth.users(id) on delete set null,
    partner_name text,
    metal_balance numeric not null default 0,
    metal_class text not null,
    rupee_balance numeric not null default 0,
    rupee_class text not null,
    invite_code text,
    invite_code_created_at timestamptz,
    close_requested_by uuid references auth.users(id) on delete set null,
    close_requested_by_name text,
    close_requested_at timestamptz,
    closure_activity jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    last_activity timestamptz not null default now()
);

-- Enable RLS
ALTER TABLE public.mutual_accounts ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for mutual_accounts
DROP POLICY IF EXISTS "Users can select their mutual accounts" ON public.mutual_accounts;
CREATE POLICY "Users can select their mutual accounts" 
ON public.mutual_accounts FOR SELECT 
USING (auth.uid() = creator_id OR auth.uid() = partner_id);

-- Create a secure RPC for fetching a mutual account by invite code without exposing all waiting accounts
CREATE OR REPLACE FUNCTION public.get_mutual_account_by_code(p_code text)
RETURNS TABLE (
    id uuid,
    status text,
    creator_id uuid,
    creator_role text,
    other_party_name text,
    metal_balance numeric,
    metal_class text,
    rupee_balance numeric,
    rupee_class text,
    invite_code_created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        id, status, creator_id, creator_role, other_party_name,
        metal_balance, metal_class, rupee_balance, rupee_class, invite_code_created_at
    FROM public.mutual_accounts 
    WHERE invite_code = p_code 
    AND status = 'waiting' 
    LIMIT 1;
$$;

DROP POLICY IF EXISTS "Users can insert mutual accounts as creator" ON public.mutual_accounts;
CREATE POLICY "Users can insert mutual accounts as creator" 
ON public.mutual_accounts FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update their mutual accounts" ON public.mutual_accounts;
CREATE POLICY "Users can update their mutual accounts" 
ON public.mutual_accounts FOR UPDATE 
USING (auth.uid() = creator_id OR auth.uid() = partner_id); 

DROP POLICY IF EXISTS "Users can delete their mutual accounts" ON public.mutual_accounts;
CREATE POLICY "Users can delete their mutual accounts" 
ON public.mutual_accounts FOR DELETE 
USING (auth.uid() = creator_id OR auth.uid() = partner_id);

-- Create a secure RPC for joining a mutual account atomically
CREATE OR REPLACE FUNCTION public.join_mutual_account(p_code text, p_partner_name text)
RETURNS SETOF public.mutual_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account public.mutual_accounts;
BEGIN
    -- 1. Find the waiting account
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

    IF v_account.creator_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot join your own account';
    END IF;

    IF extract(epoch from (now() - v_account.invite_code_created_at)) >= 300 THEN
        RAISE EXCEPTION 'Invite code has expired';
    END IF;

    -- 3. Perform the update securely
    RETURN QUERY
    UPDATE public.mutual_accounts
    SET 
        partner_id = auth.uid(),
        partner_name = substring(trim(p_partner_name) from 1 for 50),
        status = 'connected',
        invite_code = NULL,
        last_activity = now()
    WHERE id = v_account.id
    RETURNING *;
END;
$$;


-- 2. Create mutual_transactions table
CREATE TABLE IF NOT EXISTS public.mutual_transactions (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references public.mutual_accounts(id) on delete cascade,
    section text not null,
    action text not null,
    amount numeric,
    rate numeric,
    rupee_amount numeric,
    result_grams numeric,
    result_rupee numeric,
    source_delta numeric,
    target_delta numeric,
    mention text,
    created_by uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pending',
    created_at timestamptz not null default now(),
    approval_deadline timestamptz,
    approved_at timestamptz,
    rejected_at timestamptz,
    cancelled_at timestamptz,
    cancel_requested_by uuid references auth.users(id) on delete set null,
    cancel_requested_at timestamptz,
    cancel_rejected_at timestamptz
);

-- Enable RLS
ALTER TABLE public.mutual_transactions ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for mutual_transactions
DROP POLICY IF EXISTS "Users can select transactions for their mutual accounts" ON public.mutual_transactions;
CREATE POLICY "Users can select transactions for their mutual accounts" 
ON public.mutual_transactions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.mutual_accounts 
        WHERE id = mutual_transactions.account_id 
        AND (creator_id = auth.uid() OR partner_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can insert transactions for their mutual accounts" ON public.mutual_transactions;
CREATE POLICY "Users can insert transactions for their mutual accounts" 
ON public.mutual_transactions FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.mutual_accounts 
        WHERE id = account_id 
        AND (creator_id = auth.uid() OR partner_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can update transactions for their mutual accounts" ON public.mutual_transactions;
CREATE POLICY "Users can update transactions for their mutual accounts" 
ON public.mutual_transactions FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.mutual_accounts 
        WHERE id = mutual_transactions.account_id 
        AND (creator_id = auth.uid() OR partner_id = auth.uid())
    )
);

-- 3. Configure Realtime safely
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Idempotent addition to publication
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mutual_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mutual_accounts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mutual_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mutual_transactions;
  END IF;
END $$;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mutual_accounts_creator_id ON public.mutual_accounts(creator_id);
CREATE INDEX IF NOT EXISTS idx_mutual_accounts_partner_id ON public.mutual_accounts(partner_id);
CREATE INDEX IF NOT EXISTS idx_mutual_accounts_invite_code ON public.mutual_accounts(invite_code) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_mutual_transactions_account_id ON public.mutual_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_mutual_transactions_status ON public.mutual_transactions(status);

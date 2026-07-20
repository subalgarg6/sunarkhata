-- Migration: 003_add_creator_alias.sql
-- Description: Adds creator_alias column to mutual_accounts and updates join_mutual_account RPC

ALTER TABLE public.mutual_accounts
ADD COLUMN IF NOT EXISTS creator_alias text;

-- Drop the old RPC to avoid signature conflicts if we were to change the number of arguments,
-- but we are just replacing it with the same name. We'll update the signature to take both names.
DROP FUNCTION IF EXISTS public.join_mutual_account(text, text);
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
BEGIN
    -- 1. Find the waiting account and lock it to prevent race conditions
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
        creator_alias = substring(trim(p_creator_alias) from 1 for 50),
        status = 'connected',
        invite_code = NULL,
        last_activity = now()
    WHERE id = v_account.id
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_mutual_account(text, text, text) TO authenticated;
NOTIFY pgrst, 'reload schema';

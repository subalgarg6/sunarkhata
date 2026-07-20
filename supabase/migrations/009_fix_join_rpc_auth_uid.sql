-- Migration: 009_fix_join_rpc_auth_uid.sql
-- Description: Replaces leftover auth.uid() (uuid) calls with public.requesting_user_id() (text) in the join_mutual_account RPC.

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

    -- FIX 1: Replaced auth.uid() with public.requesting_user_id() to resolve text = uuid error
    IF v_account.creator_id = public.requesting_user_id() THEN
        RAISE EXCEPTION 'Cannot join your own account';
    END IF;

    IF extract(epoch from (now() - v_account.invite_code_created_at)) >= 300 THEN
        RAISE EXCEPTION 'Invite code has expired';
    END IF;

    -- 3. Perform the update securely
    RETURN QUERY
    UPDATE public.mutual_accounts
    SET 
        -- FIX 2: Replaced auth.uid() with public.requesting_user_id() to resolve uuid to text assignment error
        partner_id = public.requesting_user_id(),
        partner_name = substring(trim(p_partner_name) from 1 for 50),
        status = 'connected',
        invite_code = NULL,
        last_activity = now()
    WHERE id = v_account.id
    RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_mutual_account(text, text) TO authenticated;
NOTIFY pgrst, 'reload schema';

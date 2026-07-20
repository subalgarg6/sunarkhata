-- Migration: 008_fix_join_rpc.sql
-- Description: Reverts join_mutual_account RPC to match the live database schema 
-- which does not have the creator_alias column.

DROP FUNCTION IF EXISTS public.join_mutual_account(text, text, text);
DROP FUNCTION IF EXISTS public.join_mutual_account(text, text);

CREATE OR REPLACE FUNCTION public.join_mutual_account(
    p_code text,
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

    -- 3. Perform the update securely without creator_alias
    RETURN QUERY
    UPDATE public.mutual_accounts
    SET
        partner_id = v_user_id,
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

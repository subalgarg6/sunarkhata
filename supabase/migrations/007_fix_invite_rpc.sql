-- ════════════════════════════════════════════════════════════════
-- Migration: 007_fix_invite_rpc.sql
-- Description: Updates get_mutual_account_by_code RPC to return
--              creator_id as text instead of uuid, fixing the
--              "invalid input syntax for type uuid" error caused 
--              by the Firebase migration.
-- ════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.get_mutual_account_by_code(text);

CREATE OR REPLACE FUNCTION public.get_mutual_account_by_code(p_code text)
RETURNS TABLE (
    id uuid,
    status text,
    creator_id text,
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

GRANT EXECUTE ON FUNCTION public.get_mutual_account_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mutual_account_by_code(text) TO anon;

COMMIT;
NOTIFY pgrst, 'reload schema';

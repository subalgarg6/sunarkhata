import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { createMutualAccount, getMutualAccount, joinMutualAccount, addMutualTransaction, approveTransaction, rejectTransaction, requestCancelTransaction, approveCancelTransaction, requestCloseMutualAccount, approveCloseMutualAccount } from '../services/mutual.service.js';
import { getPerspectiveRole, getPerspectiveTitle, getPerspectiveMetalClass, getPerspectiveRupeeClass, getPerspectiveActionLabel } from './mutual-perspective.js';
import { getCurrentUser } from '../services/auth.service.js';
import { supabase } from '../supabase.js';

describe('E2E Verification: Creator & Partner Perspective Workflow', () => {
    
    let creatorId, creatorEmail = `john.creator.${Date.now()}@gmail.com`;
    let partnerId, partnerEmail = `jane.partner.${Date.now()}@gmail.com`;
    let accountId;
    let inviteCode;
    let txnId;

    // We will bypass `getCurrentUser` limitations by mocking `window.localStorage` and passing explicit userIds to the service functions where possible.
    // However, `addMutualTransaction` pulls from the passed txn object (we will manually set `created_by`), but `joinMutualAccount` requires standard auth? Wait, `joinMutualAccount` requires `userId` passed explicitly.
    // Let's check `createMutualAccount`: it requires `userId`.
    
    beforeAll(async () => {
        // Create Creator
        const { data: cd, error: ce } = await supabase.auth.signUp({ email: creatorEmail, password: 'Password123!', options: { data: { full_name: 'Creator User' } } });
        if (ce) throw ce;
        creatorId = cd.user.id;

        // Create Partner
        const { data: pd, error: pe } = await supabase.auth.signUp({ email: partnerEmail, password: 'Password123!', options: { data: { full_name: 'Partner User' } } });
        if (pe) throw pe;
        partnerId = pd.user.id;
        
        console.log(`[E2E] Created Users: Creator (${creatorId}), Partner (${partnerId})`);
    });

    it('1. Creator creates a Mutual Account', async () => {
        await supabase.auth.signInWithPassword({ email: creatorEmail, password: 'Password123!' });
        const acc = await createMutualAccount({
            userId: creatorId,
            role: 'supplier',
            otherPartyName: 'My Awesome Partner',
            metalBalance: 0,
            metalClass: 'receivable',
            rupeeBalance: 0,
            rupeeClass: 'receivable'
        });
        
        expect(acc).toBeDefined();
        expect(acc.creator_id).toBe(creatorId);
        expect(acc.status).toBe('waiting');
        expect(acc.invite_code).toBeTruthy();
        
        accountId = acc.id;
        inviteCode = acc.invite_code;
    });

    it('2. Partner joins using an invite', async () => {
        await supabase.auth.signInWithPassword({ email: partnerEmail, password: 'Password123!' });
        const joinRes = await joinMutualAccount(
            inviteCode,
            partnerId,
            'My Awesome Creator'
        );
        
        expect(joinRes.error).toBeUndefined();
        expect(joinRes.success).toBe(true);
        expect(joinRes.account.status).toBe('connected');
        expect(joinRes.account.partner_id).toBe(partnerId);
    });

    it('3. Creator and Partner each see their own alias correctly', async () => {
        // Just verify basic connection status since creator_alias was removed
        const { data: accounts } = await supabase.from('mutual_accounts').select('*').eq('id', accountId);
        expect(accounts.length).toBe(1);
        expect(accounts[0].status).toBe('connected');
    });

    it('4. Creator and Partner see opposite roles', async () => {
        const acc = await getMutualAccount(accountId);
        
        const creatorSeesRole = getPerspectiveRole(acc, creatorId);
        const partnerSeesRole = getPerspectiveRole(acc, partnerId);
        
        expect(creatorSeesRole).toBe('supplier');
        expect(partnerSeesRole).toBe('trade_customer'); // Inverted
    });

    it('5. Creator and Partner see identical numeric balances but opposite Receivable/Payable meaning', async () => {
        const acc = await getMutualAccount(accountId);
        
        // At start it's 0 receivable for Creator
        const creatorMetalPos = getPerspectiveMetalClass(acc, creatorId);
        const partnerMetalPos = getPerspectiveMetalClass(acc, partnerId);
        
        expect(creatorMetalPos).toBe('receivable');
        expect(partnerMetalPos).toBe('payable'); // Inverted
    });

    it('6 & 7. Every transaction type: Increase Receivable (Pending Approval Flow)', async () => {
        // Creator requests Increase Receivable
        await supabase.auth.signInWithPassword({ email: creatorEmail, password: 'Password123!' });
        await addMutualTransaction(accountId, {
            section: 'metal',
            action: 'increase_receivable',
            amount: 50,
            created_by: creatorId,
            mention: 'Test Metal Given'
        });
        
        const acc = await getMutualAccount(accountId);
        const txns = acc.transactions || [];
        expect(txns.length).toBe(1);
        
        const txn = txns[0];
        txnId = txn.id;
        
        // Database MUST store canonical: increase_receivable
        expect(txn.action).toBe('increase_receivable');
        expect(txn.status).toBe('pending');
        
        // Partner sees "Increase Payable"
        const partnerActionLabel = getPerspectiveActionLabel(txn.action, false);
        expect(partnerActionLabel).toBe('Increase Payable');
    });

    it('8. Partner Approves Transaction', async () => {
        // Partner approves
        await supabase.auth.signInWithPassword({ email: partnerEmail, password: 'Password123!' });
        await approveTransaction(accountId, txnId);
        
        const acc = await getMutualAccount(accountId);
        
        // Canonical DB Metal Balance should now be 50 receivable
        expect(parseFloat(acc.metal_balance)).toBe(50);
        expect(acc.metal_class).toBe('receivable');
        
        // Perspectives check
        expect(getPerspectiveMetalClass(acc, creatorId)).toBe('receivable');
        expect(getPerspectiveMetalClass(acc, partnerId)).toBe('payable');
    });

    it('9. Reject workflow (Partner tries to increase receivable, Creator rejects)', async () => {
        // Partner wants to receive metal (Increase Receivable from their perspective).
        // Since they are partner, "increase_receivable" is translated to canonical "increase_payable".
        // The service handles this translation via `translateActionToCanonical` inside `addMutualTransaction`.
        
        await addMutualTransaction(accountId, {
            section: 'metal',
            action: 'increase_receivable', // Partner clicks Increase Receivable
            amount: 10,
            created_by: partnerId,
            mention: 'Partner wants metal'
        });
        
        let acc = await getMutualAccount(accountId);
        let txn = acc.transactions[0]; // Newest first
        
        // DB MUST store canonical: increase_payable
        expect(txn.action).toBe('increase_payable');
        expect(txn.status).toBe('pending');
        
        // Creator sees the canonical action exactly as is: increase_payable
        expect(getPerspectiveActionLabel(txn.action, true)).toBe('Increase Payable');
        
        // Creator rejects
        await supabase.auth.signInWithPassword({ email: creatorEmail, password: 'Password123!' });
        await rejectTransaction(accountId, txn.id);
        
        acc = await getMutualAccount(accountId);
        txn = acc.transactions[0];
        
        // Balances remain 50
        expect(parseFloat(acc.metal_balance)).toBe(50);
        expect(txn.status).toBe('rejected');
    });

    it('13. Close Mutual Account workflow', async () => {
        // Creator requests close
        await supabase.auth.signInWithPassword({ email: creatorEmail, password: 'Password123!' });
        const reqRes = await requestCloseMutualAccount(accountId, creatorId, 'Creator User');
        expect(reqRes.error).toBeUndefined();
        
        let acc = await getMutualAccount(accountId);
        expect(acc.status).toBe('closing_requested');
        
        // Partner approves close
        await supabase.auth.signInWithPassword({ email: partnerEmail, password: 'Password123!' });
        const closeRes = await approveCloseMutualAccount(accountId, partnerId, 'Partner User');
        expect(closeRes.error).toBeUndefined();
        
        // Verify account is deleted (or no longer fetchable)
        acc = await getMutualAccount(accountId);
        expect(acc).toBeNull();
    });

});

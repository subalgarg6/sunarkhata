/**
 * SunarKhata — Mutual Account Service (Supabase)
 * Uses central position engine. Transactions require partner approval.
 */

import { supabase, isSupabaseConfigured } from '../supabase.js';
import { toFineGold, rupeeToMetal, metalToRupee } from './individual.service.js';
import { applyPositionChange, getSignedDelta, applySignedDelta, normalizePosition } from '../utils/position-engine.js';
import { isCreator, translateActionToCanonical } from '../utils/mutual-perspective.js';
import { validateRupeeLimit, validateMetalLimit } from '../utils/business-rules.js';
import { MAX_ACCOUNT_NAME_LENGTH, MAX_MENTION_LENGTH } from '../utils/constants.js';

const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

let realtimeSubscription = null;

export function initMutualRealtime() {
  if (!isSupabaseConfigured || !supabase) return;
  if (realtimeSubscription) return;

  realtimeSubscription = supabase
    .channel('public:mutual_events')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mutual_accounts' }, payload => {
      window.dispatchEvent(new CustomEvent('mutual-account-updated', { detail: payload }));
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mutual_transactions' }, payload => {
      window.dispatchEvent(new CustomEvent('mutual-account-updated', { detail: payload }));
    })
    .subscribe();
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const charLen = chars.length;
  let code = '';
  const array = new Uint8Array(1);
  while (code.length < 20) {
    window.crypto.getRandomValues(array);
    if (array[0] < Math.floor(256 / charLen) * charLen) {
      code += chars[array[0] % charLen];
    }
  }
  return code;
}

// ── Helpers ──
async function _fetchTransactions(accountId) {
  console.log(`[DEBUG] _fetchTransactions: Querying for account ${accountId}...`);
  const { data, error } = await supabase
    .from('mutual_transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });
  console.log(`[DEBUG] _fetchTransactions: Query completed for ${accountId}. Error:`, error, 'Data:', data ? data.length : 0);
  if (error) throw new Error(error.message);
  return data || [];
}

async function _updateAccount(accountId, updates) {
  updates.last_activity = new Date().toISOString();
  console.log('[DEBUG] _updateAccount: starting for id:', accountId, 'with updates:', updates);
  
  const query = supabase.from('mutual_accounts').update(updates).eq('id', accountId).select();
  const { data, error, status, statusText, count } = await query;
  
  console.log('[DEBUG] _updateAccount: raw result:', { data, error, status, statusText, count });

  if (error) throw new Error(error.message);
  
  if (!data || data.length === 0) {
      throw new Error(`Update returned 0 rows! RLS likely blocked the return. Check UPDATE policy.`);
  }
  
  if (data.length > 1) {
      throw new Error(`Update returned multiple rows! Expected 1.`);
  }

  return data[0];
}

async function _updateTransaction(txnId, updates) {
  const { data, error } = await supabase.from('mutual_transactions').update(updates).eq('id', txnId).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Create Mutual Account ──
export async function createMutualAccount({ userId, role, otherPartyName, mobileNumber, metalBalance, metalClass, rupeeBalance, rupeeClass }) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');

  const inviteCode = generateCode();
  const now = new Date().toISOString();

  const accountPayload = {
    status: 'waiting',
    creator_id: userId,
    creator_role: role,
    other_party_name: otherPartyName ? String(otherPartyName).trim().substring(0, MAX_ACCOUNT_NAME_LENGTH) : '',
    mobile_number: mobileNumber || '',
    metal_balance: metalBalance || 0,
    metal_class: metalClass || 'receivable',
    rupee_balance: Math.abs(rupeeBalance || 0),
    rupee_class: rupeeClass || 'receivable',
    invite_code: inviteCode,
    invite_code_created_at: now,
    closure_activity: [],
    created_at: now,
    last_activity: now,
  };

  validateRupeeLimit(accountPayload.rupee_balance);
  validateMetalLimit(accountPayload.metal_balance);

  const { data, error } = await supabase.from('mutual_accounts').insert(accountPayload).select().single();
  if (error) throw new Error(error.message);
  
  data.transactions = []; // initial
  return data;
}

// ── Get Account ──
export async function getMutualAccount(accountId) {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('mutual_accounts').select('*').eq('id', accountId).single();
  if (error || !data) return null;
  
  const txns = await _fetchTransactions(accountId);
  data.transactions = txns;
  return data;
}

// ── Get all mutual accounts for a user ──
export async function getMutualAccounts(userId) {
  console.log('[DEBUG] getMutualAccounts: Checking Supabase config...');
  if (!isSupabaseConfigured || !supabase) {
    console.log('[DEBUG] getMutualAccounts: Supabase not configured');
    return [];
  }
  
  console.log('[DEBUG] getMutualAccounts: Querying mutual_accounts table...');
  const query = supabase
    .from('mutual_accounts')
    .select('*')
    .or(`creator_id.eq.${userId},partner_id.eq.${userId}`)
    .order('last_activity', { ascending: false });
    
  console.log(`[DEBUG] getMutualAccounts: Supabase URL:`, query.url ? query.url.toString() : 'Unknown');
  console.log(`[DEBUG] getMutualAccounts: Awaiting query...`);
  
  const { data, error } = await query;
    
  console.log('[DEBUG] getMutualAccounts: Query completed. Error:', error, 'Data length:', data ? data.length : 0);
  if (error) return [];
  
  // Note: we fetch transactions per account if needed. But dashboard list doesn't strictly need ALL txns,
  // just the pending count. For exact preservation, let's fetch transactions for all of them.
  // In production, we'd use a joined view.
  console.log('[DEBUG] getMutualAccounts: Fetching transactions for each account...');
  for (let acc of data) {
      console.log(`[DEBUG] Fetching txns for account ${acc.id}...`);
      acc.transactions = await _fetchTransactions(acc.id);
      console.log(`[DEBUG] Fetched ${acc.transactions.length} txns for account ${acc.id}`);
  }
  
  console.log('[DEBUG] getMutualAccounts: Done.');
  return data;
}

// 🛑 Delete Mutual Account 🛑
export async function deleteMutualAccount(accountId, forceDelete = false) {
  const acc = await getMutualAccount(accountId);
  if (!acc) return { success: false, error: 'Account not found' };

  if (acc.status === 'connected' && !forceDelete) {
    return { success: false, error: 'Connected mutual accounts cannot be deleted to maintain ledger synchronization. Please use the Close Mutual Account option.' };
  }

  const { error } = await supabase.from('mutual_accounts').delete().eq('id', accountId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Update Mutual Account ──
export async function updateMutualAccount(accountId, updates) {
  const payload = {};
  if (updates.other_party_name !== undefined) {
    payload.other_party_name = String(updates.other_party_name).trim().substring(0, MAX_ACCOUNT_NAME_LENGTH);
  }
  if (updates.mobile_number !== undefined) {
    payload.mobile_number = String(updates.mobile_number).trim();
  }
  if (updates.role !== undefined) {
    payload.creator_role = updates.role;
  }
  if (Object.keys(payload).length === 0) return null;

  try {
    return await _updateAccount(accountId, payload);
  } catch(e) {
    return null;
  }
}

// ── Refresh invite code (every 5 min) ──
export async function refreshInviteCode(accountId) {
  const acc = await getMutualAccount(accountId);
  if (!acc) return null;
  if (acc.status === 'connected') return acc;
  if (acc.status !== 'waiting') return null;

  const inviteCode = generateCode();
  const inviteCodeCreatedAt = new Date().toISOString();
  
  try {
      const updated = await _updateAccount(accountId, { invite_code: inviteCode, invite_code_created_at: inviteCodeCreatedAt });
      updated.transactions = await _fetchTransactions(accountId);
      return updated;
  } catch(e) {
      return null;
  }
}

// 🛑 Get time remaining for current code 🛑
export function getCodeTimeRemaining(acc) {
  if (!acc || acc.status !== 'waiting' || !acc.invite_code_created_at) return 0;
  const elapsed = Date.now() - new Date(acc.invite_code_created_at).getTime();
  return Math.max(0, CODE_EXPIRY_MS - elapsed);
}

// 🛑 Preview Mutual Account By Code 🛑
export async function previewMutualAccountByCode(inviteCode) {
  if (!isSupabaseConfigured || !supabase) return { error: 'Supabase not configured' };
  
  console.log('[DEBUG] previewMutualAccountByCode: Checking code:', inviteCode);
  const { data, error } = await supabase.rpc('get_mutual_account_by_code', { p_code: inviteCode }).single();
  console.log('[DEBUG] previewMutualAccountByCode: Query result ->', { data, error });

  if (error) {
    // PGRST116 indicates exactly 0 rows returned, which means the code is not found
    if (error.code === 'PGRST116') return { error: 'Invalid or expired invite code' };
    console.error('[DEBUG] previewMutualAccountByCode Database Error:', error);
    return { error: `Database error: ${error.message || JSON.stringify(error)}` };
  }
  if (!data) return { error: 'Invalid or expired invite code' };

  const currentTime = Date.now();
  const createdTime = new Date(data.invite_code_created_at).getTime();
  const elapsed = currentTime - createdTime;
  console.log('[DEBUG] previewMutualAccountByCode: Expiry check ->', { currentTime, createdTime, elapsed, CODE_EXPIRY_MS });

  if (elapsed >= CODE_EXPIRY_MS) {
    return { error: 'Invite code has expired. Ask the creator for a new code.' };
  }

  return { success: true, account: data };
}

// 🛑 Join Mutual Account 🛑
export async function joinMutualAccount(inviteCode, userId, partnerName) {
  if (!isSupabaseConfigured || !supabase) return { error: 'Supabase not configured' };
  
  try {
      const { data: updated, error } = await supabase.rpc('join_mutual_account', { 
          p_code: inviteCode, 
          p_partner_name: partnerName ? String(partnerName) : ''
      }).single();
      
      if (error) {
          return { error: error.message };
      }

      updated.transactions = await _fetchTransactions(updated.id);
      return { success: true, account: updated };
  } catch(e) {
      console.error('[DEBUG] joinMutualAccount error:', e);
      return { error: e.message };
  }
}



// 🛑 Close Mutual Account Requests 🛑
export function isAccountLocked(acc) {
  return acc && acc.status === 'closing_requested';
}

export async function requestCloseMutualAccount(accountId, userId, userName) {
  const acc = await getMutualAccount(accountId);
  if (!acc) return { error: 'Account not found' };
  if (acc.status !== 'connected') return { error: 'Account is not connected' };

  const closureAct = acc.closure_activity || [];
  closureAct.unshift({
    event: 'close_requested',
    by_user_id: userId,
    by_user_name: userName,
    created_at: new Date().toISOString()
  });

  try {
      await _updateAccount(accountId, {
          status: 'closing_requested',
          close_requested_by: userId,
          close_requested_by_name: userName,
          close_requested_at: new Date().toISOString(),
          closure_activity: closureAct
      });
      return { success: true };
  } catch(e) {
      return { error: e.message };
  }
}

export async function approveCloseMutualAccount(accountId, userId, userName) {
  const acc = await getMutualAccount(accountId);
  if (!acc) return { error: 'Account not found' };
  if (acc.status !== 'closing_requested') return { error: 'No closure request pending' };
  if (acc.close_requested_by === userId) return { error: 'You cannot approve your own request' };

  const res = await deleteMutualAccount(accountId, true);
  if (res.error) return res;
  return { success: true, accountName: acc.other_party_name };
}

export async function rejectCloseMutualAccount(accountId, userId, userName) {
  const acc = await getMutualAccount(accountId);
  if (!acc) return { error: 'Account not found' };
  if (acc.status !== 'closing_requested') return { error: 'No closure request pending' };
  if (acc.close_requested_by === userId) return { error: 'You cannot reject your own request' };

  const closureAct = acc.closure_activity || [];
  closureAct.unshift({
    event: 'request_rejected',
    by_user_id: userId,
    by_user_name: userName,
    created_at: new Date().toISOString()
  });
  
  try {
      await _updateAccount(accountId, {
          status: 'connected',
          close_requested_by: null,
          close_requested_by_name: null,
          close_requested_at: null,
          closure_activity: closureAct
      });
      return { success: true };
  } catch(e) {
      return { error: e.message };
  }
}

export async function withdrawCloseRequest(accountId, userId, userName) {
  const acc = await getMutualAccount(accountId);
  if (!acc) return { error: 'Account not found' };
  if (acc.status !== 'closing_requested') return { error: 'No closure request pending' };
  if (acc.close_requested_by !== userId) return { error: 'Only the requester can withdraw' };

  const closureAct = acc.closure_activity || [];
  closureAct.unshift({
    event: 'request_withdrawn',
    by_user_id: userId,
    by_user_name: userName,
    created_at: new Date().toISOString()
  });
  
  try {
      await _updateAccount(accountId, {
          status: 'connected',
          close_requested_by: null,
          close_requested_by_name: null,
          close_requested_at: null,
          closure_activity: closureAct
      });
      return { success: true };
  } catch(e) {
      return { error: e.message };
  }
}

export function getClosureActivity(acc) {
  return acc ? (acc.closure_activity || []) : [];
}

// 🛑 Add Transaction (pending approval) 🛑
export async function addMutualTransaction(accountId, txn) {
  const acc = await getMutualAccount(accountId);
  if (!acc) throw new Error('Account not found');
  if (acc.status !== 'connected') throw new Error('Account not connected yet');

  const approvalMinutes = txn.approvalMinutes || 60;
  
  const isUserCreator = isCreator(acc, txn.created_by);
  const canonicalAction = translateActionToCanonical(txn.action, isUserCreator);

  const pendingTxn = {
    account_id: accountId,
    section: txn.section,
    action: canonicalAction,
    amount: txn.amount,
    rate: txn.rate,
    rupee_amount: txn.rupee_amount,
    result_grams: txn.result_grams,
    result_rupee: txn.result_rupee,
    mention: txn.mention ? String(txn.mention).trim().substring(0, MAX_MENTION_LENGTH) : '',
    created_by: txn.created_by,
    status: 'pending',
    created_at: new Date().toISOString(),
    approval_deadline: new Date(Date.now() + approvalMinutes * 60000).toISOString(),
  };

  if (txn.action === 'convert_rupee_to_metal' || txn.action === 'rate_booking') {
    pendingTxn.result_grams = rupeeToMetal(txn.rupee_amount || txn.amount, txn.rate);
    if (txn.action === 'rate_booking') pendingTxn.amount = pendingTxn.result_grams;
    
    if (txn.action === 'convert_rupee_to_metal') {
        const sourceSign = Math.sign(normalizePosition(acc.rupee_balance, acc.rupee_class).signedBalance);
        if (sourceSign === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
        pendingTxn.source_delta = -sourceSign * Math.abs(txn.amount);
        pendingTxn.target_delta = sourceSign * Math.abs(pendingTxn.result_grams);
    }
  } else if (txn.action === 'convert_metal_to_rupee') {
    pendingTxn.result_rupee = metalToRupee(txn.amount, txn.rate);
    
    const sourceSign = Math.sign(normalizePosition(acc.metal_balance, acc.metal_class).signedBalance);
    if (sourceSign === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
    pendingTxn.source_delta = -sourceSign * Math.abs(txn.amount);
    pendingTxn.target_delta = sourceSign * Math.abs(pendingTxn.result_rupee);
  }

  const { data, error } = await supabase.from('mutual_transactions').insert(pendingTxn).select().single();
  if (error) throw new Error(error.message);
  
  await _updateAccount(accountId, {}); // Bump last activity
  return data;
}

// ── Check & expire overdue pending transactions ──
export async function checkExpiredTransactions(accountId) {
  const acc = await getMutualAccount(accountId);
  if (!acc) return;
  const now = new Date();
  
  for (let txn of acc.transactions) {
    if (txn.status === 'pending' && txn.approval_deadline && new Date(txn.approval_deadline) < now) {
      await _updateTransaction(txn.id, { status: 'expired' });
    }
  }
}

// ── Apply transaction using central position engine ──
function applyTxn(acc, txn) {
  if (txn.section === 'metal') {
    if (txn.action.startsWith('increase') || txn.action.startsWith('decrease')) {
      const r = applyPositionChange(acc.metal_balance, acc.metal_class, txn.action, txn.amount);
      acc.metal_balance = r.newValue; acc.metal_class = r.newPosition;
    } else if (txn.action === 'rate_booking') {
      const sourceDelta = txn.source_delta || getSignedDelta(txn.sourceOperation || 'increase_payable', txn.result_grams || txn.amount);
      const r = applySignedDelta(acc.metal_balance, acc.metal_class, sourceDelta);
      acc.metal_balance = r.newValue; acc.metal_class = r.newPosition;
    } else if (txn.action === 'convert_metal_to_rupee') {
      const sourceDelta = txn.source_delta || 0;
      const targetDelta = txn.target_delta || 0;
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, sourceDelta);
      acc.metal_balance = mr.newValue; acc.metal_class = mr.newPosition;
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, targetDelta);
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue; acc.rupee_class = rr.newPosition;
    }
  } else if (txn.section === 'rupee') {
    if (txn.action.startsWith('increase') || txn.action.startsWith('decrease')) {
      const r = applyPositionChange(acc.rupee_balance, acc.rupee_class, txn.action, txn.amount);
      validateRupeeLimit(r.newValue);
      acc.rupee_balance = r.newValue; acc.rupee_class = r.newPosition;
    } else if (txn.action === 'convert_rupee_to_metal') {
      const sourceDelta = txn.source_delta || 0;
      const targetDelta = txn.target_delta || 0;
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, sourceDelta);
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue; acc.rupee_class = rr.newPosition;
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, targetDelta);
      acc.metal_balance = mr.newValue; acc.metal_class = mr.newPosition;
    }
  }
}

// ── Reverse a transaction (for cancellation) using central position engine ──
function reverseTxn(acc, txn) {
  if (txn.section === 'metal') {
    if (txn.action.startsWith('increase') || txn.action.startsWith('decrease')) {
      const getReverseOp = (op) => {
        if (op === 'increase_receivable') return 'decrease_receivable';
        if (op === 'decrease_receivable') return 'increase_receivable';
        if (op === 'increase_payable') return 'decrease_payable';
        if (op === 'decrease_payable') return 'increase_payable';
        if (op === 'increase') return 'decrease';
        if (op === 'decrease') return 'increase';
        return op;
      };
      const mOp = getReverseOp(txn.action);
      const r = applyPositionChange(acc.metal_balance, acc.metal_class, mOp, txn.amount);
      acc.metal_balance = r.newValue; acc.metal_class = r.newPosition;
    } else if (txn.action === 'rate_booking') {
      const reverseDelta = -(txn.source_delta || 0);
      const r = applySignedDelta(acc.metal_balance, acc.metal_class, reverseDelta);
      acc.metal_balance = r.newValue; acc.metal_class = r.newPosition;
    } else if (txn.action === 'convert_metal_to_rupee') {
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, -(txn.source_delta || 0));
      acc.metal_balance = mr.newValue; acc.metal_class = mr.newPosition;
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, -(txn.target_delta || 0));
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue; acc.rupee_class = rr.newPosition;
    }
  } else if (txn.section === 'rupee') {
    if (txn.action.startsWith('increase') || txn.action.startsWith('decrease')) {
      const getReverseOp = (op) => {
        if (op === 'increase_receivable') return 'decrease_receivable';
        if (op === 'decrease_receivable') return 'increase_receivable';
        if (op === 'increase_payable') return 'decrease_payable';
        if (op === 'decrease_payable') return 'increase_payable';
        if (op === 'increase') return 'decrease';
        if (op === 'decrease') return 'increase';
        return op;
      };
      const rOp = getReverseOp(txn.action);
      const r = applyPositionChange(acc.rupee_balance, acc.rupee_class, rOp, txn.amount);
      validateRupeeLimit(r.newValue);
      acc.rupee_balance = r.newValue; acc.rupee_class = r.newPosition;
    } else if (txn.action === 'convert_rupee_to_metal') {
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, -(txn.source_delta || 0));
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue; acc.rupee_class = rr.newPosition;
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, -(txn.target_delta || 0));
      acc.metal_balance = mr.newValue; acc.metal_class = mr.newPosition;
    }
  }
}

// ── Approve Transaction ──
export async function approveTransaction(accountId, txnId) {
  const acc = await getMutualAccount(accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending') throw new Error('Transaction not found or already processed');

  if (txn.approval_deadline && new Date(txn.approval_deadline) < new Date()) {
    await _updateTransaction(txnId, { status: 'expired' });
    throw new Error('Transaction has expired. The approval deadline has passed.');
  }

  applyTxn(acc, txn);

  await _updateAccount(accountId, {
      metal_balance: acc.metal_balance,
      metal_class: acc.metal_class,
      rupee_balance: acc.rupee_balance,
      rupee_class: acc.rupee_class
  });
  await _updateTransaction(txnId, { status: 'approved', approved_at: new Date().toISOString() });
  
  return acc;
}

// ── Reject Transaction ──
export async function rejectTransaction(accountId, txnId) {
  const acc = await getMutualAccount(accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending') throw new Error('Transaction not found or already processed');

  await _updateTransaction(txnId, { status: 'rejected', rejected_at: new Date().toISOString() });
  await _updateAccount(accountId, {}); // Bump last activity
  return acc;
}

// ── Request Cancel Transaction (Mutual) ──
export async function requestCancelTransaction(accountId, txnId, requesterId) {
  const acc = await getMutualAccount(accountId);
  if (!acc) return { error: 'Account not found' };

  const validTxns = acc.transactions.filter(t => t.status === 'approved' || t.status === 'pending');
  if (validTxns.length === 0) return { error: 'No transactions to cancel' };

  const mostRecent = validTxns[0];
  if (mostRecent.id !== txnId) {
    return { error: 'You can only cancel the most recent transaction to maintain ledger integrity.' };
  }

  const age = Date.now() - new Date(mostRecent.approved_at || mostRecent.created_at).getTime();
  if (age > 3600000) {
    return { error: 'Transactions can only be cancelled within 1 hour.' };
  }

  const txn = acc.transactions.find(t => t.id === txnId);
  if (txn.status === 'pending') {
    await _updateTransaction(txnId, { status: 'cancelled', cancelled_at: new Date().toISOString() });
    return { success: true };
  }

  await _updateTransaction(txnId, { 
      status: 'pending_cancellation', 
      cancel_requested_by: requesterId,
      cancel_requested_at: new Date().toISOString() 
  });
  return { success: true };
}

// ── Approve Cancel Transaction (uses reverseTxn for correct cross-ledger reversal) ──
export async function approveCancelTransaction(accountId, txnId) {
  const acc = await getMutualAccount(accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending_cancellation') throw new Error('Cancellation request not found');

  reverseTxn(acc, txn);

  await _updateAccount(accountId, {
      metal_balance: acc.metal_balance,
      metal_class: acc.metal_class,
      rupee_balance: acc.rupee_balance,
      rupee_class: acc.rupee_class
  });
  await _updateTransaction(txnId, { status: 'cancelled', cancelled_at: new Date().toISOString() });
  
  return acc;
}

// ── Reject Cancel Transaction ──
export async function rejectCancelTransaction(accountId, txnId) {
  const acc = await getMutualAccount(accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending_cancellation') throw new Error('Cancellation request not found');

  await _updateTransaction(txnId, { status: 'approved', cancel_rejected_at: new Date().toISOString() });
  await _updateAccount(accountId, {}); // Bump last activity
  return acc;
}

// Re-export helpers
export { toFineGold, rupeeToMetal, metalToRupee };

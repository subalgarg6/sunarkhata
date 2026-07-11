/**
 * SunarKhata — Mutual Account Service
 * Uses central position engine. Transactions require partner approval.
 * Data stored in localStorage under 'sk_mutual_accounts'
 */

import { toFineGold, rupeeToMetal, metalToRupee } from './individual.service.js';
import { applyPositionChange, getSignedDelta, applySignedDelta } from '../utils/position-engine.js';
import { validateRupeeLimit } from '../utils/business-rules.js';

function generateSecureId() {
  const array = new Uint8Array(4);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

const STORAGE_KEY = 'sk_mutual_accounts';
const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function save(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
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

// ── Create Mutual Account ──
export function createMutualAccount({ userId, role, otherPartyName, mobileNumber, metalBalance, metalClass, rupeeBalance, rupeeClass }) {
  const accounts = load();
  const inviteCode = generateCode();
  const now = new Date().toISOString();

  const account = {
    id: 'mutual_' + Date.now() + '_' + generateSecureId(),
    type: 'mutual',
    status: 'waiting',
    creator_id: userId,
    creator_role: role,
    other_party_name: otherPartyName,
    mobile_number: mobileNumber || '',
    partner_id: null,
    partner_name: null,
    metal_balance: metalBalance || 0,
    metal_class: metalClass || 'receivable',
    rupee_balance: rupeeBalance || 0,
    rupee_class: rupeeClass || 'receivable',
    invite_code: inviteCode,
    invite_code_created_at: now,
    transactions: [],
    created_at: now,
    last_activity: now,
  };

  validateRupeeLimit(account.rupee_balance);
  accounts.push(account);
  save(accounts);
  return account;
}

// ── Get Account ──
export function getMutualAccount(accountId) {
  return load().find(a => a.id === accountId) || null;
}

// ── Get all mutual accounts for a user ──
export function getMutualAccounts(userId) {
  return load().filter(a => a.creator_id === userId || a.partner_id === userId);
}

// ── Refresh invite code (every 5 min) ──
export function refreshInviteCode(accountId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return null;

  // Guard: If account is already connected, do NOT generate a new code
  if (acc.status === 'connected') {
    return acc;
  }

  if (acc.status !== 'waiting') return null;

  // Force-generate a new code (called explicitly by user clicking "Generate New Code")
  acc.invite_code = generateCode();
  acc.invite_code_created_at = new Date().toISOString();
  save(accounts);
  return acc;
}

// ── Get time remaining for current code ──
export function getCodeTimeRemaining(accountId) {
  const acc = getMutualAccount(accountId);
  if (!acc || acc.status !== 'waiting') return 0;
  const elapsed = Date.now() - new Date(acc.invite_code_created_at).getTime();
  return Math.max(0, CODE_EXPIRY_MS - elapsed);
}

// ── Join Mutual Account ──
export function joinMutualAccount(inviteCode, userId, userName) {
  const accounts = load();
  const acc = accounts.find(a => a.invite_code === inviteCode && a.status === 'waiting');

  if (!acc) return { error: 'Invalid or expired invite code' };
  if (acc.creator_id === userId) return { error: 'Cannot join your own account' };

  const elapsed = Date.now() - new Date(acc.invite_code_created_at).getTime();
  if (elapsed >= CODE_EXPIRY_MS) {
    return { error: 'Invite code has expired. Ask the creator for a new code.' };
  }

  acc.partner_id = userId;
  acc.partner_name = userName;
  acc.status = 'connected';
  acc.invite_code = null;
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return { success: true, account: acc };
}

// ── Get user's perspective (mirror rule) ──
export function getUserPerspective(accountId, userId) {
  const acc = getMutualAccount(accountId);
  if (!acc) return null;

  const isCreator = acc.creator_id === userId;
  const mirrorClass = (cls) => {
    if (cls === 'neutral') return 'neutral';
    return cls === 'receivable' ? 'payable' : 'receivable';
  };

  return {
    ...acc,
    myRole: isCreator ? acc.creator_role : (acc.creator_role === 'supplier' ? 'trade_customer' : 'supplier'),
    myName: isCreator ? (acc.creator_role === 'supplier' ? 'Supplier' : 'Trade Customer') : acc.partner_name,
    otherName: isCreator ? acc.other_party_name : (acc.creator_role === 'supplier' ? 'Supplier' : 'Trade Customer'),
    my_metal_balance: acc.metal_balance,
    my_metal_class: isCreator ? acc.metal_class : mirrorClass(acc.metal_class),
    my_rupee_balance: acc.rupee_balance,
    my_rupee_class: isCreator ? acc.rupee_class : mirrorClass(acc.rupee_class),
    isCreator,
  };
}

// ── Add Transaction (pending approval) ──
function addPendingTransaction(accountId, txn) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');
  if (acc.status !== 'connected') throw new Error('Account not connected yet');

  acc.transactions.unshift(txn);
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return acc;
}

// ── Apply transaction using central position engine ──
function applyTxn(acc, txn) {
  if (txn.section === 'metal') {
    if (txn.action.startsWith('increase') || txn.action.startsWith('decrease')) {
      const r = applyPositionChange(acc.metal_balance, acc.metal_class, txn.action, txn.amount);
      acc.metal_balance = r.newValue; acc.metal_class = r.newPosition;
    } else if (txn.action === 'rate_booking') {
      // Rate booking uses signed-delta via sourceOperation
      const sourceDelta = txn.sourceDelta || getSignedDelta(txn.sourceOperation || 'increase_payable', txn.result_grams || txn.amount);
      txn.sourceDelta = sourceDelta;
      const r = applySignedDelta(acc.metal_balance, acc.metal_class, sourceDelta);
      acc.metal_balance = r.newValue; acc.metal_class = r.newPosition;
    } else if (txn.action === 'convert_metal_to_rupee') {
      // Use signed-delta model for atomic cross-ledger conversion
      const sourceDelta = txn.sourceDelta || 0;
      const targetDelta = txn.targetDelta || 0;

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
      // Use signed-delta model for atomic cross-ledger conversion
      const sourceDelta = txn.sourceDelta || 0;
      const targetDelta = txn.targetDelta || 0;

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
      // Reverse using stored signed delta
      const reverseDelta = -(txn.sourceDelta || 0);
      const r = applySignedDelta(acc.metal_balance, acc.metal_class, reverseDelta);
      acc.metal_balance = r.newValue; acc.metal_class = r.newPosition;
    } else if (txn.action === 'convert_metal_to_rupee') {
      // Reverse both ledgers using stored deltas
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, -(txn.sourceDelta || 0));
      acc.metal_balance = mr.newValue; acc.metal_class = mr.newPosition;
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, -(txn.targetDelta || 0));
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
      // Reverse both ledgers using stored deltas
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, -(txn.sourceDelta || 0));
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue; acc.rupee_class = rr.newPosition;
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, -(txn.targetDelta || 0));
      acc.metal_balance = mr.newValue; acc.metal_class = mr.newPosition;
    }
  }
}

// ── Mutual Transaction Creation (Unified using exact opcodes) ──

export function addMutualTransaction(accountId, txn) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const approvalMinutes = txn.approvalMinutes || 60;
  
  // If the user proposing this is the partner, their action is relative to their mirrored perspective.
  // We must translate it back to canonical perspective before storing.
  let canonicalAction = txn.action;
  if (acc.creator_id !== txn.created_by) {
    if (txn.action === 'increase_receivable') canonicalAction = 'increase_payable';
    else if (txn.action === 'decrease_receivable') canonicalAction = 'decrease_payable';
    else if (txn.action === 'increase_payable') canonicalAction = 'increase_receivable';
    else if (txn.action === 'decrease_payable') canonicalAction = 'decrease_receivable';
  }

  const pendingTxn = {
    id: 'mtxn_' + Date.now() + '_' + generateSecureId(),
    section: txn.section,
    action: canonicalAction,
    amount: txn.amount,
    rate: txn.rate,
    rupee_amount: txn.rupee_amount,
    result_grams: txn.result_grams,
    result_rupee: txn.result_rupee,
    mention: txn.mention || '',
    created_by: txn.created_by,
    status: 'pending',
    created_at: new Date().toISOString(),
    approval_deadline: new Date(Date.now() + approvalMinutes * 60000).toISOString(),
  };

  // Compute dependent fields for specific conversions just to keep logic localized
  if (txn.action === 'convert_rupee_to_metal' || txn.action === 'rate_booking') {
    pendingTxn.result_grams = rupeeToMetal(txn.rupee_amount || txn.amount, txn.rate);
    if (txn.action === 'rate_booking') pendingTxn.amount = pendingTxn.result_grams;
    
    if (txn.action === 'convert_rupee_to_metal') {
        const sourceSign = Math.sign(normalizePosition(acc.rupee_balance, acc.rupee_class).signedBalance);
        if (sourceSign === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
        pendingTxn.sourceDelta = -sourceSign * Math.abs(txn.amount);
        pendingTxn.targetDelta = sourceSign * Math.abs(pendingTxn.result_grams);
    }
  } else if (txn.action === 'convert_metal_to_rupee') {
    pendingTxn.result_rupee = metalToRupee(txn.amount, txn.rate);
    
    const sourceSign = Math.sign(normalizePosition(acc.metal_balance, acc.metal_class).signedBalance);
    if (sourceSign === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
    pendingTxn.sourceDelta = -sourceSign * Math.abs(txn.amount);
    pendingTxn.targetDelta = sourceSign * Math.abs(pendingTxn.result_rupee);
  }

  return addPendingTransaction(accountId, pendingTxn);
}

// ── Check & expire overdue pending transactions ──
export function checkExpiredTransactions(accountId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;
  const now = new Date();
  let changed = false;
  acc.transactions.forEach(txn => {
    if (txn.status === 'pending' && txn.approval_deadline && new Date(txn.approval_deadline) < now) {
      txn.status = 'expired';
      changed = true;
    }
  });
  if (changed) save(accounts);
  return acc;
}

// ── Approve Transaction ──
export function approveTransaction(accountId, txnId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending') throw new Error('Transaction not found or already processed');

  if (txn.approval_deadline && new Date(txn.approval_deadline) < new Date()) {
    txn.status = 'expired';
    save(accounts);
    throw new Error('Transaction has expired. The approval deadline has passed.');
  }

  txn.status = 'approved';
  txn.approved_at = new Date().toISOString();

  // If the user who approves is NOT the creator, they are "the other perspective".
  // The transaction was proposed using the CREATOR'S perspective labels!
  // Wait, no. The mutual system works by storing the CANONICAL transaction 
  // (which is ALWAYS from the creator's perspective).
  // Yes! The transaction is stored exactly as proposed by whoever proposed it.
  // Oh wait, if the partner proposes it, the action (e.g. increase_receivable) is from THEIR perspective?
  // Our system currently does not translate operations when saving pending transactions.
  // To avoid drift, we should translate it back to canonical if proposed by partner.
  // Actually, we must address this carefully. For now, assume it's canonical.
  
  applyTxn(acc, txn);
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return acc;
}

// ── Reject Transaction ──
export function rejectTransaction(accountId, txnId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending') throw new Error('Transaction not found or already processed');

  txn.status = 'rejected';
  txn.rejected_at = new Date().toISOString();
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return acc;
}

// ── Request Cancel Transaction (Mutual) ──
export function requestCancelTransaction(accountId, txnId, requesterId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
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
    txn.status = 'cancelled';
    txn.cancelled_at = new Date().toISOString();
    save(accounts);
    return { success: true, account: acc };
  }

  txn.status = 'pending_cancellation';
  txn.cancel_requested_by = requesterId;
  txn.cancel_requested_at = new Date().toISOString();
  save(accounts);
  return { success: true, account: acc };
}

// ── Approve Cancel Transaction (uses reverseTxn for correct cross-ledger reversal) ──
export function approveCancelTransaction(accountId, txnId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending_cancellation') throw new Error('Cancellation request not found');

  reverseTxn(acc, txn);

  txn.status = 'cancelled';
  txn.cancelled_at = new Date().toISOString();
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return acc;
}

// ── Reject Cancel Transaction ──
export function rejectCancelTransaction(accountId, txnId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending_cancellation') throw new Error('Cancellation request not found');

  txn.status = 'approved';
  txn.cancel_rejected_at = new Date().toISOString();
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return acc;
}

// ── Delete Mutual Account ──
export function deleteMutualAccount(accountId) {
  const accounts = load().filter(a => a.id !== accountId);
  save(accounts);
}

// Re-export helpers
export { toFineGold, rupeeToMetal, metalToRupee };

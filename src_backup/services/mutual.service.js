/**
 * SunarKhata — Mutual Account Service
 * Same as individual but with invite codes + transaction approval
 * Data stored in localStorage under 'sk_mutual_accounts'
 */

import { toFineGold, rupeeToMetal, metalToRupee } from './individual.service.js';

const STORAGE_KEY = 'sk_mutual_accounts';
const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function load() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function save(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// Generate 20-char alphanumeric code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 20; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Create Mutual Account ──
export function createMutualAccount({ userId, role, otherPartyName, metalBalance, metalClass, rupeeBalance, rupeeClass, purityRecord }) {
  const accounts = load();
  const inviteCode = generateCode();
  const now = new Date().toISOString();

  // Mirror classes for the other party
  const mirrorClass = (cls) => cls === 'receivable' ? 'payable' : 'receivable';

  const account = {
    id: 'mutual_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    type: 'mutual',
    status: 'waiting', // 'waiting' | 'connected'
    // Creator info
    creator_id: userId,
    creator_role: role, // 'supplier' | 'trade_customer'
    other_party_name: otherPartyName,
    // Partner info (filled when joined)
    partner_id: null,
    partner_name: null,
    // Balances (from creator's perspective)
    metal_balance: metalBalance || 0,
    metal_class: metalClass || 'receivable',
    rupee_balance: rupeeBalance || 0,
    rupee_class: rupeeClass || 'receivable',
    // Invite code
    invite_code: inviteCode,
    invite_code_created_at: now,
    // Records
    purity_record: purityRecord || null,
    transactions: [],
    created_at: now,
    last_activity: now,
  };

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
  if (!acc || acc.status !== 'waiting') return null;

  const elapsed = Date.now() - new Date(acc.invite_code_created_at).getTime();
  if (elapsed >= CODE_EXPIRY_MS) {
    acc.invite_code = generateCode();
    acc.invite_code_created_at = new Date().toISOString();
    save(accounts);
  }
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

  // Check code hasn't expired
  const elapsed = Date.now() - new Date(acc.invite_code_created_at).getTime();
  if (elapsed >= CODE_EXPIRY_MS) {
    return { error: 'Invite code has expired. Ask the creator for a new code.' };
  }

  acc.partner_id = userId;
  acc.partner_name = userName;
  acc.status = 'connected';
  acc.invite_code = null; // Clear code
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return { success: true, account: acc };
}

// ── Get user's perspective ──
export function getUserPerspective(accountId, userId) {
  const acc = getMutualAccount(accountId);
  if (!acc) return null;

  const isCreator = acc.creator_id === userId;
  const mirrorClass = (cls) => cls === 'receivable' ? 'payable' : 'receivable';

  return {
    ...acc,
    // From this user's view
    myRole: isCreator ? acc.creator_role : (acc.creator_role === 'supplier' ? 'trade_customer' : 'supplier'),
    myName: isCreator ? (acc.creator_role === 'supplier' ? 'Supplier' : 'Trade Customer') : acc.partner_name,
    otherName: isCreator ? acc.other_party_name : (acc.creator_role === 'supplier' ? 'Supplier' : 'Trade Customer'),
    // Balances from this user's perspective
    my_metal_balance: acc.metal_balance,
    my_metal_class: isCreator ? acc.metal_class : mirrorClass(acc.metal_class),
    my_rupee_balance: acc.rupee_balance,
    my_rupee_class: isCreator ? acc.rupee_class : mirrorClass(acc.rupee_class),
    isCreator,
  };
}

// ── Add Transaction (pending approval) ──
function addTransaction(accountId, txn) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');
  if (acc.status !== 'connected') throw new Error('Account not connected yet');

  acc.transactions.unshift(txn);
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return acc;
}

// Apply a transaction to balances
function applyTxn(acc, txn) {
  if (txn.section === 'metal') {
    if (txn.action === 'increase') acc.metal_balance += txn.amount;
    else if (txn.action === 'decrease') acc.metal_balance -= txn.amount;
  } else if (txn.section === 'rupee') {
    if (txn.action === 'increase') acc.rupee_balance += txn.amount;
    else if (txn.action === 'decrease') acc.rupee_balance -= txn.amount;
  }

  // Handle conversions
  if (txn.action === 'convert_to_metal') {
    acc.rupee_balance -= txn.amount;
    acc.metal_balance += txn.result_grams;
  } else if (txn.action === 'convert_to_rupee') {
    acc.metal_balance -= txn.amount;
    acc.rupee_balance += txn.result_rupee;
  } else if (txn.action === 'rate_booking') {
    acc.metal_balance += txn.result_grams;
  }

  // Auto-flip class if balance goes negative
  if (acc.metal_balance < 0) {
    acc.metal_balance = Math.abs(acc.metal_balance);
    acc.metal_class = acc.metal_class === 'receivable' ? 'payable' : 'receivable';
  }
  if (acc.rupee_balance < 0) {
    acc.rupee_balance = Math.abs(acc.rupee_balance);
    acc.rupee_class = acc.rupee_class === 'receivable' ? 'payable' : 'receivable';
  }
}

// ── Metal Increase (pending) ──
export function mutualMetalIncrease(accountId, amount, mention, createdBy) {
  return addTransaction(accountId, {
    id: 'mtxn_' + Date.now(),
    section: 'metal', action: 'increase', amount,
    mention, created_by: createdBy,
    status: 'pending', // 'pending' | 'approved' | 'rejected'
    created_at: new Date().toISOString(),
  });
}

export function mutualMetalDecrease(accountId, amount, mention, createdBy) {
  return addTransaction(accountId, {
    id: 'mtxn_' + Date.now(),
    section: 'metal', action: 'decrease', amount,
    mention, created_by: createdBy,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
}

export function mutualRupeeIncrease(accountId, amount, mention, createdBy) {
  return addTransaction(accountId, {
    id: 'mtxn_' + Date.now(),
    section: 'rupee', action: 'increase', amount,
    mention, created_by: createdBy,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
}

export function mutualRupeeDecrease(accountId, amount, mention, createdBy) {
  return addTransaction(accountId, {
    id: 'mtxn_' + Date.now(),
    section: 'rupee', action: 'decrease', amount,
    mention, created_by: createdBy,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
}

export function mutualConvertRupeeToMetal(accountId, rupeeAmount, rate, mention, createdBy) {
  const grams = rupeeToMetal(rupeeAmount, rate);
  return addTransaction(accountId, {
    id: 'mtxn_' + Date.now(),
    section: 'rupee', action: 'convert_to_metal', amount: rupeeAmount,
    rate, result_grams: grams,
    mention, created_by: createdBy,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
}

export function mutualConvertMetalToRupee(accountId, metalGrams, rate, mention, createdBy) {
  const rupee = metalToRupee(metalGrams, rate);
  return addTransaction(accountId, {
    id: 'mtxn_' + Date.now(),
    section: 'metal', action: 'convert_to_rupee', amount: metalGrams,
    rate, result_rupee: rupee,
    mention, created_by: createdBy,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
}

export function mutualRateBooking(accountId, rupeeAmount, rate, mention, createdBy) {
  const grams = rupeeToMetal(rupeeAmount, rate);
  return addTransaction(accountId, {
    id: 'mtxn_' + Date.now(),
    section: 'metal', action: 'rate_booking',
    rupee_amount: rupeeAmount, rate, result_grams: grams, amount: grams,
    mention, created_by: createdBy,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
}

// ── Approve Transaction ──
export function approveTransaction(accountId, txnId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending') throw new Error('Transaction not found or already processed');

  txn.status = 'approved';
  txn.approved_at = new Date().toISOString();

  // Apply to balances
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

  // Only allow cancelling approved transactions that are most recent
  const validTxns = acc.transactions.filter(t => t.status === 'approved' || t.status === 'pending');
  if (validTxns.length === 0) return { error: 'No transactions to cancel' };

  const mostRecent = validTxns[0];
  if (mostRecent.id !== txnId) {
    return { error: 'You can only cancel the most recent transaction to maintain ledger integrity.' };
  }

  // Time limit
  const age = Date.now() - new Date(mostRecent.created_at).getTime();
  if (age > 3600000) {
    return { error: 'Transactions can only be cancelled within 1 hour of creation.' };
  }

  const txn = acc.transactions.find(t => t.id === txnId);
  if (txn.status === 'pending') {
    // If it was still pending, just cancel it directly
    txn.status = 'cancelled';
    txn.cancelled_at = new Date().toISOString();
    save(accounts);
    return { success: true, account: acc };
  }

  // If approved, request cancellation from partner
  txn.status = 'pending_cancellation';
  txn.cancel_requested_by = requesterId;
  txn.cancel_requested_at = new Date().toISOString();
  save(accounts);
  return { success: true, account: acc };
}

// ── Approve Cancel Transaction ──
export function approveCancelTransaction(accountId, txnId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending_cancellation') throw new Error('Cancellation request not found');

  // Reverse the balances based on the transaction type
  if (txn.section === 'rupee') {
    if (txn.action === 'increase' || txn.action === 'convert_to_rupee') {
      acc.rupee_balance -= txn.amount;
    } else if (txn.action === 'decrease' || txn.action === 'convert_to_metal') {
      acc.rupee_balance += txn.amount;
    }
  } else if (txn.section === 'metal') {
    if (txn.action === 'increase' || txn.action === 'rate_booking') {
      const metalAmount = txn.action === 'rate_booking' ? txn.result_grams : txn.amount;
      acc.metal_balance -= metalAmount;
    } else if (txn.action === 'decrease' || txn.action === 'convert_to_rupee') {
      acc.metal_balance += txn.amount;
    } else if (txn.action === 'convert_to_metal') {
      acc.metal_balance -= txn.result_grams;
    }
  }

  // Ensure balance isn't negative (though it could be, class flip handles it)
  // Actually, we need applyAutoFlip which isn't in mutual.service... wait, mutual.service just sets negative?
  // Mutual service uses absolute + class internally?
  // Let me check how mutual service handles class flips. Wait, in mutual service, applyTxn is used!
  // I'll manually flip if < 0.
  if (acc.rupee_balance < 0) {
    acc.rupee_balance = Math.abs(acc.rupee_balance);
    acc.rupee_class = acc.rupee_class === 'receivable' ? 'payable' : 'receivable';
  }
  if (acc.metal_balance < 0) {
    acc.metal_balance = Math.abs(acc.metal_balance);
    acc.metal_class = acc.metal_class === 'receivable' ? 'payable' : 'receivable';
  }

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

  txn.status = 'approved'; // Revert back to approved
  txn.cancel_rejected_at = new Date().toISOString();
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return acc;
}

// ── Request Edit Transaction ──
export function requestEditTransaction(accountId, txnId, userId, newTxnParams) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const validTxns = acc.transactions.filter(t => t.status === 'approved' || t.status === 'pending');
  if (validTxns.length === 0) throw new Error('No transactions to edit');

  const mostRecent = validTxns[0];
  if (mostRecent.id !== txnId) throw new Error('You can only edit the most recent transaction.');

  const age = Date.now() - new Date(mostRecent.created_at).getTime();
  if (age > 3600000) throw new Error('Transactions can only be edited within 1 hour.');

  mostRecent.status = 'pending_edit';
  mostRecent.edit_params = newTxnParams;
  mostRecent.edit_requested_by = userId;
  acc.last_activity = new Date().toISOString();
  save(accounts);
  return acc;
}

// ── Approve Edit Transaction ──
export function approveEditTransaction(accountId, txnId) {
  // First, we cancel it locally in memory
  // Wait, to safely apply, we can just call approveCancelTransaction to reverse it, then add a new one.
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending_edit') throw new Error('Edit request not found');

  const newTxnParams = txn.edit_params;
  
  // Re-save as pending_cancellation so approveCancelTransaction works
  txn.status = 'pending_cancellation';
  save(accounts);
  
  // 1. Cancel old transaction
  approveCancelTransaction(accountId, txnId);
  
  // 2. Add new transaction based on newTxnParams
  let newAcc;
  const { section, action, amount, rate, mention, rupee_amount, created_by } = newTxnParams;
  
  if (section === 'rupee') {
    if (action === 'increase') newAcc = mutualRupeeIncrease(accountId, amount, mention, created_by);
    else if (action === 'decrease') newAcc = mutualRupeeDecrease(accountId, amount, mention, created_by);
    else if (action === 'convert_to_metal') newAcc = mutualConvertRupeeToMetal(accountId, amount, rate, mention, created_by);
  } else if (section === 'metal') {
    if (action === 'increase') newAcc = mutualMetalIncrease(accountId, amount, mention, created_by);
    else if (action === 'decrease') newAcc = mutualMetalDecrease(accountId, amount, mention, created_by);
    else if (action === 'convert_to_rupee') newAcc = mutualConvertMetalToRupee(accountId, amount, rate, mention, created_by);
    else if (action === 'rate_booking') newAcc = mutualRateBooking(accountId, rupee_amount, rate, mention, created_by);
  }
  
  // Force it to be approved since the partner already approved the edit
  const updatedAccounts = load();
  const updatedAcc = updatedAccounts.find(a => a.id === accountId);
  const latestTxn = updatedAcc.transactions[0];
  if (latestTxn.status === 'pending') {
    approveTransaction(accountId, latestTxn.id, 'system'); // approve instantly
  }
  
  // Mark old as edited
  const finalAccounts = load();
  const finalAcc = finalAccounts.find(a => a.id === accountId);
  const oldTxn = finalAcc.transactions.find(t => t.id === txnId);
  if (oldTxn) oldTxn.status = 'edited';
  save(finalAccounts);
  
  return getMutualAccount(accountId);
}

// ── Reject Edit Transaction ──
export function rejectEditTransaction(accountId, txnId) {
  const accounts = load();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) throw new Error('Account not found');

  const txn = acc.transactions.find(t => t.id === txnId);
  if (!txn || txn.status !== 'pending_edit') throw new Error('Edit request not found');

  txn.status = 'approved'; 
  txn.edit_rejected_at = new Date().toISOString();
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

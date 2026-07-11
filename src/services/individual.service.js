/**
 * SunarKhata — Individual Account Service
 * Uses central position engine for all balance calculations.
 */
import { applyPositionChange, getSignedDelta, applySignedDelta, normalizePosition } from '../utils/position-engine.js';
import { validateRupeeLimit } from '../utils/business-rules.js';

const ACCOUNTS_KEY = 'sk_individual_accounts';

// ── Helpers ──
function generateSecureId() {
  const array = new Uint8Array(4);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
function loadAccounts() { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); }
function saveAccounts(a) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); }
function genId() { return 'ind_' + Date.now().toString(36) + generateSecureId(); }
function txnId() { return 'txn_' + Date.now().toString(36) + generateSecureId(); }

// ── Get All Accounts for a User ──
export function getIndividualAccounts(userId) {
  return loadAccounts().filter(a => a.user_id === userId);
}

// ── Get Single Account ──
export function getAccount(accountId) {
  return loadAccounts().find(a => a.id === accountId) || null;
}

// ── Create Account ──
export function createIndividualAccount({ userId, role, otherPartyName, mobileNumber, metalBalance = 0, metalClass = 'receivable', rupeeBalance = 0, rupeeClass = 'receivable' }) {
  const accounts = loadAccounts();
  const account = {
    id: genId(),
    user_id: userId,
    type: 'individual',
    role, // 'supplier' | 'trade_customer'
    other_party_name: otherPartyName,
    mobile_number: mobileNumber || '',
    metal_balance: Math.abs(metalBalance),  // Always in grams, 100% pure (fine gold)
    metal_class: metalClass,                // 'receivable' | 'payable' | 'neutral'
    rupee_balance: Math.abs(rupeeBalance),  // Always in ₹
    rupee_class: rupeeClass,                // 'receivable' | 'payable' | 'neutral'
  };
  validateRupeeLimit(account.rupee_balance);
  account.transactions = [];
  account.created_at = new Date().toISOString();
  accounts.push(account);
  saveAccounts(accounts);
  return account;
}

// ── Delete Account ──
export function deleteIndividualAccount(accountId) {
  const accounts = loadAccounts().filter(a => a.id !== accountId);
  saveAccounts(accounts);
}

// ── Purity Conversion ──
export function toFineGold(grossGrams, purityPercent, labourPercent = 0) {
  const effectivePercent = Math.max(purityPercent - labourPercent, 0);
  return parseFloat((grossGrams * effectivePercent / 100).toFixed(3));
}

// ── Rate Conversion Helpers ──
export function rupeeToMetal(rupeeAmount, ratePer10g) {
  if (!ratePer10g || ratePer10g <= 0) return 0;
  return parseFloat(((rupeeAmount / ratePer10g) * 10).toFixed(3));
}

export function metalToRupee(metalGrams, ratePer10g) {
  return parseFloat(((metalGrams / 10) * ratePer10g).toFixed(2));
}

// ── Add Transaction (Unified using exact opcodes) ──
export function addTransaction(accountId, txn) {
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return null;

  txn.id = txnId();
  txn.created_at = new Date().toISOString();

  if (txn.section === 'rupee') {
    txn.balance_before = acc.rupee_balance;
    txn.class_before = acc.rupee_class;

    if (txn.action.startsWith('increase_') || txn.action.startsWith('decrease_')) {
      const r = applyPositionChange(acc.rupee_balance, acc.rupee_class, txn.action, txn.amount);
      validateRupeeLimit(r.newValue);
      acc.rupee_balance = r.newValue;
      acc.rupee_class = r.newPosition;

    } else if (txn.action === 'convert_rupee_to_metal') {
      const metalGrams = rupeeToMetal(txn.amount, txn.rate);
      txn.result_grams = metalGrams;

      const sourceSign = Math.sign(normalizePosition(acc.rupee_balance, acc.rupee_class).signedBalance);
      if (sourceSign === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
      const sourceDelta = -sourceSign * Math.abs(txn.amount);
      const targetDelta = sourceSign * Math.abs(metalGrams);
      
      txn.sourceDelta = sourceDelta;
      txn.targetDelta = targetDelta;

      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, sourceDelta);
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue;
      acc.rupee_class = rr.newPosition;

      txn.metal_balance_before = acc.metal_balance;
      txn.metal_class_before = acc.metal_class;
      
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, targetDelta);
      acc.metal_balance = mr.newValue;
      acc.metal_class = mr.newPosition;
    }

    txn.balance_after = acc.rupee_balance;
    txn.class_after = acc.rupee_class;

  } else if (txn.section === 'metal') {
    txn.balance_before = acc.metal_balance;
    txn.class_before = acc.metal_class;

    if (txn.action.startsWith('increase_') || txn.action.startsWith('decrease_')) {
      const m = applyPositionChange(acc.metal_balance, acc.metal_class, txn.action, txn.amount);
      acc.metal_balance = m.newValue;
      acc.metal_class = m.newPosition;

    } else if (txn.action === 'convert_metal_to_rupee') {
      const rupeeAmt = metalToRupee(txn.amount, txn.rate);
      txn.result_rupee = rupeeAmt;

      const sourceSign = Math.sign(normalizePosition(acc.metal_balance, acc.metal_class).signedBalance);
      if (sourceSign === 0) throw new Error('Cannot perform adjustment. Source balance is exactly zero.');
      const sourceDelta = -sourceSign * Math.abs(txn.amount);
      const targetDelta = sourceSign * Math.abs(rupeeAmt);
      
      txn.sourceDelta = sourceDelta;
      txn.targetDelta = targetDelta;

      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, sourceDelta);
      acc.metal_balance = mr.newValue;
      acc.metal_class = mr.newPosition;

      txn.rupee_balance_before = acc.rupee_balance;
      txn.rupee_class_before = acc.rupee_class;
      
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, targetDelta);
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue;
      acc.rupee_class = rr.newPosition;
    } else if (txn.action === 'rate_booking') {
      // Book Rate: Metal-only effect. NO rupee change.
      const metalGrams = rupeeToMetal(txn.rupee_amount, txn.rate);
      txn.amount = metalGrams;
      txn.result_grams = metalGrams;

      // Use explicit sourceOperation for signed-delta calculation
      const sourceOperation = txn.sourceOperation;
      if (!sourceOperation) throw new Error('Missing sourceOperation for rate booking');
      const sourceDelta = getSignedDelta(sourceOperation, metalGrams);
      txn.sourceDelta = sourceDelta;

      const m = applySignedDelta(acc.metal_balance, acc.metal_class, sourceDelta);
      acc.metal_balance = m.newValue;
      acc.metal_class = m.newPosition;
    }

    txn.balance_after = acc.metal_balance;
    txn.class_after = acc.metal_class;
  }

  acc.transactions.unshift(txn);
  saveAccounts(accounts);
  return acc;
}

// ── Cancel Transaction (Individual Mode) ──
export function cancelTransaction(accountId, txnId) {
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return { error: 'Account not found' };

  const validTxns = acc.transactions.filter(t => t.status !== 'cancelled' && t.status !== 'edited');
  if (validTxns.length === 0) return { error: 'No transactions to cancel' };

  const mostRecent = validTxns[0];
  if (mostRecent.id !== txnId) {
    return { error: 'You can only cancel the most recent transaction to maintain ledger integrity.' };
  }

  // Check time limit (1 hour = 3600000 ms)
  const age = Date.now() - new Date(mostRecent.created_at).getTime();
  if (age > 3600000) {
    return { error: 'Transactions can only be cancelled within 1 hour of creation.' };
  }

  // Helper to reverse an explicit op
  const getReverseOp = (op) => {
    if (op === 'increase_receivable') return 'decrease_receivable';
    if (op === 'decrease_receivable') return 'increase_receivable';
    if (op === 'increase_payable') return 'decrease_payable';
    if (op === 'decrease_payable') return 'increase_payable';
    if (op === 'increase') return 'decrease';
    if (op === 'decrease') return 'increase';
    return op;
  };

  if (mostRecent.section === 'rupee') {
    if (mostRecent.action.startsWith('increase') || mostRecent.action.startsWith('decrease')) {
      const rOp = getReverseOp(mostRecent.action);
      const r = applyPositionChange(acc.rupee_balance, acc.rupee_class, rOp, mostRecent.amount);
      validateRupeeLimit(r.newValue);
      acc.rupee_balance = r.newValue;
      acc.rupee_class = r.newPosition;
    } else if (mostRecent.action === 'convert_rupee_to_metal') {
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, -mostRecent.sourceDelta);
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue;
      acc.rupee_class = rr.newPosition;
      
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, -mostRecent.targetDelta);
      acc.metal_balance = mr.newValue;
      acc.metal_class = mr.newPosition;
    }
  } else if (mostRecent.section === 'metal') {
    if (mostRecent.action.startsWith('increase') || mostRecent.action.startsWith('decrease')) {
      const mOp = getReverseOp(mostRecent.action);
      const m = applyPositionChange(acc.metal_balance, acc.metal_class, mOp, mostRecent.amount);
      acc.metal_balance = m.newValue;
      acc.metal_class = m.newPosition;
    } else if (mostRecent.action === 'rate_booking') {
      // Reverse using the stored signed delta
      const reverseDelta = -(mostRecent.sourceDelta || 0);
      const m = applySignedDelta(acc.metal_balance, acc.metal_class, reverseDelta);
      acc.metal_balance = m.newValue;
      acc.metal_class = m.newPosition;
    } else if (mostRecent.action === 'convert_metal_to_rupee') {
      const mr = applySignedDelta(acc.metal_balance, acc.metal_class, -mostRecent.sourceDelta);
      acc.metal_balance = mr.newValue;
      acc.metal_class = mr.newPosition;
      
      const rr = applySignedDelta(acc.rupee_balance, acc.rupee_class, -mostRecent.targetDelta);
      validateRupeeLimit(rr.newValue);
      acc.rupee_balance = rr.newValue;
      acc.rupee_class = rr.newPosition;
    }
  }

  const actualTxn = acc.transactions.find(t => t.id === txnId);
  actualTxn.status = 'cancelled';
  actualTxn.cancelled_at = new Date().toISOString();
  
  saveAccounts(accounts);
  return { success: true, account: acc };
}

// ── Get Transactions ──
export function getTransactions(accountId, section = null) {
  const acc = getAccount(accountId);
  if (!acc) return [];
  if (section) return acc.transactions.filter(t => t.section === section);
  return acc.transactions;
}

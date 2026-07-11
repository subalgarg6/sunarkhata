/**
 * SunarKhata — Individual Account Service
 * Core business logic: auto-flip, conversions, rate booking, purity conversion
 */

const ACCOUNTS_KEY = 'sk_individual_accounts';

// ── Helpers ──
function loadAccounts() { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); }
function saveAccounts(a) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); }
function genId() { return 'ind_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function txnId() { return 'txn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── Get All Accounts for a User ──
export function getIndividualAccounts(userId) {
  return loadAccounts().filter(a => a.user_id === userId);
}

// ── Get Single Account ──
export function getAccount(accountId) {
  return loadAccounts().find(a => a.id === accountId) || null;
}

// ── Create Account ──
export function createIndividualAccount({ userId, role, otherPartyName, metalBalance = 0, metalClass = 'receivable', rupeeBalance = 0, rupeeClass = 'receivable' }) {
  const accounts = loadAccounts();
  const account = {
    id: genId(),
    user_id: userId,
    type: 'individual',
    role, // 'supplier' | 'trade_customer'
    other_party_name: otherPartyName,
    metal_balance: Math.abs(metalBalance),  // Always in grams, 100% pure
    metal_class: metalClass,                // 'receivable' (receivable) | 'payable' (payable)
    rupee_balance: Math.abs(rupeeBalance),  // Always in ₹
    rupee_class: rupeeClass,                // 'receivable' (receivable) | 'payable' (payable)
    transactions: [],
    created_at: new Date().toISOString(),
  };
  accounts.push(account);
  saveAccounts(accounts);
  return account;
}

// ── Delete Account ──
export function deleteIndividualAccount(accountId) {
  const accounts = loadAccounts().filter(a => a.id !== accountId);
  saveAccounts(accounts);
}

// ── Auto-Flip Logic ──
// If balance goes negative after a transaction, flip the class and make balance positive
function applyAutoFlip(balance, cls) {
  if (balance < 0) {
    return { balance: Math.abs(balance), cls: cls === 'receivable' ? 'payable' : 'receivable' };
  }
  return { balance, cls };
}

// ── Purity Conversion ──
// Converts gross weight at given purity (+optional labour%) to 100% fine gold
export function toFineGold(grossGrams, purityPercent, labourPercent = 0) {
  const totalPercent = Math.min(purityPercent + labourPercent, 100);
  return parseFloat((grossGrams * totalPercent / 100).toFixed(3));
}

// ── Rate Conversion Helpers ──
// Rate is always per 10 grams
export function rupeeToMetal(rupeeAmount, ratePer10g) {
  if (!ratePer10g || ratePer10g <= 0) return 0;
  return parseFloat(((rupeeAmount / ratePer10g) * 10).toFixed(3));
}

export function metalToRupee(metalGrams, ratePer10g) {
  return parseFloat(((metalGrams / 10) * ratePer10g).toFixed(2));
}

// ── Add Transaction ──
function addTransaction(accountId, txn) {
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return null;

  // Record before-state
  txn.id = txnId();
  txn.created_at = new Date().toISOString();

  if (txn.section === 'rupee') {
    txn.balance_before = acc.rupee_balance;
    txn.class_before = acc.rupee_class;

    if (txn.action === 'increase') {
      acc.rupee_balance += txn.amount;
    } else if (txn.action === 'decrease') {
      acc.rupee_balance -= txn.amount;
    } else if (txn.action === 'convert_to_metal') {
      // Reduce rupee, increase metal
      acc.rupee_balance -= txn.amount;
      const metalBefore = acc.metal_balance;
      const metalClassBefore = acc.metal_class;
      const metalGrams = rupeeToMetal(txn.amount, txn.rate);
      txn.result_grams = metalGrams;

      // Apply to metal (increase)
      if (acc.metal_class === 'receivable') {
        acc.metal_balance += metalGrams;
      } else {
        acc.metal_balance -= metalGrams;
      }
      const metalFlip = applyAutoFlip(acc.metal_balance, acc.metal_class);
      acc.metal_balance = metalFlip.balance;
      acc.metal_class = metalFlip.cls;
    }

    // Apply auto-flip for rupee
    const rupeeFlip = applyAutoFlip(acc.rupee_balance, acc.rupee_class);
    acc.rupee_balance = rupeeFlip.balance;
    acc.rupee_class = rupeeFlip.cls;
    txn.balance_after = acc.rupee_balance;
    txn.class_after = acc.rupee_class;

  } else if (txn.section === 'metal') {
    txn.balance_before = acc.metal_balance;
    txn.class_before = acc.metal_class;

    if (txn.action === 'increase') {
      acc.metal_balance += txn.amount; // amount is in pure grams
    } else if (txn.action === 'decrease') {
      acc.metal_balance -= txn.amount;
    } else if (txn.action === 'convert_to_rupee') {
      // Reduce metal, increase rupee
      acc.metal_balance -= txn.amount;
      const rupeeAmt = metalToRupee(txn.amount, txn.rate);
      txn.result_rupee = rupeeAmt;

      if (acc.rupee_class === 'receivable') {
        acc.rupee_balance += rupeeAmt;
      } else {
        acc.rupee_balance -= rupeeAmt;
      }
      const rupeeFlip = applyAutoFlip(acc.rupee_balance, acc.rupee_class);
      acc.rupee_balance = rupeeFlip.balance;
      acc.rupee_class = rupeeFlip.cls;
    } else if (txn.action === 'rate_booking') {
      // Convert rupee to metal weight using rate — DOES NOT affect rupee section
      const metalGrams = rupeeToMetal(txn.rupee_amount, txn.rate);
      txn.amount = metalGrams;
      txn.result_grams = metalGrams;
      acc.metal_balance += metalGrams;
    }

    // Apply auto-flip for metal
    const metalFlip = applyAutoFlip(acc.metal_balance, acc.metal_class);
    acc.metal_balance = metalFlip.balance;
    acc.metal_class = metalFlip.cls;
    txn.balance_after = acc.metal_balance;
    txn.class_after = acc.metal_class;
  }

  acc.transactions.unshift(txn); // newest first
  saveAccounts(accounts);
  return acc;
}

// ── Public Transaction Methods ──

export function rupeeIncrease(accountId, amount, mention = '') {
  return addTransaction(accountId, { section: 'rupee', action: 'increase', amount, mention });
}

export function rupeeDecrease(accountId, amount, mention = '') {
  return addTransaction(accountId, { section: 'rupee', action: 'decrease', amount, mention });
}

export function convertRupeeToMetal(accountId, rupeeAmount, ratePer10g, mention = '') {
  return addTransaction(accountId, { section: 'rupee', action: 'convert_to_metal', amount: rupeeAmount, rate: ratePer10g, mention });
}

export function metalIncrease(accountId, pureGrams, mention = '') {
  return addTransaction(accountId, { section: 'metal', action: 'increase', amount: pureGrams, mention });
}

export function metalDecrease(accountId, pureGrams, mention = '') {
  return addTransaction(accountId, { section: 'metal', action: 'decrease', amount: pureGrams, mention });
}

export function convertMetalToRupee(accountId, metalGrams, ratePer10g, mention = '') {
  return addTransaction(accountId, { section: 'metal', action: 'convert_to_rupee', amount: metalGrams, rate: ratePer10g, mention });
}

export function metalRateBooking(accountId, rupeeAmount, ratePer10g, mention = '') {
  return addTransaction(accountId, { section: 'metal', action: 'rate_booking', amount: 0, rupee_amount: rupeeAmount, rate: ratePer10g, mention });
}

// ── Cancel Transaction (Individual Mode) ──
export function cancelTransaction(accountId, txnId) {
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return { error: 'Account not found' };

  // Get the most recent non-cancelled transaction
  const validTxns = acc.transactions.filter(t => t.status !== 'cancelled');
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

  // Reverse the balances based on the transaction type
  if (mostRecent.section === 'rupee') {
    if (mostRecent.action === 'increase' || mostRecent.action === 'convert_to_rupee') {
      acc.rupee_balance -= mostRecent.amount;
    } else if (mostRecent.action === 'decrease' || mostRecent.action === 'convert_to_metal') {
      acc.rupee_balance += mostRecent.amount;
    }
    const flip = applyAutoFlip(acc.rupee_balance, acc.rupee_class);
    acc.rupee_balance = flip.balance;
    acc.rupee_class = flip.cls;
  } else if (mostRecent.section === 'metal') {
    if (mostRecent.action === 'increase' || mostRecent.action === 'rate_booking') {
      const metalAmount = mostRecent.action === 'rate_booking' ? mostRecent.result_grams : mostRecent.amount;
      acc.metal_balance -= metalAmount;
    } else if (mostRecent.action === 'decrease' || mostRecent.action === 'convert_to_rupee') {
      acc.metal_balance += mostRecent.amount;
    } else if (mostRecent.action === 'convert_to_metal') {
      acc.metal_balance -= mostRecent.result_grams;
    }
    const flip = applyAutoFlip(acc.metal_balance, acc.metal_class);
    acc.metal_balance = flip.balance;
    acc.metal_class = flip.cls;
  }

  // Mark as cancelled (keep in audit trail)
  const actualTxn = acc.transactions.find(t => t.id === txnId);
  actualTxn.status = 'cancelled';
  actualTxn.cancelled_at = new Date().toISOString();
  
  saveAccounts(accounts);
  return { success: true, account: acc };
}

// ── Edit Transaction (Individual Mode) ──
export function editTransaction(accountId, txnId, newTxnParams) {
  // 1. Cancel the old transaction
  const cancelRes = cancelTransaction(accountId, txnId);
  if (cancelRes.error) return cancelRes;

  // 2. Mark the cancelled transaction specifically as 'edited'
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.id === accountId);
  const oldTxn = acc.transactions.find(t => t.id === txnId);
  oldTxn.status = 'edited';
  saveAccounts(accounts);

  // 3. Apply the new transaction based on params
  let newAcc;
  const { section, action, amount, rate, mention, rupee_amount } = newTxnParams;
  if (section === 'rupee') {
    if (action === 'increase') newAcc = rupeeIncrease(accountId, amount, mention);
    else if (action === 'decrease') newAcc = rupeeDecrease(accountId, amount, mention);
    else if (action === 'convert_to_metal') newAcc = convertRupeeToMetal(accountId, amount, rate, mention);
  } else if (section === 'metal') {
    if (action === 'increase') newAcc = metalIncrease(accountId, amount, mention);
    else if (action === 'decrease') newAcc = metalDecrease(accountId, amount, mention);
    else if (action === 'convert_to_rupee') newAcc = convertMetalToRupee(accountId, amount, rate, mention);
    else if (action === 'rate_booking') newAcc = metalRateBooking(accountId, rupee_amount, rate, mention);
  }

  return { success: true, account: newAcc || acc };
}

// ── Get Transactions for a Section ──
export function getTransactions(accountId, section = null) {
  const acc = getAccount(accountId);
  if (!acc) return [];
  if (section) return acc.transactions.filter(t => t.section === section);
  return acc.transactions;
}

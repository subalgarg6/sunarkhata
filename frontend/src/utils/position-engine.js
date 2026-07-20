/**
 * SUNARKHATA — CENTRAL POSITION ENGINE
 * 
 * This is the SINGLE SOURCE OF TRUTH for all balance + position calculations.
 * 
 * Every transaction type — direct metal, direct rupee, cross-ledger conversion,
 * book rate, mutual approval, and cancellation reversal — MUST use this engine.
 * 
 * RULES:
 * - Value is always >= 0 for display, but internally tracked as signed.
 * - Position is 'receivable', 'payable', or 'neutral'.
 * - When a transaction crosses zero, the position FLIPS.
 * - ZERO IS NEUTRAL.
 */

/**
 * Normalizes legacy data into a signed domain state.
 * Legacy accounts may have balance 0 but class 'payable'.
 * 
 * @param {number} balance 
 * @param {string} persistedPosition 
 * @returns {{ signedBalance: number, displayBalance: number, position: string }}
 */
export function normalizePosition(balance, persistedPosition) {
  const val = Math.abs(parseFloat(balance) || 0);
  if (val === 0) {
    return { signedBalance: 0, displayBalance: 0, position: 'neutral' };
  }
  if (persistedPosition === 'payable') {
    return { signedBalance: -val, displayBalance: val, position: 'payable' };
  }
  return { signedBalance: val, displayBalance: val, position: 'receivable' };
}

/**
 * Derives output state from a signed balance.
 */
function deriveState(signedBalance) {
  if (signedBalance === 0) {
    return { signedBalance: 0, displayBalance: 0, position: 'neutral' };
  }
  if (signedBalance < 0) {
    return { signedBalance, displayBalance: Math.abs(signedBalance), position: 'payable' };
  }
  return { signedBalance, displayBalance: signedBalance, position: 'receivable' };
}

/**
 * Apply a position change to a ledger balance.
 * 
 * @param {number} currentValue - Current balance
 * @param {string} currentPosition - Current position
 * @param {string} operation - 'increase_receivable' | 'decrease_receivable' | 'increase_payable' | 'decrease_payable' 
 *                             or legacy 'increase' / 'decrease'
 * @param {number} transactionValue - Transaction amount (always >= 0)
 * @returns {{ newValue: number, newPosition: string }}
 */
export function applyPositionChange(currentValue, currentPosition, operation, transactionValue) {
  const current = normalizePosition(currentValue, currentPosition);
  const txnVal = Math.abs(parseFloat(transactionValue) || 0);
  
  let effect = 0;
  
  // Signed effect model:
  // INCREASE RECEIVABLE -> positive signed effect
  // DECREASE RECEIVABLE -> negative signed effect
  // INCREASE PAYABLE -> negative signed effect
  // DECREASE PAYABLE -> positive signed effect
  
  if (operation === 'increase_receivable') {
    effect = txnVal;
  } else if (operation === 'decrease_receivable') {
    effect = -txnVal;
  } else if (operation === 'increase_payable') {
    effect = -txnVal;
  } else if (operation === 'decrease_payable') {
    effect = txnVal;
  } 
  // Legacy mappings for older service callers that just pass 'increase' or 'decrease' based on current class
  else if (operation === 'increase') {
     if (current.position === 'payable') effect = -txnVal;
     else effect = txnVal; // Receivable defaults to positive
  } else if (operation === 'decrease') {
     if (current.position === 'payable') effect = txnVal;
     else effect = -txnVal;
  }

  const newSignedBalance = current.signedBalance + effect;
  const state = deriveState(newSignedBalance);
  
  // Return in the format expected by callers, mapping signed logic back to display bounds
  return {
    newValue: state.displayBalance,
    newPosition: state.position
  };
}

/**
 * Flip a position to its opposite.
 * @param {string} position
 * @returns {string} 
 */
export function flipPosition(position) {
  if (position === 'neutral') return 'neutral';
  return position === 'receivable' ? 'payable' : 'receivable';
}

/**
 * Get the user-facing display label for a position.
 */
export function getPositionLabel(position) {
  if (position === 'neutral') return 'Neutral';
  return position === 'receivable' ? 'Receivable (Lena Hai)' : 'Payable (Dena Hai)';
}

/**
 * Get the short position label (no Hindi).
 */
export function getPositionShort(position) {
  if (position === 'neutral') return 'Neutral';
  return position === 'receivable' ? 'Receivable' : 'Payable';
}

/**
 * Determine the CSS color class for a position.
 */
export function getPositionColor(position) {
  if (position === 'neutral') return 'text-on-surface-variant bg-surface-container-high';
  return position === 'receivable'
    ? 'text-success-emerald bg-green-50'
    : 'text-error-crimson bg-red-50';
}

/**
 * Determine the CSS color class for position text only.
 */
export function getPositionTextColor(position) {
  if (position === 'neutral') return 'text-on-surface-variant';
  return position === 'receivable' ? 'text-success-emerald' : 'text-error-crimson';
}

/**
 * Get dynamic action button labels based on current position.
 * Also returns explicit semantic operation keys.
 */
export function getActionLabels(position) {
  if (position === 'receivable') {
    return {
      action1Label: 'Increase Receivable', action1Op: 'increase_receivable',
      action2Label: 'Decrease Receivable', action2Op: 'decrease_receivable'
    };
  } else if (position === 'payable') {
    return {
      action1Label: 'Increase Payable', action1Op: 'increase_payable',
      action2Label: 'Decrease Payable', action2Op: 'decrease_payable'
    };
  } else {
    // Neutral
    return {
      action1Label: 'Increase Receivable', action1Op: 'increase_receivable',
      action2Label: 'Increase Payable', action2Op: 'increase_payable'
    };
  }
}

/**
 * Get dynamic action button labels for mutual (propose prefix).
 */
export function getMutualActionLabels(position) {
  if (position === 'receivable') {
    return {
      action1Label: 'Propose Inc. Receivable', action1Op: 'increase_receivable',
      action2Label: 'Propose Dec. Receivable', action2Op: 'decrease_receivable'
    };
  } else if (position === 'payable') {
    return {
      action1Label: 'Propose Inc. Payable', action1Op: 'increase_payable',
      action2Label: 'Propose Dec. Payable', action2Op: 'decrease_payable'
    };
  } else {
    return {
      action1Label: 'Propose Inc. Receivable', action1Op: 'increase_receivable',
      action2Label: 'Propose Inc. Payable', action2Op: 'increase_payable'
    };
  }
}

/**
 * Format a role for user-facing display.
 */
export function formatRole(role) {
  const r = (role || '').toLowerCase();
  if (r === 'supplier' || r === 'seller' || r === 'vendor') return 'Supplier';
  if (r === 'trade_customer' || r === 'buyer' || r === 'customer') return 'Trade Customer';
  return role || 'Unknown';
}

export function getOtherPartyRoleLabel(currentUserRole) {
  const r = (currentUserRole || '').toLowerCase();
  if (r === 'supplier' || r === 'seller' || r === 'vendor') return 'Trade Customer';
  if (r === 'trade_customer' || r === 'buyer' || r === 'customer') return 'Supplier';
  return 'Other Party';
}

export function getOtherPartyNameLabel(currentUserRole) {
  const r = (currentUserRole || '').toLowerCase();
  if (r === 'supplier' || r === 'seller' || r === 'vendor') return 'Trade Customer Name';
  if (r === 'trade_customer' || r === 'buyer' || r === 'customer') return 'Supplier Name';
  return 'Other Party Name';
}

export function getOtherPartyNamePlaceholder(currentUserRole) {
  return 'e.g. Agarwal Jeweller';
}


export function getSignedDelta(operation, amount) {
  const amt = Math.abs(parseFloat(amount) || 0);
  if (operation === 'increase_receivable') return amt;
  if (operation === 'decrease_receivable') return -amt;
  if (operation === 'increase_payable') return -amt;
  if (operation === 'decrease_payable') return amt;
  return 0;
}

export function applySignedDelta(currentValue, currentPosition, signedDelta) {
  const current = normalizePosition(currentValue, currentPosition);
  const newSignedBalance = current.signedBalance + parseFloat(signedDelta);
  const state = deriveState(newSignedBalance);
  return {
    newValue: state.displayBalance,
    newPosition: state.position
  };
}

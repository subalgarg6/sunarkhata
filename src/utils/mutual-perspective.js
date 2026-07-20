/**
 * SUNARKHATA — MUTUAL ACCOUNT PERSPECTIVE ENGINE
 * 
 * This module is purely functional and contains no side effects, API calls, or state mutations.
 * It is responsible for translating the single canonical ledger (Creator's perspective)
 * into the viewer's correct perspective based on auth.uid().
 */

import { flipPosition } from './position-engine.js';

/**
 * Returns true if the user is the creator of the mutual account.
 */
export function isCreator(account, userId) {
    if (!account || !userId) return false;
    return account.creator_id === userId;
}

/**
 * Returns the viewer's perspective role (Supplier or Trade Customer).
 */
export function getPerspectiveRole(account, userId) {
    if (!account) return 'unknown';
    const creatorRole = account.creator_role || 'supplier';
    if (isCreator(account, userId)) {
        return creatorRole;
    }
    return creatorRole === 'supplier' ? 'trade_customer' : 'supplier';
}

/**
 * Returns the account title from the viewer's perspective.
 * Creator sees: other_party_name (the name they gave the partner)
 * Partner sees: creator_name (we fall back to 'Creator Account' since creator_alias is removed)
 */
export function getPerspectiveTitle(account, userId) {
    if (!account) return 'Unknown Account';
    
    if (isCreator(account, userId)) {
        return account.other_party_name || 'Partner Account';
    } else {
        return account.creator_name || 'Creator Account';
    }
}

/**
 * Returns the metal class (receivable/payable/neutral) from the viewer's perspective.
 */
export function getPerspectiveMetalClass(account, userId) {
    if (!account) return 'neutral';
    const canonicalClass = account.metal_class || 'neutral';
    if (isCreator(account, userId)) {
        return canonicalClass;
    }
    return flipPosition(canonicalClass);
}

/**
 * Returns the rupee class (receivable/payable/neutral) from the viewer's perspective.
 */
export function getPerspectiveRupeeClass(account, userId) {
    if (!account) return 'neutral';
    const canonicalClass = account.rupee_class || 'neutral';
    if (isCreator(account, userId)) {
        return canonicalClass;
    }
    return flipPosition(canonicalClass);
}

/**
 * Translates a canonical database action into the viewer's perspective label.
 * Example: canonical 'increase_receivable' -> 'Increase Payable' for Partner.
 */
export function getPerspectiveActionLabel(canonicalAction, userIsCreator) {
    if (!canonicalAction) return '';
    
    if (userIsCreator) {
        // Creator sees the canonical action exactly as-is
        switch(canonicalAction) {
            case 'increase_receivable': return 'Increase Receivable';
            case 'decrease_receivable': return 'Decrease Receivable';
            case 'increase_payable': return 'Increase Payable';
            case 'decrease_payable': return 'Decrease Payable';
            default: return canonicalAction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    } else {
        // Partner sees the inverted perspective
        switch(canonicalAction) {
            case 'increase_receivable': return 'Increase Payable';
            case 'decrease_receivable': return 'Decrease Payable';
            case 'increase_payable': return 'Increase Receivable';
            case 'decrease_payable': return 'Decrease Receivable';
            default: return canonicalAction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }
}

/**
 * Maps a canonical action to its logical 'inverted' canonical action if needed.
 * Used for translating history records or UI buttons.
 */
export function flipAction(action) {
    switch(action) {
        case 'increase_receivable': return 'increase_payable';
        case 'decrease_receivable': return 'decrease_payable';
        case 'increase_payable': return 'increase_receivable';
        case 'decrease_payable': return 'decrease_receivable';
        default: return action;
    }
}

/**
 * Translates an action from the user's perspective into the canonical action.
 * For example, if the partner clicks "Increase Payable", the canonical action is "increase_receivable".
 */
export function translateActionToCanonical(action, isUserCreator) {
    if (isUserCreator) {
        return action;
    }
    return flipAction(action);
}

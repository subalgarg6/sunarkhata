export function isCustomerMetalPayable(accountRole, displayedMetalPosition) {
    if (accountRole === 'customer' || accountRole === 'trade_customer') {
        return displayedMetalPosition === 'payable';
    } else if (accountRole === 'vendor' || accountRole === 'supplier') {
        // If the current user is a vendor, the customer is the other party.
        // The displayed position is from the current user's perspective.
        // So if the current user (vendor) has a receivable position, it means the other party (customer) has a payable position.
        return displayedMetalPosition === 'receivable';
    }
    return false;
}

/**
 * Calculate Fine Gold (24K) in grams based on original weight, purity, and labour.
 * Formula: Original Weight (g) × (Purity (%) + Labour (%)) ÷ 100
 * @param {number} weight - Original weight in grams
 * @param {number} purity - Purity percentage (e.g. 10 for 10%)
 * @param {number} labour - Labour percentage (e.g. 1 for 1%)
 * @returns {number} Calculated fine gold in grams
 */
export function calculateFineGold(weight, purity = 0, labour = 0) {
    const w = parseFloat(weight);
    const p = parseFloat(purity) || 0;
    const l = parseFloat(labour) || 0;
    
    if (isNaN(w) || w < 0 || p < 0 || l < 0) return 0;
    
    return (w * (p + l)) / 100;
}

export const MAX_RUPEE_BALANCE = 10000000000000000;

export function validateRupeeLimit(balance) {
    if (Math.abs(parseFloat(balance) || 0) > MAX_RUPEE_BALANCE) {
        throw new Error('Maximum supported rupee balance is ₹1,00,00,00,00,00,00,00,000');
    }
}

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

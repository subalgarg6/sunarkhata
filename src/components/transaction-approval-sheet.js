import { formatIndianNumber, formatCurrency } from '../utils/formatters.js';

export function showTransactionApprovalSheet({
    txn,
    partnerName,
    onApprove,
    onReject,
    onClose
}) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex flex-col justify-end lg:justify-center items-center bg-primary/20 backdrop-blur-sm transition-opacity opacity-0';
    
    // Determine visual details
    let title = txn.type.replace(/_/g, ' ');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (txn.type === 'convert_to_metal') title = 'Adjust in Gold';
    if (txn.type === 'convert_to_rupee') title = 'Cash Settlement';
    if (txn.type === 'rate_booking') title = 'Book Rate';

    const mVal = parseFloat(txn.metal_amount) || 0;
    const rVal = parseFloat(txn.rupee_amount) || 0;

    // Use absolute values for the sheet to show the transaction size
    const absMetal = Math.abs(mVal);
    const absRupee = Math.abs(rVal);

    // Format numbers
    function fmtG(g) { return formatIndianNumber(g, 3); }
    function fmtR(r) { return new Intl.NumberFormat('en-IN').format(Math.round(parseFloat(r || 0))); }

    let detailsHTML = '';
    
    if (absRupee > 0) {
        detailsHTML += `
        <div class="p-4 bg-surface-container-low border border-surface-variant ledger-stitch flex justify-between items-center">
            <p class="font-label-bold text-label-bold text-on-surface-variant uppercase">Rupee Value</p>
            <p class="font-display-md text-display-md text-primary">${formatCurrency(absRupee)}</p>
        </div>
        `;
    }
    
    if (absMetal > 0) {
        detailsHTML += `
        <div class="p-4 bg-surface-container-low border border-surface-variant ledger-stitch flex justify-between items-center mt-3">
            <p class="font-label-bold text-label-bold text-on-surface-variant uppercase">${txn.type === 'convert_to_metal' || txn.type === 'rate_booking' ? 'Calculated Metal' : 'Metal Weight'}</p>
            <p class="font-display-md text-display-md text-secondary">${fmtG(absMetal)} g</p>
        </div>
        `;
    }

    let extraDetails = '';
    if (txn.rate) {
        extraDetails += `
        <div class="flex justify-between items-center py-3 px-1 border-t border-surface-variant mt-2">
            <span class="font-body-md text-on-surface-variant">Gold Rate Locked At</span>
            <span class="font-mono-data text-mono-data text-primary">${formatCurrency(txn.rate)} / 10g</span>
        </div>
        `;
    }

    const isCancel = txn.status === 'pending_cancellation';
    const actionText = isCancel ? 'Cancellation Approval Required' : 'Transaction Approval Required';
    const statusText = isCancel ? 'Pending Cancellation' : 'Pending Approval';
    const infoText = isCancel 
        ? 'Approving this will permanently reverse this transaction from both ledgers.'
        : 'Balances in the metal and rupee books will update only after both parties approve this transaction. Once approved, entries will be automatically stitched into your respective ledgers.';

    overlay.innerHTML = `
        <div class="bg-surface-container-lowest w-full lg:w-[480px] lg:rounded-xl shadow-2xl flex flex-col max-h-[90vh] transform translate-y-full lg:translate-y-8 transition-transform duration-300" id="sheetContent">
            <!-- Header Section (Sticky Top) -->
            <header class="p-container-padding-mobile border-b border-surface-variant flex items-start justify-between bg-surface-container-lowest shrink-0 lg:rounded-t-xl">
                <div>
                    <h2 class="font-headline-sm text-headline-sm text-primary">${actionText}</h2>
                    <div class="mt-1 flex items-center gap-2">
                        <span class="inline-block w-2 h-2 rounded-full ${isCancel ? 'bg-error-crimson' : 'bg-secondary'} status-pulse"></span>
                        <span class="font-label-bold text-label-bold uppercase tracking-wider ${isCancel ? 'text-error-crimson' : 'text-secondary'}">Status: ${statusText}</span>
                    </div>
                </div>
                <button class="text-on-surface-variant hover:text-primary transition-colors p-1" id="closeBtn">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </header>
            
            <!-- Main Content Area (Scrollable) -->
            <main class="flex-1 overflow-y-auto p-container-padding-mobile space-y-6">
                <!-- Initiated By -->
                <div class="flex items-center gap-3 p-3 bg-surface-container-low border border-surface-variant rounded">
                    <div class="w-10 h-10 rounded-full overflow-hidden border border-surface-variant bg-surface-container flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-on-surface-variant">person</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-label-bold text-label-bold text-on-surface-variant uppercase truncate">Initiated By</p>
                        <p class="font-title-lg text-title-lg text-primary truncate">${partnerName}</p>
                    </div>
                    <div class="text-right shrink-0 pl-2">
                        <p class="font-label-bold text-label-bold text-on-surface-variant uppercase">Order ID</p>
                        <p class="font-mono-data text-mono-data">#${txn.id.substring(0,6).toUpperCase()}</p>
                    </div>
                </div>
                
                <!-- Transaction Details -->
                <div class="space-y-3">
                    <div class="flex justify-between items-center py-2 border-b border-surface-variant">
                        <span class="font-body-md text-on-surface-variant">Transaction Type</span>
                        <span class="font-title-lg text-title-lg text-primary">${title}</span>
                    </div>
                    ${txn.narration ? `
                    <div class="flex justify-between items-center py-2 border-b border-surface-variant">
                        <span class="font-body-md text-on-surface-variant">Mention</span>
                        <span class="font-body-md text-primary max-w-[200px] truncate text-right">${txn.narration}</span>
                    </div>
                    ` : ''}
                    
                    <div class="flex flex-col gap-3 mt-4">
                        ${detailsHTML}
                    </div>
                    
                    ${extraDetails}
                </div>
                
                <!-- Explanatory Text -->
                <div class="p-4 bg-surface-container-low rounded border border-surface-variant flex gap-3">
                    <span class="material-symbols-outlined ${isCancel ? 'text-error-crimson' : 'text-secondary'} shrink-0">info</span>
                    <p class="font-body-sm text-on-surface-variant leading-relaxed">
                        ${infoText}
                    </p>
                </div>
            </main>
            
            <!-- Footer Section (Sticky Bottom) -->
            <footer class="p-container-padding-mobile bg-surface-container-lowest border-t border-surface-variant shrink-0 flex gap-3 lg:rounded-b-xl">
                <button id="rejectBtn" class="flex-1 bg-transparent border border-error text-error font-body-lg py-3 rounded hover:bg-error/5 transition-colors flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-sm">close</span>
                    Reject
                </button>
                <button id="approveBtn" class="flex-[2] bg-primary text-white font-title-lg py-3 rounded hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group">
                    Approve
                    <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">check_circle</span>
                </button>
            </footer>
        </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        const sheetContent = overlay.querySelector('#sheetContent');
        sheetContent.classList.remove('translate-y-full', 'lg:translate-y-8');
    });

    const closeSheet = () => {
        overlay.classList.add('opacity-0');
        const sheetContent = overlay.querySelector('#sheetContent');
        sheetContent.classList.add('translate-y-full', 'lg:translate-y-8');
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            if (onClose) onClose();
        }, 300);
    };

    overlay.querySelector('#closeBtn').addEventListener('click', closeSheet);
    
    // Close on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSheet();
        }
    });

    // Handle micro-interactions
    overlay.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mousedown', () => { btn.style.transform = 'scale(0.98)'; });
        btn.addEventListener('mouseup', () => { btn.style.transform = 'scale(1)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    });

    overlay.querySelector('#rejectBtn').addEventListener('click', () => {
        if (onReject) onReject();
        closeSheet();
    });

    overlay.querySelector('#approveBtn').addEventListener('click', () => {
        if (onApprove) onApprove();
        closeSheet();
    });
}

export function renderApprovalSheet(container, txn, onAction) {
    showTransactionApprovalSheet({ txn, partyName: txn.party_name || 'Party', isCancel: txn.status === 'pending_cancellation', onApprove: () => onAction('approve'), onReject: () => onAction('reject') });
}

export function showTransactionCancellationSheet({
    txn,
    partyName,
    isMutual,
    onKeep,
    onCancel,
    onClose
}) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex flex-col justify-end lg:justify-center items-center bg-primary/20 backdrop-blur-sm transition-opacity opacity-0';
    
    // Format helpers
    function fmtG(g) { return parseFloat(g || 0).toFixed(3); }
    function fmtR(r) { return new Intl.NumberFormat('en-IN').format(Math.round(parseFloat(r || 0))); }

    const mVal = parseFloat(txn.metal_amount) || 0;
    const rVal = parseFloat(txn.rupee_amount) || 0;
    const absMetal = Math.abs(mVal);
    const absRupee = Math.abs(rVal);
    
    let weightHtml = '';
    if (absMetal > 0) {
        weightHtml = `${fmtG(absMetal)} g`;
    } else {
        weightHtml = '-';
    }

    let metalTypeHtml = 'Fine Gold';
    if (absRupee > 0 && absMetal === 0) {
        metalTypeHtml = 'Cash Only';
        weightHtml = `₹${fmtR(absRupee)}`;
    } else if (absRupee > 0 && absMetal > 0) {
        metalTypeHtml = 'Gold & Cash';
    }

    const dateObj = new Date(txn.created_at);
    const dateStr = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ', ' + 
                    dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const expiryTime = new Date(dateObj.getTime() + 60 * 60 * 1000); // 1 hour later
    const now = new Date();
    const minsLeft = Math.max(0, Math.floor((expiryTime - now) / 60000));
    
    const infoText = isMutual
        ? "Only the latest transaction can be cancelled within 1 hour. This will send a cancellation request that your partner must approve."
        : "Only the latest transaction can be cancelled within 1 hour. This action will permanently reverse the ledger entry and balance.";
        
    const btnText = isMutual ? "Request Cancellation" : "Cancel Transaction";

    overlay.innerHTML = `
        <div class="bg-surface-container-lowest w-full lg:w-[500px] lg:rounded-xl shadow-2xl flex flex-col max-h-[90vh] transform translate-y-full lg:translate-y-8 transition-transform duration-300" id="sheetContent">
            
            <div class="py-stack-md px-container-padding-mobile lg:p-stack-lg border-b border-surface-variant flex justify-between items-start lg:rounded-t-xl">
                <div>
                    <h3 class="font-display-md text-[20px] lg:text-display-md text-primary mb-1">Cancel Last Transaction?</h3>
                    <div class="flex items-center gap-2 text-error font-label-bold">
                        <span class="material-symbols-outlined text-[16px]">schedule</span>
                        <span class="text-[11px] lg:text-[12px]">Cancellation available for ${minsLeft} more minutes</span>
                    </div>
                </div>
                <span class="px-2 py-1 bg-surface-container-high rounded text-[10px] font-label-bold uppercase tracking-widest text-on-surface-variant hidden sm:block">${isMutual ? 'Mutual' : 'Individual'}</span>
            </div>
            
            <div class="flex-1 py-stack-md px-container-padding-mobile lg:p-stack-lg space-y-6 overflow-y-auto">
                <!-- Details Card -->
                <div class="ledger-border border-l-[3px] border-l-secondary p-stack-md bg-surface-bright rounded">
                    <div class="flex flex-col space-y-4">
                        <div class="flex justify-between items-center border-b border-surface-variant pb-2">
                            <div>
                                <p class="text-[11px] font-label-bold text-on-surface-variant uppercase tracking-wider mb-1">Entry Type</p>
                                <p class="font-mono-data text-primary">${metalTypeHtml}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[11px] font-label-bold text-on-surface-variant uppercase tracking-wider mb-1">Amount</p>
                                <p class="font-mono-data text-primary">${weightHtml}</p>
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-[11px] font-label-bold text-on-surface-variant uppercase tracking-wider mb-1">Party</p>
                                <p class="font-body-md font-bold text-primary">${partyName}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[11px] font-label-bold text-on-surface-variant uppercase tracking-wider mb-1">Timestamp</p>
                                <p class="font-mono-data text-on-surface-variant text-[12px]">${dateStr}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-start gap-3 bg-surface-container-low p-stack-md rounded">
                    <span class="material-symbols-outlined text-outline text-[20px] shrink-0">info</span>
                    <p class="text-body-sm text-on-surface-variant leading-relaxed">
                        ${infoText}
                    </p>
                </div>
            </div>
            
            <!-- Sticky Bottom Actions -->
            <div class="p-container-padding-mobile lg:p-stack-lg bg-surface border-t border-surface-variant flex gap-3 lg:rounded-b-xl shrink-0">
                <button id="keepBtn" class="flex-1 h-12 border border-surface-variant text-primary font-label-bold rounded hover:bg-surface-container-low transition-colors">
                    Keep
                </button>
                <button id="cancelActionBtn" class="flex-[2] h-12 bg-primary text-on-primary font-label-bold rounded hover:bg-on-surface-variant transition-colors">
                    ${btnText}
                </button>
            </div>
            
        </div>
    `;

    document.body.appendChild(overlay);

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
    
    // Background click close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSheet();
        }
    });

    // Micro-interactions
    overlay.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mousedown', () => { btn.style.transform = 'scale(0.98)'; });
        btn.addEventListener('mouseup', () => { btn.style.transform = 'scale(1)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    });

    overlay.querySelector('#keepBtn').addEventListener('click', () => {
        if (onKeep) onKeep();
        closeSheet();
    });

    overlay.querySelector('#cancelActionBtn').addEventListener('click', () => {
        if (onCancel) onCancel();
        closeSheet();
    });
}

export function renderCancellationSheet(container, txn, onCancel) {
    showTransactionCancellationSheet({ txn, partyName: txn.party_name || 'Party', isMutual: !!txn.is_mutual, onCancel });
}

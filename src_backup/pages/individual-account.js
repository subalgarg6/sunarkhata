import { getCurrentUser } from '../services/auth.service.js';
import { getAccount, cancelTransaction } from '../services/individual.service.js';
import { formatIndianNumber } from '../utils/formatters.js';
import { renderCancellationSheet } from '../components/transaction-cancellation-sheet.js';

export function renderIndividualAccount(container, accountId) {
    const user = getCurrentUser();
    if (!user) { window.location.hash = '#/auth'; return; }

    let account = getAccount(accountId);
    if (!account) { window.location.hash = '#/dashboard'; return; }

    // Segmented tab state for mobile: 0 = METAL, 1 = RUPEE
    let activeTab = 0;

    function refresh() {
        account = getAccount(accountId);
        if (!account) { window.location.hash = '#/dashboard'; return; }
        render();
    }

    function fmtG(g) { return parseFloat(g || 0).toFixed(3); }
    function fmtR(r) { return formatIndianNumber(Math.round(r || 0)); }

    function getTransactionHTML(txns, sectionType) {
        // filter txns to metal or rupee
        const filtered = txns.filter(t => {
            if (sectionType === 'metal') return t.metal_amount !== 0;
            return t.rupee_amount !== 0;
        });

        if (filtered.length === 0) {
            return `
            <div class="p-8 text-center text-on-surface-variant font-body-sm">
                No ${sectionType} transactions yet.
            </div>`;
        }

        return filtered.map(txn => {
            const dateObj = new Date(txn.created_at);
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            
            const isCancelled = txn.status === 'cancelled';
            let title = 'Transaction';
            if (txn.type === 'increase') title = sectionType === 'metal' ? 'Metal Increase' : 'Rupee Increase';
            else if (txn.type === 'decrease') title = sectionType === 'metal' ? 'Metal Decrease' : 'Rupee Decrease';
            else if (txn.type === 'rate_booking') title = 'Rate Booked';
            
            let valStr = '';
            let valColor = '';
            
            if (sectionType === 'metal') {
                const m = parseFloat(txn.metal_amount);
                valStr = `${m > 0 ? '+' : ''}${fmtG(m)} g`;
                valColor = isCancelled ? 'text-on-surface-variant line-through' : m > 0 ? 'text-primary' : 'text-error';
            } else {
                const r = parseFloat(txn.rupee_amount);
                valStr = `${r > 0 ? '+' : ''}₹${fmtR(r)}`;
                valColor = isCancelled ? 'text-on-surface-variant line-through' : r > 0 ? 'text-[#2E7D32]' : 'text-error';
            }

            return `
            <div class="bg-white ledger-border p-stack-md hover:bg-surface-container-low transition-colors cursor-pointer group txn-row" data-id="${txn.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <p class="font-title-lg text-body-md ${isCancelled ? 'line-through text-on-surface-variant' : ''}">${title}</p>
                        <div class="flex items-center gap-2 mt-1 text-on-surface-variant font-body-sm opacity-70">
                            <span class="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span>${dateStr}, ${timeStr}</span>
                            ${txn.narration ? `<span>· ${txn.narration}</span>` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-mono-data text-body-lg ${valColor}">${valStr}</p>
                        ${isCancelled ? '<p class="text-[10px] text-error uppercase font-label-bold mt-1">CANCELLED</p>' : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    function render() {
        const txns = [...(account.transactions || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const metalBal = parseFloat(account.metal_balance) || 0;
        const rupeeBal = parseFloat(account.rupee_balance) || 0;
        const metalPos = account.metal_class || 'payable';
        const rupeePos = account.rupee_class || 'payable';
        
        const metalPosUpper = metalPos.charAt(0).toUpperCase() + metalPos.slice(1);
        const rupeePosUpper = rupeePos.charAt(0).toUpperCase() + rupeePos.slice(1);

        const metalColor = metalPos === 'payable' ? 'bg-on-error-container text-white' : 'bg-secondary-container text-on-secondary-container';
        const rupeeColor = rupeePos === 'payable' ? 'bg-on-error-container text-white' : 'bg-secondary-container text-on-secondary-container';

        container.innerHTML = `
        <style>
            .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            .ledger-border { border-bottom: 1px solid #E5E5E2; }
            .stitch-accent { border-left: 2px solid #C5A059; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            
            /* Responsive Utilities */
            .desktop-only { display: none; }
            .mobile-only { display: flex; }
            @media (min-width: 1024px) {
                .desktop-only { display: flex; }
                .mobile-only { display: none; }
            }
        </style>
        <div class="bg-surface text-on-surface font-body-md min-h-[100dvh] flex flex-col lg:flex-row w-full">
            
            <!-- TOP NAVIGATION MOBILE -->
            <header class="mobile-only sticky top-0 z-50 bg-surface border-b border-surface-variant items-center justify-between h-14 px-4 w-full">
                <div class="flex items-center gap-3">
                    <button id="mobBackBtn" class="p-1 -ml-1 w-[44px] h-[44px] flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-full">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div class="flex flex-col">
                        <h1 class="font-headline-sm text-headline-sm leading-tight truncate max-w-[200px]">${account.other_party_name}</h1>
                        <span class="font-label-bold text-label-bold text-on-surface-variant uppercase">${account.role}</span>
                    </div>
                </div>
            </header>

            <!-- SIDEBAR DESKTOP -->
            <aside class="desktop-only flex-col h-full border-r border-surface-variant bg-surface-container-low fixed left-0 top-0 w-[260px] z-50">
                <div class="p-stack-lg flex items-center gap-stack-md cursor-pointer" id="deskHomeBtn">
                    <div class="w-10 h-10 bg-primary flex items-center justify-center rounded">
                        <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">arrow_back</span>
                    </div>
                    <div>
                        <h1 class="font-display-md text-display-md font-bold text-primary">SunarKhata</h1>
                        <p class="font-label-bold text-label-bold uppercase opacity-60">Back to Dashboard</p>
                    </div>
                </div>
                <div class="p-stack-md border-t border-surface-variant flex items-center gap-3 bg-surface-container-lowest mt-auto">
                    <div class="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center">
                        <span class="material-symbols-outlined">person</span>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="font-title-lg text-body-sm leading-none truncate">${user.businessName}</p>
                        <p class="font-label-bold text-[11px] uppercase opacity-60 mt-1">Admin</p>
                    </div>
                </div>
            </aside>

            <!-- MAIN CONTENT -->
            <main class="flex-1 lg:ml-[260px] min-h-[calc(100dvh-3.5rem)] lg:min-h-screen flex flex-col w-full relative">
                
                <!-- Account Header DESKTOP -->
                <section class="desktop-only px-container-padding-desktop py-stack-lg bg-surface-container-lowest border-b border-surface-variant items-center justify-between w-full">
                    <div class="flex items-center gap-stack-md">
                        <div class="w-12 h-12 bg-surface-container-high rounded flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary text-[28px]">person</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-stack-sm">
                                <h2 class="font-display-md text-display-md">${account.other_party_name}</h2>
                                <span class="bg-secondary-container text-on-secondary-container text-label-bold px-2 py-0.5 rounded-sm uppercase">${account.role}</span>
                                <span class="bg-surface-container-high text-on-surface-variant text-label-bold px-2 py-0.5 rounded-sm uppercase">Individual</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SEGMENTED SWITCH MOBILE -->
                <div class="mobile-only px-4 py-3 bg-surface border-b border-surface-variant sticky top-14 z-40 w-full">
                    <div class="relative flex p-1 bg-surface-container-high rounded-lg overflow-hidden w-full">
                        <div class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface rounded-md shadow-sm transition-transform duration-300" style="left: 4px; transform: translateX(${activeTab === 0 ? '0' : '100%'})"></div>
                        <button id="tabMetalBtn" class="relative z-10 flex-1 py-2 h-[44px] flex items-center justify-center text-center font-label-bold text-label-bold transition-colors ${activeTab === 0 ? 'text-primary' : 'text-on-surface-variant'}">METAL</button>
                        <button id="tabRupeeBtn" class="relative z-10 flex-1 py-2 h-[44px] flex items-center justify-center text-center font-label-bold text-label-bold transition-colors ${activeTab === 1 ? 'text-primary' : 'text-on-surface-variant'}">RUPEE</button>
                    </div>
                </div>

                <!-- LEDGER SPLIT/TABS -->
                <div class="flex flex-1 overflow-hidden flex-col lg:flex-row w-full">
                    
                    <!-- METAL SECTION -->
                    <section class="flex-1 lg:border-r border-surface-variant overflow-y-auto hide-scrollbar bg-surface-bright lg:p-stack-lg ${activeTab === 0 ? 'block' : 'hidden lg:block'}">
                        <header class="p-4 lg:p-0 mb-0 lg:mb-stack-lg">
                            <div class="bg-white border border-surface-variant rounded lg:rounded-none lg:border-0 lg:border-b stitch-accent p-stack-lg mb-stack-md">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <p class="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-tighter">Metal Balance</p>
                                        <p class="font-body-md text-on-secondary-container">Fine Gold (99.9)</p>
                                    </div>
                                    <span class="${metalColor} text-[10px] lg:text-label-bold px-2 py-1 rounded-sm uppercase font-bold">${metalPosUpper}</span>
                                </div>
                                <p class="font-display-lg text-[28px] lg:text-display-lg leading-none font-bold text-primary">${fmtG(metalBal)} <span class="text-body-lg font-normal opacity-50">g</span></p>
                            </div>
                            <div class="grid grid-cols-2 gap-2 lg:gap-stack-sm mb-stack-md">
                                <button class="act-btn bg-primary text-white font-label-bold py-3 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-1 lg:gap-2 text-[11px] lg:text-[12px] uppercase tracking-tight" data-type="metal_increase">
                                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">add</span> Increase
                                </button>
                                <button class="act-btn border border-primary text-primary font-label-bold py-3 rounded hover:bg-surface-container-low transition-all flex items-center justify-center gap-1 lg:gap-2 text-[11px] lg:text-[12px] uppercase tracking-tight" data-type="metal_decrease">
                                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">remove</span> Decrease
                                </button>
                            </div>
                            <div class="grid grid-cols-2 gap-2 lg:gap-stack-sm">
                                <button class="act-btn bg-surface-container-high text-on-surface font-label-bold py-2 rounded-sm hover:bg-surface-dim transition-colors text-[10px] lg:text-[11px] uppercase tracking-wider" data-type="convert_metal_to_rupee">
                                    Convert to Rupee
                                </button>
                                <button class="act-btn bg-secondary-container text-on-secondary-container font-label-bold py-2 rounded-sm hover:opacity-90 transition-opacity text-[10px] lg:text-[11px] uppercase tracking-wider" data-type="metal_increase">
                                    Book Rate
                                </button>
                            </div>
                        </header>
                        <div class="space-y-stack-sm p-4 lg:p-0">
                            <h3 class="font-label-bold text-label-bold text-on-surface-variant uppercase mb-4 border-b border-surface-variant pb-2">Metal Transactions</h3>
                            <div class="divide-y divide-surface-variant rounded-lg border border-surface-variant overflow-hidden lg:border-0 lg:rounded-none">
                                ${getTransactionHTML(txns, 'metal')}
                            </div>
                        </div>
                    </section>

                    <!-- RUPEE SECTION -->
                    <section class="flex-1 overflow-y-auto hide-scrollbar bg-surface-container-low lg:p-stack-lg ${activeTab === 1 ? 'block' : 'hidden lg:block'}">
                        <header class="p-4 lg:p-0 mb-0 lg:mb-stack-lg">
                            <div class="bg-white border border-surface-variant rounded lg:rounded-none lg:border-0 lg:border-b stitch-accent p-stack-lg mb-stack-md">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <p class="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-tighter">Rupee Balance</p>
                                        <p class="font-body-md text-on-secondary-container">Cash Ledger</p>
                                    </div>
                                    <span class="${rupeeColor} text-[10px] lg:text-label-bold px-2 py-1 rounded-sm uppercase font-bold">${rupeePosUpper}</span>
                                </div>
                                <div class="w-full overflow-hidden">
                                    <p class="font-display-lg text-[28px] lg:text-display-lg leading-tight truncate text-primary font-bold">₹${fmtR(rupeeBal)}</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 lg:gap-stack-sm mb-stack-md">
                                <button class="act-btn bg-primary text-white font-label-bold py-3 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-1 lg:gap-2 text-[11px] lg:text-[12px] uppercase tracking-tight" data-type="rupee_increase">
                                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">add</span> Increase
                                </button>
                                <button class="act-btn border border-primary text-primary font-label-bold py-3 rounded hover:bg-surface-container-low transition-all flex items-center justify-center gap-1 lg:gap-2 text-[11px] lg:text-[12px] uppercase tracking-tight" data-type="rupee_decrease">
                                    <span class="material-symbols-outlined text-[18px] lg:text-[20px]">remove</span> Decrease
                                </button>
                            </div>
                            <button class="act-btn w-full bg-on-tertiary-fixed text-white font-label-bold py-2 rounded-sm hover:opacity-90 transition-opacity text-[10px] lg:text-[11px] uppercase tracking-wider" data-type="convert_rupee_to_metal">
                                Convert to Metal
                            </button>
                        </header>
                        <div class="space-y-stack-sm p-4 lg:p-0">
                            <h3 class="font-label-bold text-label-bold text-on-surface-variant uppercase mb-4 border-b border-surface-variant pb-2">Rupee Transactions</h3>
                            <div class="divide-y divide-surface-variant rounded-lg border border-surface-variant overflow-hidden lg:border-0 lg:rounded-none">
                                ${getTransactionHTML(txns, 'rupee')}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
        `;
        attachListeners();
    }

    function attachListeners() {
        document.getElementById('mobBackBtn')?.addEventListener('click', () => { window.location.hash = '#/dashboard'; });
        document.getElementById('deskHomeBtn')?.addEventListener('click', () => { window.location.hash = '#/dashboard'; });

        document.getElementById('tabMetalBtn')?.addEventListener('click', () => { activeTab = 0; render(); });
        document.getElementById('tabRupeeBtn')?.addEventListener('click', () => { activeTab = 1; render(); });

        document.querySelectorAll('.act-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                window.location.hash = `#/transaction/individual/${accountId}?type=${type}`;
            });
        });

        document.querySelectorAll('.txn-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const txnId = e.currentTarget.dataset.id;
                const txns = account.transactions || [];
                const txn = txns.find(t => t.id === txnId);
                if (!txn) return;
                
                // Allow cancellation if it's the latest non-cancelled transaction and within 1 hour
                renderCancellationSheet(document.body, txn, () => {
                    // on confirm cancel
                    cancelTransaction(user.id, accountId, txn.id);
                    refresh();
                });
            });
        });
    }

    render();
}

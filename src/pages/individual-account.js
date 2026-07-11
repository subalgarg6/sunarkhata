import { getCurrentUser } from '../services/auth.service.js';
import { getAccount, cancelTransaction, getTransactions } from '../services/individual.service.js';
import { formatIndianNumber } from '../utils/formatters.js';
import { getPositionLabel, getActionLabels, formatRole, getPositionTextColor } from '../utils/position-engine.js';
import { isCustomerMetalPayable } from '../utils/business-rules.js';
import { TRANSACTION_LABELS } from '../utils/constants.js';
import { renderTransaction } from './transaction.js';

export function renderIndividualAccount(container, accountId) {
    const user = getCurrentUser();
    if (!user) { window.location.hash = '#/auth'; return; }

    let account = getAccount(accountId);
    if (!account) { window.location.hash = '#/dashboard'; return; }

    let activeTab = 0; // 0 = METAL, 1 = RUPEE

    function refresh() {
        account = getAccount(accountId);
        if (!account) { window.location.hash = '#/dashboard'; return; }
        render();
    }

    function fmtG(g) { return parseFloat(g || 0).toFixed(3); }
    function fmtR(r) { return formatIndianNumber(Math.round(r || 0)); }

    function getTxnLabel(txn) {
        const key = `${txn.section}_${txn.action}`;
        return TRANSACTION_LABELS[key] || txn.action || 'Transaction';
    }

    function isTransactionEligibleForDelete(txn) {
        if (txn.status === 'cancelled' || txn.status === 'edited') return false;
        const validTxns = (account.transactions || []).filter(t => t.status !== 'cancelled' && t.status !== 'edited');
        if (validTxns.length === 0 || validTxns[0].id !== txn.id) return false;
        const age = Date.now() - new Date(txn.created_at || txn.createdAt).getTime();
        return age <= 3600000;
    }

    function getTransactionHTML(section) {
        const allTxns = account.transactions || [];
        const filtered = allTxns.filter(t => t.section === section);

        if (filtered.length === 0) {
            return `
            <div class="p-8 text-center text-on-surface-variant font-body-sm">
                No ${section} transactions yet.
            </div>`;
        }

        return filtered.map(txn => {
            const dateObj = new Date(txn.created_at);
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            
            const isCancelled = txn.status === 'cancelled' || txn.status === 'edited';
            const title = getTxnLabel(txn);
            
            let valStr = '';
            let valColor = '';
            
            if (section === 'metal') {
                const amt = parseFloat(txn.amount) || 0;
                const isIncrease = txn.action === 'increase' || txn.action === 'rate_booking';
                valStr = `${isIncrease ? '+' : '-'}${fmtG(amt)} g`;
                valColor = isCancelled ? 'text-on-surface-variant line-through' : isIncrease ? 'text-success-emerald' : 'text-error-crimson';
            } else {
                const amt = parseFloat(txn.amount) || 0;
                const isIncrease = txn.action === 'increase';
                valStr = `${isIncrease ? '+' : '-'}₹${fmtR(amt)}`;
                valColor = isCancelled ? 'text-on-surface-variant line-through' : isIncrease ? 'text-success-emerald' : 'text-error-crimson';
            }

            const isEligible = isTransactionEligibleForDelete(txn);
            const deleteBtn = isEligible ? `<button type="button" class="delete-txn-btn ml-4 text-[11px] font-label-bold text-error-crimson border border-error-crimson/30 hover:bg-error-crimson hover:text-white px-2 py-1 rounded transition-colors" data-id="${txn.id}">DELETE</button>` : '';

            return `
            <div class="bg-white ledger-border p-3 lg:p-4 hover:bg-surface-container-low transition-colors group txn-row" data-id="${txn.id}">
                <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                        <p class="font-title-lg text-body-md ${isCancelled ? 'line-through text-on-surface-variant' : ''}">${title}</p>
                        <div class="flex items-center gap-2 mt-1 text-on-surface-variant font-body-sm opacity-70 text-xs">
                            <span class="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span>${dateStr}, ${timeStr}</span>
                            ${txn.mention ? `<span>· ${txn.mention}</span>` : ''}
                        </div>
                    </div>
                    <div class="text-right shrink-0 flex items-center gap-3">
                        <div>
                            <p class="font-data-mono text-body-lg ${valColor}">${valStr}</p>
                            ${isCancelled ? '<p class="text-[10px] text-error-crimson uppercase font-label-bold mt-1">' + (txn.status === 'edited' ? 'EDITED' : 'CANCELLED') + '</p>' : ''}
                        </div>
                        ${deleteBtn}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    function getRupeeTransactionHTML() {
        const allTxns = account.transactions || [];
        const filtered = allTxns.filter(t => t.section === 'rupee');

        if (filtered.length === 0) {
            return `
            <tr>
                <td colspan="3" class="px-6 py-8 text-center text-on-surface-variant font-body-sm">
                    No Rupee transactions yet.
                </td>
            </tr>`;
        }

        return filtered.map(txn => {
            const dateObj = new Date(txn.created_at);
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            
            const isCancelled = txn.status === 'cancelled' || txn.status === 'edited';
            const title = getTxnLabel(txn);
            
            const amt = parseFloat(txn.amount) || 0;
            const isIncrease = txn.action === 'increase';
            const valStr = `${isIncrease ? '+' : '-'} ₹ ${fmtR(amt)}`;
            const valColor = isCancelled ? 'text-on-surface-variant line-through' : isIncrease ? 'text-success-emerald' : 'text-error-crimson';

            let icon = 'payments';
            if (txn.action === 'increase') icon = 'account_balance_wallet';
            if (txn.action === 'decrease') icon = 'shopping_bag';
            if (txn.action === 'convert_rupee_to_metal') icon = 'sync_alt';

            const isEligible = isTransactionEligibleForDelete(txn);
            const deleteBtn = isEligible ? `<button type="button" class="delete-txn-btn ml-4 text-[11px] font-label-bold text-error-crimson border border-error-crimson/30 hover:bg-error-crimson hover:text-white px-2 py-1 rounded transition-colors" data-id="${txn.id}">DELETE</button>` : '';

            return `
            <tr class="hover:bg-surface-container-low transition-colors group txn-row" data-id="${txn.id}">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                            <span class="material-symbols-outlined text-[20px]">${icon}</span>
                        </div>
                        <div>
                            <div class="font-label-md text-[14px] text-primary ${isCancelled ? 'line-through text-on-surface-variant' : ''}">${title}</div>
                            <div class="text-[12px] text-on-surface-variant">${txn.mention || (isCancelled ? 'CANCELLED' : 'Manual Entry')}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-[13px] text-on-surface-variant font-data-mono">
                    ${dateStr} · ${timeStr}
                </td>
                <td class="px-6 py-4 text-right font-headline-md text-[15px] ${valColor}">
                    <div class="flex items-center justify-end gap-3">
                        <span>${valStr}</span>
                        ${deleteBtn}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    function render() {
        const metalBal = parseFloat(account.metal_balance) || 0;
        const rupeeBal = parseFloat(account.rupee_balance) || 0;
        const metalPos = account.metal_class || 'payable';
        const rupeePos = account.rupee_class || 'payable';
        
        const metalPosLabel = getPositionLabel(metalPos);
        const rupeePosLabel = getPositionLabel(rupeePos);
        const metalActions = getActionLabels(metalPos);
        const rupeeActions = getActionLabels(rupeePos);
        const roleDisplay = formatRole(account.role);

        const metalBadgeColor = metalPos === 'payable' ? 'bg-error-crimson/10 text-error-crimson' : 'bg-success-emerald/10 text-success-emerald';
        const rupeeBadgeColor = rupeePos === 'payable' ? 'bg-error-crimson/10 text-error-crimson' : 'bg-success-emerald/10 text-success-emerald';

        // Book Rate visibility
        const showBookRate = isCustomerMetalPayable(account.role, metalPos);

        const getRupeeScale = (valStr) => {
            const len = valStr.length;
            if (len < 10) return 'text-[48px]';
            if (len < 14) return 'text-4xl';
            if (len < 18) return 'text-3xl';
            return 'text-2xl';
        };

        const getMetalScale = (valStr) => {
            const len = valStr.length;
            if (len < 10) return '';
            if (len < 14) return 'text-3xl';
            if (len < 18) return 'text-2xl';
            return 'text-xl';
        };

        container.innerHTML = `
        <style>
            .ledger-border { border-bottom: 1px solid var(--surface-variant); }
            .stitch-accent { border-left: 2px solid var(--gold-metallic); }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        </style>
        <div class="ind-page">
            
            <!-- Account Header -->
            <header class="ind-header">
                <div class="ind-header-info">
                    <div class="ind-header-name">${account.other_party_name}</div>
                    <div class="ind-header-role">${roleDisplay} · Individual</div>
                </div>
            </header>

            <!-- METAL / RUPEE SWITCHER -->
            <div class="ind-tab-bar">
                <div class="ind-tab-bar-inner">
                    <button id="tabMetalBtn" class="ind-tab ${activeTab === 0 ? 'active' : ''}">METAL</button>
                    <button id="tabRupeeBtn" class="ind-tab ${activeTab === 1 ? 'active' : ''}">RUPEE</button>
                </div>
            </div>

            <!-- LEDGER SECTIONS -->
            <div class="ind-ledger">
                
                <!-- METAL SECTION -->
                <section class="ind-section ind-section-metal ${activeTab === 0 ? '' : 'hidden'}">
                    <!-- Balance Card -->
                    <div class="ind-balance-card stitch-accent">
                        <div class="flex items-center justify-between mb-2">
                            <div>
                                <div class="ind-balance-label" style="margin-bottom:2px;">Metal Balance</div>
                                <div style="font-size:12px; color:var(--text-muted);">Fine Gold (24K Pure)</div>
                            </div>
                            <span class="ind-class-badge ${metalPos === 'payable' ? 'ind-class-payable' : 'ind-class-receivable'}">${metalPosLabel}</span>
                        </div>
                        <div class="ind-balance-value flex items-baseline gap-1.5 min-w-0 overflow-x-auto pb-1 scrollbar-hide max-w-full whitespace-nowrap">
                            <span class="${getMetalScale(fmtG(metalBal))}">${fmtG(metalBal)}</span>
                            <span style="font-size:16px; opacity:0.5;">g</span>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <button class="act-btn h-12 bg-primary text-white rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all" data-type="${metalActions.action1Op}" data-ledger="metal">
                            <span class="material-symbols-outlined text-[18px]">add_circle</span>
                            ${metalActions.action1Label}
                        </button>
                        <button class="act-btn h-12 bg-surface-container-low border border-surface-variant text-primary rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:bg-surface-container transition-all active:scale-[0.98]" data-type="${metalActions.action2Op}" data-ledger="metal">
                            <span class="material-symbols-outlined text-[18px]">remove_circle</span>
                            ${metalActions.action2Label}
                        </button>
                        <button class="act-btn ${showBookRate ? 'col-span-1' : 'col-span-2'} h-12 bg-surface-container-low border border-gold-metallic rounded-[8px] font-label-md font-semibold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] text-primary" data-type="convert_metal_to_rupee" data-ledger="metal">
                            <span class="text-gold-metallic text-[16px] leading-none">⇄</span>
                            METAL → RUPEE
                        </button>
                        ${showBookRate ? `
                        <button class="act-btn col-span-1 h-12 bg-gold-metallic text-white border border-gold-metallic rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98]" data-type="rate_booking" data-ledger="metal">
                            <span class="material-symbols-outlined text-[18px]">trending_up</span>
                            BOOK RATE
                        </button>` : ``}
                    </div>

                    <!-- Transaction History -->
                    <div class="ind-txn-section">
                        <h3 class="ind-txn-header">Metal Transactions</h3>
                        <div class="ind-txn-list">
                            ${getTransactionHTML('metal')}
                        </div>
                    </div>
                </section>

                <!-- RUPEE SECTION -->
                <section class="ind-section ${activeTab === 1 ? '' : 'hidden'}">
                    <div class="w-full max-w-5xl mx-auto">
                        <!-- Rupee Balance Card -->
                        <div class="ind-balance-card">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-gold-metallic text-[18px]">payments</span>
                                    <span class="font-label-md text-[12px] tracking-widest text-on-surface-variant uppercase">RUPEE BALANCE</span>
                                </div>
                                <div class="flex items-center gap-2 px-4 py-1 ${rupeePos === 'payable' ? 'bg-error-container text-error-crimson' : 'bg-success-emerald/10 text-success-emerald'} rounded-full font-label-md text-[12px]">
                                    <span class="material-symbols-outlined text-[14px]">${rupeePos === 'payable' ? 'expand_more' : 'expand_less'}</span>
                                    ${rupeePosLabel}
                                </div>
                            </div>
                            <div class="font-display-lg font-bold tracking-tighter text-primary flex items-baseline justify-center gap-1.5 min-w-0 overflow-x-auto pb-1 scrollbar-hide max-w-full whitespace-nowrap w-full" style="margin-bottom:4px;">
                                <span class="text-gold-metallic">₹</span>
                                <span class="${getRupeeScale(fmtR(rupeeBal))}">${fmtR(rupeeBal)}</span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="grid grid-cols-2 gap-3 mb-4">
                            <button class="act-btn h-12 bg-primary text-white rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all" data-type="${rupeeActions.action1Op}" data-ledger="rupee">
                                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                                ${rupeeActions.action1Label}
                            </button>
                            <button class="act-btn h-12 bg-surface-container-low border border-surface-variant text-primary rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:bg-surface-container transition-all active:scale-[0.98]" data-type="${rupeeActions.action2Op}" data-ledger="rupee">
                                <span class="material-symbols-outlined text-[18px]">remove_circle</span>
                                ${rupeeActions.action2Label}
                            </button>
                            <button class="act-btn col-span-2 h-12 bg-surface-container-low border border-gold-metallic rounded-[8px] font-label-md font-semibold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] text-primary" data-type="convert_rupee_to_metal" data-ledger="rupee">
                                <span class="text-gold-metallic text-[16px] leading-none">⇄</span>
                                RUPEE → METAL
                            </button>
                        </div>

                        <!-- Transaction History -->
                        <section>
                            <h3 class="font-headline-md text-[14px] font-bold text-primary uppercase tracking-wide mb-3">RUPEE TRANSACTIONS</h3>
                            <div class="bg-white rounded-[12px] border border-surface-variant overflow-hidden">
                                <table class="w-full text-left border-collapse">
                                    <thead class="bg-surface-bright">
                                        <tr class="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider">
                                            <th class="px-5 py-3 font-semibold">Transaction Details</th>
                                            <th class="px-5 py-3 font-semibold">Date &amp; Time</th>
                                            <th class="px-5 py-3 font-semibold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-surface-container-highest">
                                        ${getRupeeTransactionHTML()}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
            
            <!-- TRANSACTION OVERLAY HOST -->
            <div id="transaction-overlay-host"></div>
        </div>
        `;
        attachListeners();
    }

    function attachListeners() {
        document.getElementById('tabMetalBtn')?.addEventListener('click', () => { activeTab = 0; render(); });
        document.getElementById('tabRupeeBtn')?.addEventListener('click', () => { activeTab = 1; render(); });

        document.querySelectorAll('.act-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                const ledgerType = e.currentTarget.dataset.ledger || (activeTab === 0 ? 'metal' : 'rupee');
                const host = document.getElementById('transaction-overlay-host');
                
                renderTransaction(host, {
                    contextType: 'individual',
                    accountId: accountId,
                    actionType: type,
                    ledgerType: ledgerType,
                    onSuccess: () => {
                        refresh();
                        host.innerHTML = '';
                    },
                    onClose: () => {
                        host.innerHTML = '';
                    }
                });
            });
        });

        document.querySelectorAll('.txn-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const txnId = e.currentTarget.dataset.id;
                const txn = (account.transactions || []).find(t => t.id === txnId);
                if (!txn || txn.status === 'cancelled' || txn.status === 'edited') return;

                // Check if most recent non-cancelled and within 1 hour
                const validTxns = (account.transactions || []).filter(t => t.status !== 'cancelled' && t.status !== 'edited');
                if (validTxns.length === 0 || validTxns[0].id !== txnId) return;

                const age = Date.now() - new Date(txn.created_at).getTime();
                if (age > 3600000) return;

                if (confirm('Cancel this transaction? This will reverse its effect on the balance.')) {
                    const result = cancelTransaction(accountId, txnId);
                    if (result.error) {
                        alert(result.error);
                    } else {
                        refresh();
                    }
                }
            });
        });
    }

    render();
}


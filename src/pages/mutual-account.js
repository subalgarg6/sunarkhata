import { getCurrentUser } from '../services/auth.service.js';
import {
  getMutualAccount, getUserPerspective, refreshInviteCode, getCodeTimeRemaining,
  approveTransaction, rejectTransaction, deleteMutualAccount,
  approveCancelTransaction, rejectCancelTransaction,
  requestCancelTransaction, checkExpiredTransactions
} from '../services/mutual.service.js';
import { formatIndianNumber } from '../utils/formatters.js';
import { getPositionLabel, getMutualActionLabels, formatRole } from '../utils/position-engine.js';
import { isCustomerMetalPayable } from '../utils/business-rules.js';
import { TRANSACTION_LABELS } from '../utils/constants.js';
import { renderTransaction } from './transaction.js';

export function renderMutualAccount(container, accountId) {
    const user = getCurrentUser();
    if (!user) { window.location.hash = '#/auth'; return; }

    // Check for expired transactions on load
    checkExpiredTransactions(accountId);

    let rawAccount = getMutualAccount(accountId);
    if (!rawAccount) { window.location.hash = '#/dashboard'; return; }

    let timerInterval = null;
    let pollInterval = null;
    let storageHandler = null;

    // ── Cleanup helper: clears all intervals and event listeners ──
    function cleanup() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        if (storageHandler) { window.removeEventListener('storage', storageHandler); storageHandler = null; }
    }

    // ── Check if account became active (called by timer, poll, and storage event) ──
    function checkIfActivated() {
        const fresh = getMutualAccount(accountId);
        if (!fresh) return false;
        if (fresh.status === 'connected') {
            rawAccount = fresh;
            cleanup();
            renderActiveLedger();
            return true;
        }
        return false;
    }

    // ── STATUS-FIRST RESOLUTION ──
    // If the account is already connected, skip the waiting screen entirely
    if (rawAccount.status === 'connected') {
        renderActiveLedger();
        return;
    }

    // STATE 1: WAITING FOR PARTNER
    if (rawAccount.status === 'waiting') {
        function renderWaitingScreen() {
            const code = rawAccount.invite_code || '';
            container.innerHTML = `
            <div class="bg-surface text-on-surface font-body-md min-h-full flex flex-col">
                <header class="flex items-center justify-between px-4 h-14 bg-surface border-b border-surface-variant">
                    <div class="font-headline-sm text-primary font-bold">Mutual Account Setup</div>
                    <div class="w-10"></div>
                </header>
                
                <main class="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-md mx-auto w-full relative">
                    <section class="space-y-8 w-full" id="state-waiting">
                        <div class="flex flex-col items-center text-center space-y-4">
                            <div class="w-24 h-24 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center relative z-10 border border-secondary/20">
                                <span class="material-symbols-outlined text-secondary text-[48px]">hourglass_empty</span>
                            </div>
                            <div class="space-y-1">
                                <h1 class="font-headline-sm text-primary">Waiting for Partner</h1>
                                <p class="text-on-surface-variant text-body-sm">Share this code with the partner to link ledgers.</p>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl p-8 border border-surface-variant shadow-sm flex flex-col items-center space-y-6">
                            <div class="flex flex-col items-center space-y-2">
                                <span class="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">Invite Code</span>
                                <div class="text-[20px] font-bold tracking-[0.15em] font-data-mono text-primary select-all break-all text-center">${code}</div>
                            </div>
                            <button id="copyCodeBtn" class="w-full flex items-center justify-center gap-2 py-4 px-6 bg-surface-container-low text-primary rounded-lg font-bold text-[14px] hover:bg-surface-variant transition-colors border border-surface-variant">
                                <span class="material-symbols-outlined text-[18px]">content_copy</span>
                                Copy Code
                            </button>
                        </div>
                        
                        <div class="flex flex-col items-center space-y-3">
                            <div class="flex items-center gap-2 text-on-surface-variant">
                                <span class="material-symbols-outlined text-[20px]">schedule</span>
                                <span class="font-data-mono text-[14px]">Expires in <span class="font-bold text-primary" id="countdown">00:00</span></span>
                            </div>
                            <div class="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                                <div class="h-full bg-secondary w-full rounded-full transition-all" id="progress-bar"></div>
                            </div>
                        </div>
                        
                        <button id="delBtn" class="w-full mt-4 flex items-center justify-center py-3 text-error-crimson font-bold text-[14px] hover:bg-error-container/20 rounded-lg transition-colors">
                            Cancel & Delete Setup
                        </button>
                    </section>
                    
                    <section class="space-y-8 hidden w-full" id="state-expired">
                        <div class="flex flex-col items-center text-center space-y-4">
                            <div class="w-24 h-24 rounded-full bg-error-container flex items-center justify-center">
                                <span class="material-symbols-outlined text-error-crimson text-[48px]">timer_off</span>
                            </div>
                            <div class="space-y-1">
                                <h1 class="font-headline-sm text-primary">Invite Expired</h1>
                                <p class="text-on-surface-variant text-body-sm">The security window for this invite code has closed.</p>
                            </div>
                        </div>
                        <button id="refreshCodeBtn" class="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary text-white rounded-lg font-bold text-[14px] shadow-sm">
                            <span class="material-symbols-outlined">refresh</span>
                            Generate New Code
                        </button>
                        <button id="delBtnExp" class="w-full flex items-center justify-center py-4 text-error-crimson font-bold text-[14px]">
                            Delete Setup
                        </button>
                    </section>
                </main>
            </div>
            `;

            document.getElementById('copyCodeBtn')?.addEventListener('click', (e) => {
                navigator.clipboard.writeText(code);
                const btn = e.currentTarget;
                const orig = btn.innerHTML;
                btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> Copied!';
                btn.classList.add('bg-success-emerald/10', 'text-success-emerald');
                setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('bg-success-emerald/10', 'text-success-emerald'); }, 2000);
            });

            const delHandler = () => {
                if(confirm('Delete this pending mutual account?')) {
                    cleanup();
                    deleteMutualAccount(accountId);
                    window.location.hash = '#/dashboard';
                }
            };
            document.getElementById('delBtn')?.addEventListener('click', delHandler);
            document.getElementById('delBtnExp')?.addEventListener('click', delHandler);

            // ── Generate New Code with activation guard ──
            document.getElementById('refreshCodeBtn')?.addEventListener('click', () => {
                // CRITICAL: Check if account became active before generating new code
                if (checkIfActivated()) return;

                rawAccount = refreshInviteCode(accountId);
                if (rawAccount && rawAccount.status === 'connected') {
                    // Account was activated while we were on expired screen
                    cleanup();
                    renderActiveLedger();
                    return;
                }
                renderWaitingScreen();
            });

            startTimer();
        }

        function startTimer() {
            const TOTAL_SECONDS = 300;
            if (timerInterval) clearInterval(timerInterval);
            
            timerInterval = setInterval(() => {
                // ── TIMER RACE CONDITION FIX ──
                // Before showing expired UI, check if account was activated
                const ms = getCodeTimeRemaining(accountId);
                if (ms <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;

                    // CRITICAL: Check account status FIRST before showing expired UI
                    if (checkIfActivated()) return;

                    // Account is still waiting — show expired UI
                    document.getElementById('state-waiting')?.classList.add('hidden');
                    document.getElementById('state-expired')?.classList.remove('hidden');
                    return;
                }
                const sec = Math.floor(ms / 1000);
                const m = Math.floor(sec / 60);
                const s = sec % 60;
                const countdownEl = document.getElementById('countdown');
                const progressBar = document.getElementById('progress-bar');
                if(countdownEl) countdownEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                if(progressBar) progressBar.style.width = `${(sec / TOTAL_SECONDS) * 100}%`;
            }, 1000);
        }

        // ── CROSS-TAB SYNC: Listen for localStorage changes from other tabs ──
        storageHandler = (e) => {
            if (e.key === 'sk_mutual_accounts') {
                checkIfActivated();
            }
        };
        window.addEventListener('storage', storageHandler);

        // ── POLLING FALLBACK: Re-check every 3 seconds while on waiting screen ──
        // (storage events don't fire for same-tab changes)
        pollInterval = setInterval(() => {
            checkIfActivated();
        }, 3000);

        renderWaitingScreen();
        return;
    }

    // STATE 2: ACTIVE MUTUAL LEDGER
    function renderActiveLedger() {
        cleanup(); // Ensure all waiting-state timers are cleared

        checkExpiredTransactions(accountId);
        let account = getUserPerspective(accountId, user.id);
        if (!account) { window.location.hash = '#/dashboard'; return; }

        let activeTab = 0;

        function refresh() {
            checkExpiredTransactions(accountId);
            account = getUserPerspective(accountId, user.id);
            if (!account) { window.location.hash = '#/dashboard'; return; }
            render();
        }

        function fmtG(g) { return parseFloat(g || 0).toFixed(3); }
        function fmtR(r) { return formatIndianNumber(Math.round(r || 0)); }

        function getTxnLabel(txn) {
            const key = `${txn.section}_${txn.action}`;
            return TRANSACTION_LABELS[key] || txn.action || 'Transaction';
        }

        function isTransactionEligibleForCancelRequest(txn) {
            if (txn.status !== 'approved' && txn.status !== 'pending') return false;
            const validTxns = (account.transactions || []).filter(t => t.status === 'approved' || t.status === 'pending');
            if (validTxns.length === 0 || validTxns[0].id !== txn.id) return false;
            const age = Date.now() - new Date(txn.approved_at || txn.created_at || txn.createdAt).getTime();
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
                
                const isPending = txn.status === 'pending';
                const isPendingCancel = txn.status === 'pending_cancellation';
                const isExpired = txn.status === 'expired';
                const isCancelled = txn.status === 'cancelled' || txn.status === 'rejected' || txn.status === 'edited';
                const iCreated = txn.created_by === user.id;

                const title = getTxnLabel(txn);
                const amt = parseFloat(txn.amount) || 0;
                const isIncrease = txn.action === 'increase' || txn.action === 'rate_booking';

                let valStr = '';
                let valColor = '';
                if (section === 'metal') {
                    valStr = `${isIncrease ? '+' : '-'}${fmtG(amt)} g`;
                    valColor = (isCancelled || isExpired) ? 'text-on-surface-variant line-through' : isIncrease ? 'text-success-emerald' : 'text-error-crimson';
                } else {
                    valStr = `${isIncrease ? '+' : '-'}₹${fmtR(amt)}`;
                    valColor = (isCancelled || isExpired) ? 'text-on-surface-variant line-through' : isIncrease ? 'text-success-emerald' : 'text-error-crimson';
                }

                let statusHtml = '';
                if (isPending) statusHtml = '<span class="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-bold uppercase">Pending Approval</span>';
                else if (isPendingCancel) statusHtml = '<span class="text-[10px] bg-error-container text-error-crimson px-2 py-0.5 rounded font-bold uppercase">Pending Cancel</span>';
                else if (isExpired) statusHtml = '<span class="text-[10px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded font-bold uppercase">Expired</span>';
                else if (isCancelled) statusHtml = '<span class="text-[10px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded font-bold uppercase">' + (txn.status === 'rejected' ? 'Rejected' : txn.status === 'edited' ? 'Edited' : 'Cancelled') + '</span>';

                const actionRequiredByMe = (isPending || isPendingCancel) && !iCreated;
                let rowClass = "bg-white ledger-border p-3 lg:p-4 hover:bg-surface-container-low transition-colors group txn-row";
                if (actionRequiredByMe) rowClass += " border-l-4 border-l-secondary bg-secondary-container/5 cursor-pointer";

                const isEligible = isTransactionEligibleForCancelRequest(txn);
                const reqCancelBtn = isEligible ? `<button type="button" class="request-cancel-btn ml-4 text-[11px] font-label-bold text-error-crimson border border-error-crimson/30 hover:bg-error-crimson hover:text-white px-2 py-1 rounded transition-colors" data-id="${txn.id}">REQUEST CANCEL</button>` : '';

                return `
                <div class="${rowClass}" data-id="${txn.id}" data-action="${actionRequiredByMe}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1 min-w-0">
                            <p class="font-title-lg text-body-md ${(isCancelled || isExpired) ? 'line-through text-on-surface-variant' : ''}">${title}</p>
                            <div class="flex items-center gap-2 mt-1 text-on-surface-variant font-body-sm opacity-70 text-xs">
                                <span>${dateStr}</span>
                                ${txn.mention ? `<span>· ${txn.mention}</span>` : ''}
                            </div>
                            ${statusHtml ? `<div class="mt-2">${statusHtml}</div>` : ''}
                        </div>
                        <div class="text-right shrink-0 flex items-center gap-3">
                            <div>
                                <p class="font-data-mono text-body-lg ${valColor}">${valStr}</p>
                                ${actionRequiredByMe ? '<p class="text-[10px] text-secondary font-bold uppercase mt-1">Review</p>' : ''}
                            </div>
                            ${reqCancelBtn}
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
                    <td colspan="4" class="px-6 py-8 text-center text-on-surface-variant font-body-sm">
                        No Rupee transactions yet.
                    </td>
                </tr>`;
            }

            return filtered.map(txn => {
                const dateObj = new Date(txn.created_at);
                const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                
                const isPending = txn.status === 'pending';
                const isPendingCancel = txn.status === 'pending_cancellation';
                const isExpired = txn.status === 'expired';
                const isCancelled = txn.status === 'cancelled' || txn.status === 'rejected' || txn.status === 'edited';
                const iCreated = txn.created_by === user.id;

                const title = getTxnLabel(txn);
                const amt = parseFloat(txn.amount) || 0;
                const isIncrease = txn.action === 'increase';

                const valStr = `${isIncrease ? '+' : '-'} ₹ ${fmtR(amt)}`;
                const valColor = (isCancelled || isExpired) ? 'text-on-surface-variant line-through' : isIncrease ? 'text-success-emerald' : 'text-error-crimson';

                let statusBadge = '';
                if (isPending) statusBadge = '<span class="px-2 py-1 bg-secondary-container/20 text-on-secondary-container text-[10px] font-bold rounded uppercase tracking-wider border border-secondary-container/30">PENDING APPROVAL</span>';
                else if (isPendingCancel) statusBadge = '<span class="px-2 py-1 bg-outline-variant/20 text-outline text-[10px] font-bold rounded uppercase tracking-wider border border-outline-variant/30">PENDING CANCEL</span>';
                else if (isExpired) statusBadge = '<span class="px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold rounded uppercase tracking-wider">EXPIRED</span>';
                else if (isCancelled) statusBadge = `<span class="px-2 py-1 bg-error-container/40 text-on-error-container text-[10px] font-bold rounded uppercase tracking-wider border border-error-container">${txn.status.toUpperCase()}</span>`;
                else statusBadge = '<span class="px-2 py-1 bg-success-emerald/10 text-success-emerald text-[10px] font-bold rounded uppercase tracking-wider border border-success-emerald/20">APPROVED</span>';

                const actionRequiredByMe = (isPending || isPendingCancel) && !iCreated;
                const isEligible = isTransactionEligibleForCancelRequest(txn);
                const reqCancelBtn = isEligible ? `<button type="button" class="request-cancel-btn ml-2 text-[10px] font-label-bold text-error-crimson border border-error-crimson/30 hover:bg-error-crimson hover:text-white px-2 py-1 rounded transition-colors" data-id="${txn.id}">REQUEST CANCEL</button>` : '';

                let actionCell = '';
                if (actionRequiredByMe) {
                    actionCell = '<button class="text-gold-metallic font-label-md text-xs hover:underline underline-offset-4 cursor-pointer">REVIEW</button>';
                } else if (isPending || isPendingCancel) {
                    actionCell = '<span class="text-[10px] text-on-surface-variant uppercase tracking-wider">WAITING</span>';
                } else if (isCancelled) {
                    actionCell = '<button class="text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-[18px]">info</span></button>';
                } else {
                    actionCell = `<div class="flex items-center justify-end gap-2"><span class="text-success-emerald material-symbols-outlined text-[18px]">check_circle</span>${reqCancelBtn}</div>`;
                }

                let rowClass = "hover:bg-surface-container-low transition-colors group txn-row";
                if (actionRequiredByMe) rowClass += " cursor-pointer";

                return `
                <tr class="${rowClass}" data-id="${txn.id}" data-action="${actionRequiredByMe}">
                    <td class="px-6 py-5">
                        <div class="flex flex-col">
                            <span class="font-body-md text-primary font-medium ${isCancelled || isExpired ? 'line-through text-on-surface-variant' : ''}">${title}</span>
                            <span class="text-[10px] text-on-surface-variant font-medium">${dateStr}, ${timeStr} ${txn.mention ? `· ${txn.mention}` : ''}</span>
                        </div>
                    </td>
                    <td class="px-6 py-5 text-right font-data-mono text-data-mono ${valColor} font-bold">${valStr}</td>
                    <td class="px-6 py-5 text-center">${statusBadge}</td>
                    <td class="px-6 py-5 text-right">${actionCell}</td>
                </tr>
                `;
            }).join('');
        }

        function render() {
            const pendingTxns = (account.transactions || []).filter(t => t.status === 'pending' || t.status === 'pending_cancellation');
            const hasPendingForMe = pendingTxns.some(t => t.created_by !== user.id);

            const metalBal = parseFloat(account.my_metal_balance || account.metal_balance) || 0;
            const rupeeBal = parseFloat(account.my_rupee_balance || account.rupee_balance) || 0;
            const metalPos = account.my_metal_class || account.metal_class || 'payable';
            const rupeePos = account.my_rupee_class || account.rupee_class || 'payable';
            
            const metalPosLabel = getPositionLabel(metalPos);
            const rupeePosLabel = getPositionLabel(rupeePos);
            const metalActions = getMutualActionLabels(metalPos);
            const rupeeActions = getMutualActionLabels(rupeePos);
            const roleDisplay = formatRole(account.myRole || account.creator_role);

            const metalBadgeColor = metalPos === 'payable' ? 'bg-error-crimson/10 text-error-crimson' : 'bg-success-emerald/10 text-success-emerald';
            const rupeeBadgeColor = rupeePos === 'payable' ? 'bg-error-crimson/10 text-error-crimson' : 'bg-success-emerald/10 text-success-emerald';

            const showBookRate = isCustomerMetalPayable(account.myRole || account.creator_role, metalPos);

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
                        <div class="ind-header-role">${roleDisplay} · Mutual</div>
                    </div>
                </header>

                ${hasPendingForMe ? `
                <div style="background:rgba(212,168,83,0.08); border-bottom:1px solid rgba(212,168,83,0.3); padding:12px 24px; display:flex; align-items:center; gap:8px;">
                    <span class="material-symbols-outlined" style="color:var(--gold-primary); font-size:20px;">notification_important</span>
                    <span style="font-weight:600; font-size:13px; color:var(--text-secondary);">Pending Approvals Required</span>
                </div>
                ` : ''}

                <!-- METAL / RUPEE SWITCHER (always visible) -->
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
                        <div class="ind-balance-card stitch-accent">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                                <div>
                                    <div class="ind-balance-label">Metal Balance</div>
                                    <div style="font-size:12px; color:var(--text-muted);">Fine Gold (24K Pure)</div>
                                </div>
                                <span class="ind-position-badge ${metalPos === 'payable' ? 'ind-badge-payable' : 'ind-badge-receivable'}">${metalPosLabel}</span>
                            </div>
                            <div class="ind-balance-value flex items-baseline gap-1.5 min-w-0 overflow-x-auto pb-1 scrollbar-hide max-w-full whitespace-nowrap">
                                <span class="${getMetalScale(fmtG(metalBal))}">${fmtG(metalBal)}</span>
                                <span style="font-size:16px; opacity:0.5;">g</span>
                            </div>
                        </div>
                        <div class="ind-actions-grid">
                            <button class="act-btn ind-action-btn ind-action-primary" data-type="${metalActions.action1Op}" data-ledger="metal">
                                <span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">add</span>
                                ${metalActions.action1Label}
                            </button>
                            <button class="act-btn ind-action-btn" data-type="${metalActions.action2Op}" data-ledger="metal">
                                <span class="material-symbols-outlined" style="font-size:16px; margin-right:4px;">remove</span>
                                ${metalActions.action2Label}
                            </button>
                            <button class="act-btn ind-action-btn" data-type="convert_metal_to_rupee" data-ledger="metal">
                                Metal to Rupee
                            </button>
                            ${showBookRate ? `
                            <button class="act-btn ind-action-btn" data-type="rate_booking" data-ledger="metal">
                                Book Rate
                            </button>` : `<div></div>`}
                        </div>
                        <div class="ind-txn-section">
                            <h3 class="ind-txn-header">Metal Transactions</h3>
                            <div class="ind-txn-list">
                                ${getTransactionHTML('metal')}
                            </div>
                        </div>
                    </section>

                    <!-- RUPEE SECTION -->
                    <section class="ind-section ${activeTab === 1 ? '' : 'hidden'}">
                        <div class="flex flex-col gap-6 w-full max-w-5xl mx-auto">
                            <!-- Rupee Balance Card -->
                            <div class="bg-surface-container-low p-10 rounded-[16px] shadow-sm border border-surface-variant flex flex-col items-center text-center">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="material-symbols-outlined text-gold-metallic text-[20px]">payments</span>
                                    <span class="font-label-md text-[12px] tracking-widest text-on-surface-variant uppercase">RUPEE BALANCE</span>
                                </div>
                                <div class="font-display-lg font-bold mb-3 tracking-tighter text-primary flex items-baseline justify-center gap-1.5 min-w-0 overflow-x-auto pb-1 scrollbar-hide max-w-full whitespace-nowrap w-full">
                                    <span class="text-gold-metallic">₹</span>
                                    <span class="${getRupeeScale(fmtR(rupeeBal))}">${fmtR(rupeeBal)}</span>
                                </div>
                                <div class="flex items-center gap-2 px-5 py-1.5 ${rupeePos === 'payable' ? 'bg-error-container text-error-crimson' : 'bg-success-emerald/10 text-success-emerald'} rounded-full font-label-md text-[13px]">
                                    <span class="material-symbols-outlined text-[16px]">${rupeePos === 'payable' ? 'expand_more' : 'expand_less'}</span>
                                    ${rupeePosLabel}
                                </div>
                            </div>

                            <!-- Action Area -->
                            <div class="grid grid-cols-2 gap-4">
                                <button class="act-btn h-14 bg-primary text-white rounded-[8px] font-label-md text-[14px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all" data-type="${rupeeActions.action1Op}" data-ledger="rupee">
                                    <span class="material-symbols-outlined text-[20px]">add_circle</span>
                                    ${rupeeActions.action1Label}
                                </button>
                                <button class="act-btn h-14 bg-surface-container-low border border-surface-variant text-primary rounded-[8px] font-label-md text-[14px] flex items-center justify-center gap-2 hover:bg-surface-container transition-all active:scale-[0.98]" data-type="${rupeeActions.action2Op}" data-ledger="rupee">
                                    <span class="material-symbols-outlined text-[20px]">remove_circle</span>
                                    ${rupeeActions.action2Label}
                                </button>
                                <button class="act-btn col-span-2 h-14 bg-surface-container-low border border-gold-metallic rounded-[8px] font-label-md font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] text-primary" data-type="convert_rupee_to_metal" data-ledger="rupee">
                                    <span class="text-gold-metallic text-[18px] leading-none mb-[2px]">⇄</span>
                                    ADJUSTMENT IN METAL
                                </button>
                            </div>

                            <!-- Transaction List -->
                            <section class="mt-4">
                                <h3 class="font-headline-md text-[16px] font-bold text-charcoal-deep uppercase tracking-wide mb-4">RUPEE TRANSACTIONS</h3>
                                <div class="bg-white rounded-[16px] border border-surface-container-highest overflow-hidden">
                                    <table class="w-full text-left border-collapse">
                                        <thead class="bg-surface-bright">
                                            <tr class="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider">
                                                <th class="px-6 py-4 font-semibold">Description</th>
                                                <th class="px-6 py-4 font-semibold text-right">Amount</th>
                                                <th class="px-6 py-4 font-semibold text-center">Status</th>
                                                <th class="px-6 py-4 font-semibold text-right">Action</th>
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
                        contextType: 'mutual',
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
                    const requiresMyAction = e.currentTarget.dataset.action === 'true';
                    const txn = (account.transactions || []).find(t => t.id === txnId);
                    if (!txn) return;
                    
                    if (requiresMyAction) {
                        if (txn.status === 'pending_cancellation') {
                            if (confirm('Approve cancellation of this transaction?')) {
                                try { approveCancelTransaction(accountId, txnId); refresh(); }
                                catch(err) { alert(err.message); }
                            }
                        } else if (txn.status === 'pending') {
                            const action = confirm('Approve this transaction?\n\nOK = Approve\nCancel = Reject');
                            try {
                                if (action) { approveTransaction(accountId, txnId); }
                                else { rejectTransaction(accountId, txnId); }
                                refresh();
                            } catch(err) { alert(err.message); }
                        }
                    }
                });
            });

            document.querySelectorAll('.request-cancel-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const txnId = e.currentTarget.dataset.id;
                    if (confirm('Request cancellation of this transaction?')) {
                        const result = requestCancelTransaction(accountId, txnId, user.id);
                        if (result.error) { alert(result.error); }
                        else { refresh(); }
                    }
                });
            });
        }

        render();
    }
}

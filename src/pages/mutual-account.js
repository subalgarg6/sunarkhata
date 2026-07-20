import { getCurrentUser } from '../services/auth.service.js';
import {
  getMutualAccount, refreshInviteCode, getCodeTimeRemaining,
  approveTransaction, rejectTransaction, deleteMutualAccount,
  approveCancelTransaction, rejectCancelTransaction,
  requestCancelTransaction, checkExpiredTransactions,
  isAccountLocked, requestCloseMutualAccount, approveCloseMutualAccount,
  rejectCloseMutualAccount, withdrawCloseRequest, getClosureActivity
} from '../services/mutual.service.js';
import { 
  isCreator, getPerspectiveRole, getPerspectiveTitle, 
  getPerspectiveMetalClass, getPerspectiveRupeeClass, getPerspectiveActionLabel, flipAction 
} from '../utils/mutual-perspective.js';
import { formatIndianNumber, formatCurrency } from '../utils/formatters.js';
import { getPositionLabel, getMutualActionLabels, formatRole } from '../utils/position-engine.js';
import { isCustomerMetalPayable } from '../utils/business-rules.js';
import { TRANSACTION_LABELS } from '../utils/constants.js';
import { renderTransaction } from './transaction.js';

export async function renderMutualAccount(container, accountId) {
    const user = getCurrentUser();
    if (!user) { window.location.hash = '#/auth'; return; }

    container.innerHTML = '<div class="p-8 text-center text-on-surface-variant flex items-center justify-center h-full"><span class="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span> Loading account...</div>';

    // Check for expired transactions on load
    await checkExpiredTransactions(accountId);

    let rawAccount = await getMutualAccount(accountId);
    if (!rawAccount) { window.location.hash = '#/dashboard'; return; }

    let timerInterval = null;
    let pollInterval = null;
    let storageHandler = null;

    // ── Cleanup helper: clears all intervals and event listeners ──
    function cleanup() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        if (storageHandler) { window.removeEventListener('mutual-account-updated', storageHandler); storageHandler = null; }
    }

    // ── Check if account became active (called by timer, poll, and storage event) ──
    async function checkIfActivated() {
        const fresh = await getMutualAccount(accountId);
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
                        <div class="flex items-start gap-2 p-3 bg-surface-container-low border border-surface-variant rounded-sm italic text-left mt-4 mb-2">
                            <span class="material-symbols-outlined text-on-surface-variant text-[16px] shrink-0 mt-0.5">info</span>
                            <p class="text-[11px] text-on-surface-variant leading-relaxed">
                                Mutual Accounts improve transparency but do not replace contracts, invoices or business agreements. SunarKhata does not participate in the underlying transactions.
                            </p>
                        </div>
                        
                        <button id="delBtn" class="w-full mt-2 flex items-center justify-center py-3 text-error-crimson font-bold text-[14px] hover:bg-error-container/20 rounded-lg transition-colors">
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

            const delHandler = async () => {
                if(confirm('Delete this pending mutual account?')) {
                    cleanup();
                    await deleteMutualAccount(accountId);
                    window.location.hash = '#/dashboard';
                }
            };
            document.getElementById('delBtn')?.addEventListener('click', delHandler);
            document.getElementById('delBtnExp')?.addEventListener('click', delHandler);

            // ── Generate New Code with activation guard ──
            document.getElementById('refreshCodeBtn')?.addEventListener('click', async () => {
                // CRITICAL: Check if account became active before generating new code
                if (await checkIfActivated()) return;

                rawAccount = await refreshInviteCode(accountId);
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
                const ms = getCodeTimeRemaining(rawAccount);
                if (ms <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;

                    // CRITICAL: Check account status FIRST before showing expired UI
                    checkIfActivated().then(activated => {
                        if (activated) return;
                        // Account is still waiting — show expired UI
                        document.getElementById('state-waiting')?.classList.add('hidden');
                        document.getElementById('state-expired')?.classList.remove('hidden');
                    });
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

        // 🛑 CROSS-TAB SYNC: Listen for real-time changes 🛑
        storageHandler = async () => {
            const currentAcc = await getMutualAccount(accountId);
            if (currentAcc && currentAcc.status === 'connected') {
                // Upgraded to connected
                renderActiveLedger();
            } else if (currentAcc && currentAcc.status === 'waiting') {
                checkIfActivated();
            }
        };
        window.addEventListener('mutual-account-updated', storageHandler);

        // ── POLLING FALLBACK: Re-check every 3 seconds while on waiting screen ──
        // (in case real-time fails)
        pollInterval = setInterval(() => {
            checkIfActivated();
        }, 3000);

        renderWaitingScreen();
        return;
    }

    // STATE 2: ACTIVE MUTUAL LEDGER
    async function renderActiveLedger() {
        cleanup(); // Ensure all waiting-state timers are cleared

        await checkExpiredTransactions(accountId);
        let account = await getMutualAccount(accountId);
        if (!account) { window.location.hash = '#/dashboard'; return; }

        let activeTab = 0;

        async function refresh() {
            await checkExpiredTransactions(accountId);
            account = await getMutualAccount(accountId);
            if (!account) { window.location.hash = '#/dashboard'; return; }
            render();
        }

        // Cross-tab sync for active ledger
        storageHandler = async () => {
            const currentAcc = await getMutualAccount(accountId);
            if (!currentAcc) {
                window.location.hash = '#/dashboard';
                return;
            }
            refresh();
        };
        window.addEventListener('mutual-account-updated', storageHandler);

        function fmtG(g) { return formatIndianNumber(g, 3); }

        function getTxnLabel(txn) {
            const viewerAction = isCreator(account, user.id) ? txn.action : flipAction(txn.action);
            const key = `${txn.section}_${viewerAction}`;
            return TRANSACTION_LABELS[key] || viewerAction || 'Transaction';
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
                const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                
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
                    valStr = `${isIncrease ? '+' : '-'}${formatCurrency(amt)}`;
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
                                <span class="material-symbols-outlined text-[14px]">calendar_today</span>
                                <span>${dateStr}, ${timeStr}</span>
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

        function render() {
            const pendingTxns = (account.transactions || []).filter(t => t.status === 'pending' || t.status === 'pending_cancellation');
            const hasPendingForMe = pendingTxns.some(t => t.created_by !== user.id);

            const metalBal = parseFloat(account.metal_balance) || 0;
            const rupeeBal = parseFloat(account.rupee_balance) || 0;
            
            // Perspective overrides
            const metalPos = getPerspectiveMetalClass(account, user.id);
            const rupeePos = getPerspectiveRupeeClass(account, user.id);
            const perspectiveRole = getPerspectiveRole(account, user.id);
            const perspectiveTitle = getPerspectiveTitle(account, user.id);
            
            const metalPosLabel = getPositionLabel(metalPos);
            const rupeePosLabel = getPositionLabel(rupeePos);
            const metalActions = getMutualActionLabels(metalPos);
            const rupeeActions = getMutualActionLabels(rupeePos);

            const roleDisplay = formatRole(perspectiveRole);
            const showBookRate = isCustomerMetalPayable(perspectiveRole, metalPos);

            const isLocked = isAccountLocked(accountId);
            const lockOpacity = isLocked ? 'opacity-50 pointer-events-none' : '';

            const getScale = (valStr) => {
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
                <header class="ind-header relative">
                    <div class="ind-header-info pr-10">
                        <div class="ind-header-name flex items-center gap-2">
                            ${perspectiveTitle}
                            ${isLocked ? `<span class="bg-error-crimson/10 text-error-crimson text-[10px] px-2 py-0.5 rounded-full font-bold">CLOSING</span>` : ''}
                        </div>
                        <div class="ind-header-role mt-1">${roleDisplay} &middot; Mutual${account.mobile_number ? ` &middot; +91 ${account.mobile_number.replace(/(\d{5})(\d{5})/, '$1 $2')}` : ''}</div>
                    </div>
                    <div class="absolute right-4 top-1/2 -translate-y-1/2">
                        <button id="menuBtn" class="w-10 h-12 md:h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                        <div id="menuDropdown" class="hidden absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg border border-surface-variant overflow-hidden z-50">
                            ${!isLocked ? `
                            <button id="closeAccountMenuBtn" class="w-full text-left px-4 py-3 text-error-crimson hover:bg-surface-variant transition-colors text-sm font-medium flex items-center gap-2">
                                <span class="material-symbols-outlined text-[18px]">no_accounts</span>
                                Close Mutual Account
                            </button>
                            ` : `
                            <div class="px-4 py-3 text-on-surface-variant text-sm flex items-center gap-2 opacity-50">
                                <span class="material-symbols-outlined text-[18px]">lock</span>
                                Account Locked
                            </div>
                            `}
                        </div>
                    </div>
                </header>

                ${isLocked ? `
                <div style="background:var(--error-container); border-bottom:1px solid var(--error-crimson); padding:12px 24px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="material-symbols-outlined" style="color:var(--error-crimson); font-size:20px;">gavel</span>
                        <span style="font-weight:600; font-size:13px; color:var(--error-crimson);">Account Closure Requested</span>
                    </div>
                    <div style="font-size:12px; color:var(--on-surface-variant);">
                        ${account.close_requested_by === user.id ? 
                            'You have requested to close this account. Waiting for partner approval.' : 
                            `<span class="font-bold">${account.close_requested_by_name}</span> wants to close this account.`}
                    </div>
                    <div class="flex gap-2 mt-1">
                        ${account.close_requested_by === user.id ? 
                            `<button id="withdrawCloseBtn" class="px-3 py-1.5 border border-error-crimson text-error-crimson text-xs font-bold rounded shadow-sm hover:bg-error-container">Withdraw Request</button>` : 
                            `<button id="approveCloseBtn" class="px-3 py-1.5 bg-error-crimson text-white text-xs font-bold rounded shadow-sm hover:bg-black">Approve Closure</button>
                             <button id="rejectCloseBtn" class="px-3 py-1.5 border border-surface-variant text-on-surface text-xs font-bold rounded shadow-sm hover:bg-surface-variant">Reject</button>`
                        }
                    </div>
                </div>
                ` : ''}

                ${hasPendingForMe && !isLocked ? `
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
                    
                    <section class="ind-section ind-section-metal ${activeTab === 0 ? '' : 'hidden'}">
                        <div class="ind-balance-card stitch-accent">
                            <div class="flex items-center justify-between mb-2">
                                <div>
                                    <div class="ind-balance-label" style="margin-bottom:2px;">Metal Balance</div>
                                    <div style="font-size:12px; color:var(--text-muted);">Fine Gold (24K Pure)</div>
                                </div>
                                <span class="ind-class-badge ${metalPos === 'payable' ? 'ind-class-payable' : 'ind-class-receivable'}">${metalPosLabel}</span>
                            </div>
                            <div class="ind-balance-value flex items-baseline gap-1.5 min-w-0 overflow-x-auto pb-1 scrollbar-hide max-w-full whitespace-nowrap">
                                ${metalBal === 0 ? 
                                    `<span class="text-on-surface-variant text-xl font-medium">0.000 g</span>` : 
                                    `<span class="${getScale(fmtG(metalBal))}">${fmtG(metalBal)}</span>
                                    <span style="font-size:16px; opacity:0.5;">g</span>`
                                }
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-4 ${lockOpacity}">
                            <button class="act-btn h-12 bg-primary text-white border border-primary shadow-sm rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all" data-type="${metalActions.action1Op}" data-ledger="metal" ${isLocked ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                                ${metalActions.action1Label}
                            </button>
                            <button class="act-btn h-12 bg-surface-container-low border border-outline/30 shadow-sm text-primary rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:bg-surface-container transition-all active:scale-[0.98]" data-type="${metalActions.action2Op}" data-ledger="metal" ${isLocked ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-[18px]">remove_circle</span>
                                ${metalActions.action2Label}
                            </button>
                            <button class="act-btn ${showBookRate ? 'col-span-1' : 'col-span-2'} h-12 bg-surface-container-low border border-gold-metallic shadow-sm rounded-[8px] font-label-md font-semibold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] text-primary" data-type="convert_metal_to_rupee" data-ledger="metal" ${isLocked ? 'disabled' : ''}>
                                <span class="text-gold-metallic text-[16px] leading-none">₹</span>
                                METAL ➔ RUPEE
                            </button>
                            ${showBookRate ? `
                            <button class="act-btn col-span-1 h-12 bg-gold-metallic text-white border border-gold-metallic shadow-sm rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98]" data-type="rate_booking" data-ledger="metal" ${isLocked ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-[18px]">trending_up</span>
                                BOOK RATE
                            </button>` : ``}
                        </div>
                        <div class="ind-txn-section">
                            <h3 class="ind-txn-header">Metal Transactions</h3>
                            <div class="ind-txn-list">
                                ${getTransactionHTML('metal')}
                            </div>
                        </div>
                    </section>

                    <!-- RUPEE SECTION -->
                    <section class="ind-section ind-section-rupee ${activeTab === 1 ? '' : 'hidden'}">
                        <div class="ind-balance-card stitch-accent">
                            <div class="flex items-center justify-between mb-2">
                                <div>
                                    <div class="ind-balance-label" style="margin-bottom:2px;">Rupee Balance</div>
                                    <div style="font-size:12px; color:var(--text-muted);">Indian Rupee (INR)</div>
                                </div>
                                <span class="ind-class-badge ${rupeePos === 'payable' ? 'ind-class-payable' : 'ind-class-receivable'}">${rupeePosLabel}</span>
                            </div>
                            <div class="ind-balance-value flex items-baseline gap-1.5 min-w-0 overflow-x-auto pb-1 scrollbar-hide max-w-full whitespace-nowrap">
                                ${rupeeBal === 0 ? 
                                    `<span class="text-on-surface-variant text-xl font-medium">₹ 0.00</span>` : 
                                    `<span class="${getScale(formatCurrency(rupeeBal))}">${formatCurrency(rupeeBal)}</span>`
                                }
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3 mb-4 ${lockOpacity}">
                            <button class="act-btn h-12 bg-primary text-white border border-primary shadow-sm rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all" data-type="${rupeeActions.action1Op}" data-ledger="rupee" ${isLocked ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                                ${rupeeActions.action1Label}
                            </button>
                            <button class="act-btn h-12 bg-surface-container-low border border-outline/30 shadow-sm text-primary rounded-[8px] font-label-md text-[13px] flex items-center justify-center gap-2 hover:bg-surface-container transition-all active:scale-[0.98]" data-type="${rupeeActions.action2Op}" data-ledger="rupee" ${isLocked ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-[18px]">remove_circle</span>
                                ${rupeeActions.action2Label}
                            </button>
                            <button class="act-btn col-span-2 h-12 bg-surface-container-low border border-gold-metallic shadow-sm rounded-[8px] font-label-md font-semibold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] text-primary" data-type="convert_rupee_to_metal" data-ledger="rupee" ${isLocked ? 'disabled' : ''}>
                                <span class="text-gold-metallic text-[16px] leading-none">⇄</span>
                                RUPEE → METAL
                            </button>
                        </div>
                        <div class="ind-txn-section">
                            <h3 class="ind-txn-header">Rupee Transactions</h3>
                            <div class="ind-txn-list">
                                ${getTransactionHTML('rupee')}
                            </div>
                        </div>
                    </section>
                </div>
                
                    <!-- CLOSURE ACTIVITY SECTION -->
                    ${getClosureActivity(accountId).length > 0 ? `
                    <div class="p-4 border-t border-surface-variant bg-surface-container-lowest">
                        <h3 class="text-[11px] font-label-bold uppercase text-on-surface-variant tracking-widest mb-3">Closure Activity</h3>
                        <div class="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-variant before:to-transparent">
                            ${getClosureActivity(accountId).map(act => {
                                const d = new Date(act.created_at);
                                const time = d.toLocaleDateString('en-IN', {day:'2-digit',month:'short'}) + ' ' + d.toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit',hour12:true});
                                
                                let icon = 'gavel';
                                let text = '';
                                if(act.event === 'close_requested') { icon='gavel'; text=`Requested by ${act.by_user_name}`; }
                                else if(act.event === 'request_withdrawn') { icon='undo'; text=`Withdrawn by ${act.by_user_name}`; }
                                else if(act.event === 'request_rejected') { icon='block'; text=`Rejected by ${act.by_user_name}`; }

                                return `
                                <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div class="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-surface-container text-on-surface-variant shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                                        <span class="material-symbols-outlined text-[14px]">${icon}</span>
                                    </div>
                                    <div class="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-surface-variant shadow-sm">
                                        <div class="flex items-center justify-between space-x-2 mb-1">
                                            <div class="font-bold text-on-surface text-[12px] capitalize">${act.event.replace(/_/g, ' ')}</div>
                                            <time class="text-on-surface-variant text-[10px] font-mono">${time}</time>
                                        </div>
                                        <div class="text-on-surface-variant text-[12px]">${text}</div>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    ` : ''}

                <p class="text-[10px] text-on-surface-variant/60 text-center py-3 leading-relaxed px-4">These records are maintained by users. Please periodically verify your balances and transactions against your own business records. Approvals are a convenience feature, not a legal attestation.</p>
                <!-- TRANSACTION OVERLAY HOST -->
                <div id="transaction-overlay-host"></div>
            </div>
            `;
            attachListeners();
        }

        function attachListeners() {
            document.getElementById('tabMetalBtn')?.addEventListener('click', () => { activeTab = 0; render(); });
            document.getElementById('tabRupeeBtn')?.addEventListener('click', () => { activeTab = 1; render(); });

            // Menu toggle
            const menuBtn = document.getElementById('menuBtn');
            const menuDropdown = document.getElementById('menuDropdown');
            if (menuBtn && menuDropdown) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menuDropdown.classList.toggle('hidden');
                });
                document.addEventListener('click', () => {
                    menuDropdown.classList.add('hidden');
                });
            }

            // Close actions
            document.getElementById('closeAccountMenuBtn')?.addEventListener('click', async () => {
                if (confirm('Request to close this mutual account?\n\nThis will freeze all transactions until your partner approves. If they approve, the account will be permanently deleted.')) {
                    const res = await requestCloseMutualAccount(accountId, user.id, user.full_name || user.fullName);
                    if (res.error) alert(res.error);
                    refresh();
                }
            });
            document.getElementById('withdrawCloseBtn')?.addEventListener('click', async () => {
                const res = await withdrawCloseRequest(accountId, user.id, user.full_name || user.fullName);
                if (res.error) alert(res.error);
                refresh();
            });
            document.getElementById('approveCloseBtn')?.addEventListener('click', async () => {
                if (confirm('Permanently close and delete this account?\n\nWARNING: All transaction history will be lost. Ensure all balances are settled.')) {
                    const res = await approveCloseMutualAccount(accountId, user.id, user.full_name || user.fullName);
                    if (res.error) {
                        alert(res.error);
                    } else {
                        alert(`Mutual account with ${res.accountName} has been closed.`);
                        window.location.hash = '#/dashboard';
                    }
                }
            });
            document.getElementById('rejectCloseBtn')?.addEventListener('click', async () => {
                const res = await rejectCloseMutualAccount(accountId, user.id, user.full_name || user.fullName);
                if (res.error) alert(res.error);
                refresh();
            });

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
                row.addEventListener('click', async (e) => {
                    const txnId = e.currentTarget.dataset.id;
                    const requiresMyAction = e.currentTarget.dataset.action === 'true';
                    const txn = (account.transactions || []).find(t => t.id === txnId);
                    if (!txn) return;
                    
                    if (requiresMyAction) {
                        if (txn.status === 'pending_cancellation') {
                            if (confirm('Approve cancellation of this transaction?')) {
                                try { await approveCancelTransaction(accountId, txnId); refresh(); }
                                catch(err) { alert(err.message); }
                            }
                        } else if (txn.status === 'pending') {
                            const action = confirm('Approve this transaction?\n\nOK = Approve\nCancel = Reject');
                            try {
                                if (action) { await approveTransaction(accountId, txnId); }
                                else { await rejectTransaction(accountId, txnId); }
                                refresh();
                            } catch(err) { alert(err.message); }
                        }
                    }
                });
            });

            document.querySelectorAll('.request-cancel-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const txnId = e.currentTarget.dataset.id;
                    if (confirm('Request cancellation of this transaction?')) {
                        const result = await requestCancelTransaction(accountId, txnId, user.id);
                        if (result.error) { alert(result.error); }
                        else { refresh(); }
                    }
                });
            });
        }

        render();
    }
}

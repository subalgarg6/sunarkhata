import { getCurrentUser } from '../services/auth.service.js';
import {
  getMutualAccount, getUserPerspective, refreshInviteCode, getCodeTimeRemaining,
  approveTransaction, rejectTransaction, deleteMutualAccount,
  approveCancelTransaction, rejectCancelTransaction,
  approveEditTransaction, rejectEditTransaction
} from '../services/mutual.service.js';
import { formatIndianNumber } from '../utils/formatters.js';

export function renderMutualAccount(container, accountId) {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/'; return; }

  let rawAccount = getMutualAccount(accountId);
  if (!rawAccount) { window.location.hash = '#/dashboard'; return; }

  // -----------------------------------------------------
  // STATE 1: WAITING FOR PARTNER (SCREEN 4)
  // -----------------------------------------------------
  if (rawAccount.status === 'waiting') {
    const isCreator = rawAccount.created_by === user.id;
    let timerInterval = null;

    function renderWaitingScreen() {
      container.innerHTML = `
        <div class="bg-surface text-on-surface font-body-md min-h-screen">
          <header class="fixed top-0 left-0 w-full z-50 flex items-center px-4 h-16 bg-surface-offwhite shadow-sm border-b border-surface-container">
            <button id="waitBackBtn" class="p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <div class="font-headline-md text-[18px] ml-2 text-primary font-bold">Mutual Account Setup</div>
          </header>
          
          <main class="pt-24 pb-12 px-4 min-h-screen flex flex-col max-w-md mx-auto relative">
            <!-- State A: Waiting -->
            <section class="state-transition space-y-8 block" id="state-waiting">
              <div class="flex flex-col items-center text-center space-y-4">
                <div class="relative">
                  <div class="absolute inset-0 bg-gold-metallic/10 rounded-full scale-150 animate-pulse"></div>
                  <div class="w-24 h-24 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center relative z-10">
                    <span class="material-symbols-outlined text-gold-metallic text-[48px]" style="font-variation-settings: 'FILL' 1;">hourglass_empty</span>
                  </div>
                </div>
                <div class="space-y-1">
                  <h1 class="font-headline-lg-mobile text-[24px] font-bold text-primary">Waiting for Partner</h1>
                  <p class="text-on-surface-variant text-[14px]">Share this code with the partner jeweler to link your ledgers.</p>
                </div>
              </div>
              
              <div class="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant shadow-sm flex flex-col items-center space-y-6">
                <div class="flex flex-col items-center space-y-2">
                  <span class="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">Invite Code</span>
                  <div class="text-[32px] font-bold tracking-[0.2em] font-display-lg text-primary select-all">${rawAccount.inviteCode}</div>
                </div>
                <button id="copyCodeBtn" class="w-full flex items-center justify-center gap-2 py-4 px-6 bg-surface-container text-primary rounded-lg font-bold text-[14px] hover:bg-outline-variant transition-colors active:scale-95">
                  <span class="material-symbols-outlined text-[18px]">content_copy</span>
                  Copy Code
                </button>
              </div>
              
              <div class="flex flex-col items-center space-y-3">
                <div class="flex items-center gap-2 text-on-surface-variant">
                  <span class="material-symbols-outlined text-[20px]">schedule</span>
                  <span class="font-data-mono text-[14px]">Expires in <span class="font-bold text-primary" id="countdown">00:00</span></span>
                </div>
                <div class="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div class="h-full bg-gold-metallic w-full rounded-full transition-all" id="progress-bar"></div>
                </div>
              </div>
              <div class="pt-4 border-t border-outline-variant mt-8">
                <div class="flex gap-4 items-start">
                  <span class="material-symbols-outlined text-gold-metallic mt-1">verified_user</span>
                  <p class="text-on-surface-variant text-[12px]">This code establishes a secure, high-precision settlement channel between two entities.</p>
                </div>
              </div>
              <button id="delBtn" class="w-full mt-4 flex items-center justify-center gap-2 py-3 text-error-crimson rounded-lg font-bold text-[14px] hover:bg-error-container/20 transition-colors">
                  Cancel & Delete Setup
              </button>
            </section>
            
            <!-- State C: Expired (Hidden) -->
            <section class="state-transition space-y-8 hidden" id="state-expired">
              <div class="flex flex-col items-center text-center space-y-4">
                <div class="w-24 h-24 rounded-full bg-error-container/20 flex items-center justify-center">
                  <span class="material-symbols-outlined text-error-crimson text-[48px]">timer_off</span>
                </div>
                <div class="space-y-1">
                  <h1 class="font-headline-lg-mobile text-[24px] font-bold text-primary">Invite Expired</h1>
                  <p class="text-on-surface-variant text-[14px]">The security window for this invite code has closed.</p>
                </div>
              </div>
              <button id="refreshCodeBtn" class="w-full flex items-center justify-center gap-2 py-4 px-6 bg-charcoal-deep text-on-primary rounded-lg font-bold text-[14px] hover:bg-primary transition-colors shadow-lg active:scale-95">
                <span class="material-symbols-outlined">refresh</span>
                Generate New Code
              </button>
              <button id="delBtnExp" class="w-full flex items-center justify-center gap-2 py-4 text-error-crimson rounded-lg font-bold text-[14px] hover:bg-error-container/20 transition-colors">
                Delete Setup
              </button>
            </section>
          </main>
        </div>
      `;

      document.getElementById('waitBackBtn')?.addEventListener('click', () => window.location.hash = '#/dashboard');
      
      document.getElementById('copyCodeBtn')?.addEventListener('click', (e) => {
        navigator.clipboard.writeText(rawAccount.inviteCode);
        const btn = e.currentTarget;
        const orig = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> Copied!';
        btn.classList.add('bg-success-emerald/10', 'text-success-emerald');
        setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('bg-success-emerald/10', 'text-success-emerald'); }, 2000);
      });

      const delHandler = async () => {
        if(confirm('Delete this pending mutual account?')) {
          clearInterval(timerInterval);
          await deleteMutualAccount(user.id, accountId);
          window.location.hash = '#/dashboard';
        }
      };
      document.getElementById('delBtn')?.addEventListener('click', delHandler);
      document.getElementById('delBtnExp')?.addEventListener('click', delHandler);

      document.getElementById('refreshCodeBtn')?.addEventListener('click', async () => {
        const nr = await refreshInviteCode(user.id, accountId);
        rawAccount = nr;
        renderWaitingScreen();
      });

      startTimer();
    }

    function startTimer() {
      const countdownEl = document.getElementById('countdown');
      const progressBar = document.getElementById('progress-bar');
      const TOTAL_SECONDS = 300; // 5 mins

      if (timerInterval) clearInterval(timerInterval);
      
      timerInterval = setInterval(() => {
        const ms = getCodeTimeRemaining(rawAccount);
        if (ms <= 0) {
          clearInterval(timerInterval);
          document.getElementById('state-waiting').classList.add('hidden');
          document.getElementById('state-expired').classList.remove('hidden');
          return;
        }

        const sec = Math.floor(ms / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        if(countdownEl) countdownEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if(progressBar) {
            const pct = (sec / TOTAL_SECONDS) * 100;
            progressBar.style.width = `${pct}%`;
        }
      }, 1000);
    }

    renderWaitingScreen();
    return;
  }

  // -----------------------------------------------------
  // STATE 2: MUTUAL LEDGER VIEW (SCREEN 7)
  // -----------------------------------------------------
  let account = getUserPerspective(accountId, user.id);
  
  function refresh() {
    account = getUserPerspective(accountId, user.id);
    renderActiveScreen();
  }

  function fmtG(g) { return parseFloat(g || 0).toFixed(3); }
  function fmtR(r) { return formatIndianNumber(Math.round(parseFloat(r || 0))); }

  function renderActiveScreen() {
    const mBal = parseFloat(account.metal_balance) || 0;
    const rBal = parseFloat(account.rupee_balance) || 0;
    const isMetalReceivable = account.metal_class === 'receivable';
    const isRupeeReceivable = account.rupee_class === 'receivable';
    const absMetal = Math.abs(mBal);
    const absRupee = Math.abs(rBal);

    const txns = [...(account.transactions || [])].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    const pendingActionTxns = txns.filter(t => t.status === 'pending' || t.status === 'pending_cancellation' || t.status === 'pending_edit');
    const hasPendingForMe = pendingActionTxns.some(t => {
      // If it's pending, action is required from the receiver (which means NOT the creator)
      // Actually, standard logic: creator waits, receiver approves
      const actionRequiredByMe = t.created_by !== user.id;
      return actionRequiredByMe;
    });

    const partnerName = account.other_party_name || 'Partner';

    let historyHTML = '';
    
    if (txns.length === 0) {
      historyHTML = `
        <div class="flex flex-col items-center text-center py-20 px-4 w-full">
            <div class="relative inline-block mb-6">
                <div class="w-24 h-24 rounded-full bg-success-emerald/10 flex items-center justify-center mx-auto mb-4">
                  <span class="material-symbols-outlined text-success-emerald text-[48px]" style="font-variation-settings: 'FILL' 1;">check_circle</span>
                </div>
            </div>
            <div class="space-y-2 mb-8">
                <h3 class="font-headline-md text-headline-md text-primary">Partner Joined</h3>
                <p class="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">Your mutual ledger is synchronized. You can now add transactions.</p>
            </div>
            <button class="add-txn-btn bg-charcoal-deep text-on-primary px-10 py-4 rounded-lg font-bold text-[14px] hover:bg-black transition-all shadow-lg flex items-center gap-2 mx-auto">
                <span class="material-symbols-outlined">add</span>
                Add First Transaction
            </button>
        </div>
      `;
    } else {
        historyHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[700px]">
                <thead class="bg-surface-container-low font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">
                    <tr>
                        <th class="p-4 font-medium border-b border-outline-variant/30">Date / Ref</th>
                        <th class="p-4 font-medium border-b border-outline-variant/30">Description</th>
                        <th class="p-4 font-medium border-b border-outline-variant/30 text-right">Gold (gm)</th>
                        <th class="p-4 font-medium border-b border-outline-variant/30 text-right">Amount (₹)</th>
                        <th class="p-4 font-medium border-b border-outline-variant/30 text-center">Status</th>
                        <th class="p-4 font-medium border-b border-outline-variant/30 text-right">Action</th>
                    </tr>
                </thead>
                <tbody class="font-data-mono text-[14px] text-on-surface">
                    ${txns.map(txn => {
                        const dateObj = new Date(txn.created_at);
                        const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                        const isPending = txn.status === 'pending';
                        const isPendingCancel = txn.status === 'pending_cancellation';
                        const isSettled = txn.status === 'approved' || txn.status === 'settled';
                        const isCancelled = txn.status === 'cancelled' || txn.status === 'rejected';

                        const iCreated = txn.created_by === user.id;

                        // Calculate visual values based on perspective
                        let mVal = parseFloat(txn.metal_amount) || 0;
                        let rVal = parseFloat(txn.rupee_amount) || 0;
                        if (!iCreated) {
                            mVal = -mVal;
                            rVal = -rVal;
                        }

                        const mStr = mVal ? `${mVal > 0 ? '+' : ''}${mVal.toFixed(3)}` : '-';
                        const rStr = rVal ? `${rVal > 0 ? '+ ' : '- '} ${formatIndianNumber(Math.abs(rVal))}` : '-';
                        
                        let statusHtml = '';
                        let rowClass = 'hover:bg-gold-soft/20 transition-colors border-b border-outline-variant/30';
                        if (isPending || isPendingCancel) rowClass += ' bg-secondary-container/5';
                        if (isCancelled) rowClass += ' opacity-50 bg-surface-container-low/20';

                        if (isPending) {
                            statusHtml = `<span class="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-container">Pending</span>`;
                        } else if (isPendingCancel) {
                            statusHtml = `<span class="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-error-container text-error-crimson border border-error-crimson/20">Pending Cancel</span>`;
                        } else if (isSettled) {
                            statusHtml = `<span class="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium text-success-emerald bg-success-emerald/10">Settled</span>`;
                        } else if (isCancelled) {
                            statusHtml = `<span class="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium text-error-crimson bg-error-container/50">Cancelled</span>`;
                        }

                        let actionHtml = '';
                        if ((isPending || isPendingCancel) && !iCreated) {
                            actionHtml = `
                            <div class="flex justify-end gap-2">
                                <button class="approve-btn px-3 py-1 bg-charcoal-deep text-on-primary rounded text-xs hover:bg-opacity-90 transition-colors" data-id="${txn.id}" data-type="${txn.status}">Approve</button>
                                <button class="reject-btn px-3 py-1 bg-white border border-charcoal-deep text-charcoal-deep rounded text-xs hover:bg-surface-container transition-colors" data-id="${txn.id}" data-type="${txn.status}">Reject</button>
                            </div>`;
                        } else if (isSettled) {
                            actionHtml = `<button class="cancel-req-btn text-error-crimson hover:underline text-xs font-body-md" data-id="${txn.id}">Req Cancel</button>`;
                        } else if ((isPending || isPendingCancel) && iCreated) {
                            actionHtml = `<span class="text-[11px] text-on-surface-variant">Waiting...</span>`;
                        }

                        let title = txn.type.replace(/_/g, ' ');
                        title = title.charAt(0).toUpperCase() + title.slice(1);
                        if (txn.type === 'convert_to_metal') title = 'Adjust in Gold';
                        if (txn.type === 'convert_to_rupee') title = 'Cash Settlement';
                        if (txn.type === 'rate_booking') title = 'Book Gold Rate';

                        return `
                        <tr class="${rowClass}">
                            <td class="p-4">
                                <div class="font-medium">${dateStr}</div>
                                <div class="text-xs text-on-surface-variant font-body-md mt-1">#${txn.id.substring(0,6).toUpperCase()}</div>
                            </td>
                            <td class="p-4">
                                <div class="font-semibold ${isCancelled ? 'line-through' : ''}">${title}</div>
                                ${txn.narration ? `<div class="text-[11px] text-on-surface-variant font-body-md mt-1 truncate max-w-[150px]">${txn.narration}</div>` : ''}
                            </td>
                            <td class="p-4 text-right ${mVal > 0 ? 'text-success-emerald' : mVal < 0 ? 'text-error-crimson' : 'text-on-surface-variant'} ${isCancelled ? 'line-through' : ''}">${mStr}</td>
                            <td class="p-4 text-right ${rVal > 0 ? 'text-success-emerald' : rVal < 0 ? 'text-error-crimson' : 'text-on-surface-variant'} ${isCancelled ? 'line-through' : ''}">${rStr}</td>
                            <td class="p-4 text-center">${statusHtml}</td>
                            <td class="p-4 text-right">${actionHtml}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        `;
    }

    container.innerHTML = `
      <div class="bg-background text-on-surface antialiased pt-16 pb-24 md:pb-0 min-h-screen">
          <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-margin-desktop h-16 bg-surface-offwhite shadow-sm border-b border-surface-container">
              <div class="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer" id="headerBackBtn">
                  <span class="material-symbols-outlined text-primary">arrow_back</span>
                  <div class="w-8 h-8 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border border-outline-variant">
                      <span class="material-symbols-outlined text-[20px] text-on-surface-variant">handshake</span>
                  </div>
                  <span class="font-headline-md text-[16px] md:font-headline-md font-black text-primary truncate max-w-[150px]">${partnerName}</span>
              </div>
              <div class="flex items-center gap-3">
                  <button id="delAccBtn" class="p-2 text-error-crimson hover:bg-error-container/20 rounded-full transition-colors" title="Delete Mutual Account">
                      <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
              </div>
          </header>

          <main class="max-w-[1440px] mx-auto px-4 md:px-margin-desktop py-8 flex flex-col gap-8 mt-4">
              ${hasPendingForMe ? `
              <section class="bg-secondary-container/20 border border-secondary-container rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                  <div class="flex items-start gap-3">
                      <span class="material-symbols-outlined text-on-secondary-container mt-1">warning</span>
                      <div>
                          <h3 class="font-label-md text-label-md text-on-secondary-container">Action Required</h3>
                          <p class="font-body-md text-body-md text-on-surface-variant text-sm">You have pending transactions waiting for your approval.</p>
                      </div>
                  </div>
              </section>` : ''}

              <section class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-gutter">
                  <!-- Gold Position -->
                  <div class="bg-surface-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between h-full bg-white relative overflow-hidden">
                      <div class="flex justify-between items-start mb-6 z-10 relative">
                          <div>
                              <span class="font-label-md text-[10px] md:text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">Net Gold Position</span>
                              <div class="flex items-center gap-2">
                                  <span class="px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold font-data-mono">FINE</span>
                              </div>
                          </div>
                          <span class="material-symbols-outlined text-gold-metallic text-3xl">diamond</span>
                      </div>
                      <div class="z-10 relative">
                          <div class="font-display-lg text-[36px] md:text-display-lg ${isMetalReceivable ? 'text-success-emerald' : 'text-error-crimson'} mb-2">
                              ${isMetalReceivable ? '+' : '-'}${fmtG(absMetal)} <span class="text-xl text-on-surface-variant font-normal">g</span>
                          </div>
                          <p class="font-body-md text-[12px] md:text-sm text-on-surface-variant font-bold uppercase">${isMetalReceivable ? 'You are owed gold by this party.' : 'You owe gold to this party.'}</p>
                      </div>
                      ${absMetal > 0 ? `<div class="absolute -right-8 -top-8 w-48 h-48 ${isMetalReceivable ? 'bg-success-emerald/10' : 'bg-error-container/20'} rounded-full blur-3xl"></div>` : ''}
                  </div>
                  <!-- Rupee Position -->
                  <div class="bg-surface-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between h-full bg-white relative overflow-hidden">
                      <div class="flex justify-between items-start mb-6 z-10 relative">
                          <span class="font-label-md text-[10px] md:text-label-md text-on-surface-variant uppercase tracking-wider block mb-1">Net Cash Position</span>
                          <span class="material-symbols-outlined text-on-surface-variant text-3xl">currency_rupee</span>
                      </div>
                      <div class="z-10 relative">
                          <div class="font-display-lg text-[36px] md:text-display-lg ${isRupeeReceivable ? 'text-success-emerald' : 'text-error-crimson'} mb-2">
                              ${isRupeeReceivable ? '+' : '-'}₹ ${fmtR(absRupee)}
                          </div>
                          <p class="font-body-md text-[12px] md:text-sm text-on-surface-variant font-bold uppercase">${isRupeeReceivable ? 'You are owed cash.' : 'You owe cash to this party.'}</p>
                      </div>
                      ${absRupee > 0 ? `<div class="absolute -right-8 -top-8 w-48 h-48 ${isRupeeReceivable ? 'bg-success-emerald/10' : 'bg-error-container/20'} rounded-full blur-3xl"></div>` : ''}
                  </div>
              </section>

              <section class="bg-white rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
                  <div class="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-offwhite">
                      <h2 class="font-headline-md text-[16px] md:text-headline-md text-on-surface">Mutual Ledger Entries</h2>
                      <div class="flex gap-2">
                          <button class="add-txn-btn p-2 px-4 bg-charcoal-deep text-on-primary rounded font-label-md text-[12px] hover:bg-black transition-colors shadow-sm hidden md:block">
                              + Add Transaction
                          </button>
                      </div>
                  </div>
                  ${historyHTML}
              </section>
          </main>

          <!-- BottomNavBar (Mobile Only) -->
          <nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-offwhite border-t border-outline-variant shadow-sm pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
              <button class="nav-dash-btn flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-gold-soft/10 transition-transform">
                  <span class="material-symbols-outlined mb-1">dashboard</span>
                  <span class="font-label-md text-[10px]">Dashboard</span>
              </button>
              <button class="add-txn-btn flex flex-col items-center justify-center bg-charcoal-deep text-on-primary rounded-xl px-6 py-2 -mt-6 shadow-lg border-2 border-surface active:scale-95 transition-transform">
                  <span class="material-symbols-outlined mb-1 text-[24px]">add</span>
                  <span class="font-label-md text-[10px]">Entry</span>
              </button>
              <button class="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-gold-soft/10 transition-transform">
                  <span class="material-symbols-outlined mb-1">history</span>
                  <span class="font-label-md text-[10px]">Reports</span>
              </button>
          </nav>
      </div>
    `;

    attachActiveListeners();
  }

  function attachActiveListeners() {
    document.getElementById('headerBackBtn')?.addEventListener('click', () => window.location.hash = '#/dashboard');
    document.querySelector('.nav-dash-btn')?.addEventListener('click', () => window.location.hash = '#/dashboard');

    document.querySelectorAll('.add-txn-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = `#/transaction/mutual/${accountId}?type=metal_increase`;
      });
    });

    document.getElementById('delAccBtn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this mutual account? This will delete it for both parties.')) {
        await deleteMutualAccount(user.id, accountId);
        window.location.hash = '#/dashboard';
      }
    });

    // Approval / Rejection logic
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const txnId = btn.dataset.id;
        const type = btn.dataset.type;
        try {
          if (type === 'pending_cancellation') {
            await approveCancelTransaction(user.id, accountId, txnId);
          } else {
            await approveTransaction(user.id, accountId, txnId);
          }
          refresh();
        } catch (e) { alert(e.message); }
      });
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const txnId = btn.dataset.id;
        const type = btn.dataset.type;
        try {
          if (type === 'pending_cancellation') {
            await rejectCancelTransaction(user.id, accountId, txnId);
          } else {
            await rejectTransaction(user.id, accountId, txnId);
          }
          refresh();
        } catch (e) { alert(e.message); }
      });
    });

    document.querySelectorAll('.cancel-req-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Request cancellation of this transaction? The partner will need to approve.')) {
          const txnId = btn.dataset.id;
          try {
            await requestCancelTransaction(user.id, accountId, txnId);
            refresh();
          } catch (e) { alert(e.message); }
        }
      });
    });
  }

  renderActiveScreen();
}

// Keep renderCreateMutual as is, we handled its replacement in Phase 1 if needed, or we'll update it later if it's a separate screen.
export function renderCreateMutual(container) {
    // This is currently a simple form, but we'll adapt it later in the plan if needed.
    // For now, it stays as is, or we'll update it during Account Creation phase.
}

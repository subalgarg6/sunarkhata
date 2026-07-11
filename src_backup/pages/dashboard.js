import { getCurrentUser } from '../services/auth.service.js';
import { getIndividualAccounts } from '../services/individual.service.js';
import { getMutualAccounts } from '../services/mutual.service.js';
import { formatIndianNumber } from '../utils/formatters.js';

export function renderDashboard(container) {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/auth'; return; }

  function render() {
    const indAccs = getIndividualAccounts(user.id) || [];
    const mutAccs = getMutualAccounts(user.id) || [];
    
    const allAccounts = [
      ...indAccs.map(a => ({ ...a, _isMutual: false })),
      ...mutAccs.map(a => ({ ...a, _isMutual: true }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    let totalMetal = 0, totalRupee = 0;
    allAccounts.forEach(acc => {
      const mBal = parseFloat(acc.metal_balance) || 0;
      totalMetal += acc.metal_class === 'receivable' ? mBal : -mBal;
      const rBal = parseFloat(acc.rupee_balance) || 0;
      totalRupee += acc.rupee_class === 'receivable' ? rBal : -rBal;
    });

    const isMetalReceivable = totalMetal >= 0;
    const isRupeeReceivable = totalRupee >= 0;

    let contentHTML = '';

    if (allAccounts.length === 0) {
      // EMPTY STATE from Screen 3 (Dashboard Empty State)
      contentHTML = `
        <div class="absolute inset-0 z-0 pointer-events-none empty-state-gradient"></div>
        <section class="w-full max-w-container-max px-margin-desktop py-12 relative z-10 w-full" id="state-dashboard">
            <div class="flex flex-col items-center text-center max-w-2xl mx-auto space-y-8">
                <!-- Visual Anchor -->
                <div class="w-32 h-32 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-lg border border-gold-soft/30">
                    <span class="material-symbols-outlined text-6xl text-gold-metallic opacity-40" style="font-variation-settings: 'wght' 200;">account_balance_wallet</span>
                </div>
                <div class="space-y-3">
                    <h1 class="font-headline-lg text-headline-lg text-primary">No accounts yet</h1>
                    <p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">Your digital ledger is ready. Start by creating a jeweler account to manage gold settlements and daily balances with precision.</p>
                </div>
                <div class="flex gap-4">
                    <button id="emptyNewIndBtn" class="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:bg-charcoal-deep transition-all shadow-md active:scale-95 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">person</span>
                        New Individual
                    </button>
                    <button id="emptyNewMutBtn" class="bg-surface-container-lowest border border-primary text-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-all shadow-md active:scale-95 flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">handshake</span>
                        New Mutual
                    </button>
                </div>
                <!-- Subtle Grid Placeholder -->
                <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 opacity-30 grayscale hidden md:grid">
                    <div class="h-40 glass-card rounded-xl border-dashed border-2 border-outline-variant"></div>
                    <div class="h-40 glass-card rounded-xl border-dashed border-2 border-outline-variant"></div>
                    <div class="h-40 glass-card rounded-xl border-dashed border-2 border-outline-variant"></div>
                </div>
            </div>
        </section>
      `;
    } else {
      // POPULATED DASHBOARD from Screen 2
      contentHTML = `
        <div class="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            <!-- Left/Center Column: Account Overview (8 cols) -->
            <div class="lg:col-span-8 space-y-8">
                <!-- Overall Position Summary Header -->
                <section class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="font-headline-lg text-primary">Unified Portfolio</h2>
                        <p class="text-on-surface-variant">Real-time settlement status across all ledgers</p>
                    </div>
                    <div class="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                        <div class="bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/30 shadow-sm flex-shrink-0">
                            <span class="text-xs text-on-surface-variant block uppercase font-bold tracking-wider">Total Gold</span>
                            <span class="font-data-mono ${isMetalReceivable ? 'text-success-emerald' : 'text-error-crimson'} text-lg">${isMetalReceivable ? '' : '-'}${Math.abs(totalMetal).toFixed(3)} g <span class="text-xs">${isMetalReceivable ? 'Receivable' : 'Payable'}</span></span>
                        </div>
                        <div class="bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/30 shadow-sm flex-shrink-0">
                            <span class="text-xs text-on-surface-variant block uppercase font-bold tracking-wider">Total Rupee</span>
                            <span class="font-data-mono ${isRupeeReceivable ? 'text-success-emerald' : 'text-error-crimson'} text-lg">${isRupeeReceivable ? '' : '-'}₹${formatIndianNumber(Math.abs(Math.round(totalRupee)))} <span class="text-xs">${isRupeeReceivable ? 'Receivable' : 'Payable'}</span></span>
                        </div>
                    </div>
                </section>

                <!-- Accounts Section -->
                <section class="space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-headline-md text-primary">Your Ledgers</h3>
                        <div class="flex items-center gap-2">
                            <div class="relative hidden sm:block">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                                <input class="pl-9 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm w-64 focus:ring-1 focus:ring-gold-metallic" placeholder="Search account..." type="text"/>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ledger Cards Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 lg:pb-0">
                        ${allAccounts.map(acc => {
                            const isWaiting = acc._isMutual && acc.status === 'waiting';
                            const name = isWaiting ? `${acc.other_party_name} (Waiting...)` : (acc.other_party_name || acc.otherName);
                            const roleText = (acc.role || acc.myRole) === 'supplier' ? 'Vendor' : 'Customer';
                            const modeText = acc._isMutual ? 'Mutual' : 'Individual';
                            const modeIcon = acc._isMutual ? 'handshake' : 'person';
                            const initialIcon = acc._isMutual ? 'storefront' : 'person';
                            
                            const mBal = parseFloat(acc.metal_balance) || 0;
                            const metalColor = acc.metal_class === 'receivable' ? 'text-success-emerald' : 'text-error-crimson';
                            const metalText = acc.metal_class === 'receivable' ? 'Receivable' : 'Payable';

                            const rBal = Math.round(parseFloat(acc.rupee_balance)) || 0;
                            const rupeeColor = acc.rupee_class === 'receivable' ? 'text-success-emerald' : 'text-error-crimson';
                            const rupeeText = acc.rupee_class === 'receivable' ? 'Receivable' : 'Payable';

                            const pendingCount = acc._isMutual && acc.transactions ? acc.transactions.filter(t => t.status === 'pending' || t.status === 'pending_cancellation').length : 0;

                            return `
                                <div class="dash-account-card bg-surface-container-lowest rounded-2xl p-6 shadow-ambient border border-outline-variant/10 hover:border-gold-metallic/30 transition-all cursor-pointer group" data-id="${acc.id}" data-type="${acc._isMutual ? 'mutual' : 'individual'}">
                                    <div class="flex justify-between items-start mb-4">
                                        <div class="flex gap-4">
                                            <div class="w-12 h-12 rounded-xl ${acc._isMutual ? 'bg-gold-soft/30 text-gold-metallic' : 'bg-surface-container text-on-surface-variant'} flex items-center justify-center">
                                                <span class="material-symbols-outlined">${initialIcon}</span>
                                            </div>
                                            <div>
                                                <h3 class="font-headline-md text-lg text-primary group-hover:text-gold-metallic transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-[180px]">${name}</h3>
                                                <div class="flex items-center gap-2 mt-1">
                                                    <span class="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-md text-[10px] uppercase">${roleText}</span>
                                                    <span class="px-2 py-0.5 rounded-full ${acc._isMutual ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-dim text-on-surface'} font-label-md text-[10px] flex items-center gap-1 uppercase">
                                                        <span class="material-symbols-outlined text-[12px]">${modeIcon}</span> ${modeText}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        ${pendingCount > 0 ? `
                                        <div class="bg-error-container/50 text-error-crimson px-2 py-1 rounded-md flex items-center gap-1">
                                            <span class="material-symbols-outlined text-[14px]">warning</span>
                                            <span class="font-label-md text-[10px] font-bold hidden sm:inline">${pendingCount} REQ.</span>
                                            <span class="font-label-md text-[10px] font-bold sm:hidden">${pendingCount}</span>
                                        </div>
                                        ` : `
                                        <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
                                        `}
                                    </div>
                                    <div class="grid grid-cols-2 gap-4 sm:gap-6 border-t border-outline-variant/10 pt-4">
                                        <div>
                                            <p class="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Gold</p>
                                            <p class="font-data-mono ${metalColor} text-base sm:text-lg">${Math.abs(mBal).toFixed(3)}g</p>
                                            <p class="text-[10px] sm:text-xs text-on-surface-variant">${metalText}</p>
                                        </div>
                                        <div>
                                            <p class="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Rupee</p>
                                            <p class="font-data-mono ${rupeeColor} text-base sm:text-lg">₹${formatIndianNumber(Math.abs(rBal))}</p>
                                            <p class="text-[10px] sm:text-xs text-on-surface-variant">${rupeeText}</p>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </section>
            </div>

            <!-- Right Column: Quick Actions (4 cols) -->
            <aside class="hidden lg:block lg:col-span-4 space-y-8">
                <!-- Quick Actions Bento -->
                <section class="space-y-4">
                    <h3 class="font-headline-md text-primary">Quick Actions</h3>
                    <div class="grid grid-cols-1 gap-3">
                        <button id="newIndBtn" class="flex items-center gap-4 p-4 bg-charcoal-deep text-on-primary rounded-2xl hover:bg-charcoal-deep/90 transition-all shadow-md group">
                            <div class="w-12 h-12 rounded-xl bg-gold-metallic/20 flex items-center justify-center text-gold-metallic">
                                <span class="material-symbols-outlined group-hover:rotate-12 transition-transform">person_add</span>
                            </div>
                            <div class="text-left">
                                <p class="font-headline-md text-sm leading-none">New Individual</p>
                                <p class="text-xs text-gold-soft/70 mt-1">Local personal ledger</p>
                            </div>
                        </button>
                        <button id="newMutBtn" class="flex items-center gap-4 p-4 bg-surface-container-lowest text-primary rounded-2xl border border-outline-variant/20 hover:border-gold-metallic transition-all shadow-sm group">
                            <div class="w-12 h-12 rounded-xl bg-gold-soft flex items-center justify-center text-gold-metallic">
                                <span class="material-symbols-outlined group-hover:scale-110 transition-transform">handshake</span>
                            </div>
                            <div class="text-left">
                                <p class="font-headline-md text-sm leading-none">New Mutual</p>
                                <p class="text-xs text-on-surface-variant mt-1">Shared business ledger</p>
                            </div>
                        </button>
                    </div>
                </section>
            </aside>
        </div>
        
        <!-- Mobile Floating Action Button (Alternative for quick actions) -->
        <div class="lg:hidden fixed bottom-20 right-4 flex flex-col gap-3 z-40">
           <button id="mobileNewIndBtn" class="w-12 h-12 bg-charcoal-deep text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
              <span class="material-symbols-outlined">person_add</span>
           </button>
           <button id="mobileNewMutBtn" class="w-12 h-12 bg-gold-metallic text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
              <span class="material-symbols-outlined">handshake</span>
           </button>
        </div>
      `;
    }

    container.innerHTML = `
      <style>
        .shadow-ambient {
            box-shadow: 0 8px 24px rgba(26, 28, 30, 0.04);
        }
        .empty-state-gradient {
            background: radial-gradient(circle at center, rgba(197, 160, 40, 0.03) 0%, transparent 70%);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(197, 160, 40, 0.1);
        }
        .nav-active {
            border-bottom: 2px solid #C5A028;
            color: #000101;
        }
      </style>
      <div class="bg-surface-offwhite font-body-md text-on-surface min-h-screen flex flex-col w-full page-transition pb-16 lg:pb-0">
        
        <!-- Top Navigation Bar -->
        <header class="bg-surface-offwhite border-b border-outline-variant/30 fixed top-0 left-0 w-full z-50 h-16 flex items-center justify-between px-4 lg:px-margin-desktop">
            <div class="flex items-center gap-8">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center text-charcoal-deep font-bold font-headline-md">
                        ${user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 class="font-headline-md text-gold-metallic leading-tight text-sm md:text-base">${user.full_name}</h1>
                        <p class="font-label-md text-[10px] md:text-xs text-on-surface-variant">@${user.khata_id || user.khataId}</p>
                    </div>
                </div>
                <nav class="hidden md:flex items-center gap-6">
                    <a class="font-label-md text-label-md nav-active hover:text-gold-metallic transition-colors duration-200 py-1" href="#/">Dashboard</a>
                </nav>
            </div>
            <div class="flex items-center gap-2 md:gap-4">
                <button id="calcBtn" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                    <span class="material-symbols-outlined text-on-surface-variant">calculate</span>
                </button>
                <button id="profileSettingsBtn" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                    <span class="material-symbols-outlined text-on-surface-variant">settings</span>
                </button>
            </div>
        </header>

        <!-- Sidebar for Desktop -->
        <aside class="fixed left-0 top-16 bottom-0 w-20 bg-surface-offwhite border-r border-outline-variant/30 hidden lg:flex flex-col items-center py-8 gap-8 z-40">
            <button class="w-12 h-12 flex flex-col items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm group">
                <span class="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1;">dashboard</span>
            </button>
        </aside>

        <!-- Main Grid Layout -->
        <main class="lg:pl-20 pt-16 flex-grow flex flex-col relative w-full h-full">
            ${contentHTML}
        </main>

        <!-- Bottom Bar (Mobile Only) -->
        <nav class="bg-surface-offwhite lg:hidden border-t border-outline-variant fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 shadow-lg">
            <button class="flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-xl px-4 py-1.5 transition-all">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">dashboard</span>
                <span class="font-label-md text-[10px] mt-1">Home</span>
            </button>
            <button id="navAccountsBtn" class="flex flex-col items-center justify-center text-on-surface-variant p-2">
                <span class="material-symbols-outlined">account_balance_wallet</span>
                <span class="font-label-md text-[10px] mt-1">Accounts</span>
            </button>
        </nav>

      </div>
    `;

    attachListeners();
  }

  function attachListeners() {
    document.getElementById('profileSettingsBtn')?.addEventListener('click', () => {
      window.location.hash = '#/profile';
    });
    document.getElementById('calcBtn')?.addEventListener('click', () => {
      window.location.hash = '#/calculator';
    });
    
    // Quick actions (Desktop)
    document.getElementById('newIndBtn')?.addEventListener('click', () => {
      window.location.hash = '#/new-individual';
    });
    document.getElementById('newMutBtn')?.addEventListener('click', () => {
      window.location.hash = '#/new-mutual';
    });
    
    // Quick actions (Empty State)
    document.getElementById('emptyNewIndBtn')?.addEventListener('click', () => {
      window.location.hash = '#/new-individual';
    });
    document.getElementById('emptyNewMutBtn')?.addEventListener('click', () => {
      window.location.hash = '#/new-mutual';
    });

    // Quick actions (Mobile FAB)
    document.getElementById('mobileNewIndBtn')?.addEventListener('click', () => {
        window.location.hash = '#/new-individual';
    });
    document.getElementById('mobileNewMutBtn')?.addEventListener('click', () => {
        window.location.hash = '#/new-mutual';
    });

    // Account clicks
    document.querySelectorAll('.dash-account-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const type = el.dataset.type;
        window.location.hash = type === 'mutual' ? `#/mutual/${id}` : `#/account/${id}`;
      });
    });
  }

  render();
}

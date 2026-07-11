import { getCurrentUser, signOut } from '../services/auth.service.js';
import { getIndividualAccounts } from '../services/individual.service.js';
import { getMutualAccounts } from '../services/mutual.service.js';
import { formatIndianNumber } from '../utils/formatters.js';
import { getPositionLabel, formatRole } from '../utils/position-engine.js';
import { renderIndividualAccount } from './individual-account.js';
import { renderMutualAccount } from './mutual-account.js';
import { renderAccountCreation } from './account-creation.js';

/**
 * SunarKhata — Persistent Workspace Dashboard
 * ChatGPT-like architecture: persistent sidebar + right workspace panel.
 * 
 * LEFT SIDEBAR (persistent):
 *   - SunarKhata identity/logo
 *   - + New Account button
 *   - Search bar
 *   - Full account list (party name, role, individual/mutual badge)
 *   - Bottom: Dashboard, Calculator, Profile & Settings, Pricing, Current user, Logout
 * 
 * RIGHT WORKSPACE:
 *   - No account selected → Account Creation workspace
 *   - Account selected → That account's live ledger
 */
export function renderDashboard(container) {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/auth'; return; }

  let selectedAccountId = null;
  let selectedAccountType = null; // 'individual' | 'mutual'
  let searchQuery = '';
  let sidebarOpen = false; // mobile sidebar toggle

  // Check if URL has an account deep link
  const hash = window.location.hash.slice(1) || '';
  const accountMatch = hash.match(/^\/account\/(.+)$/);
  const mutualMatch = hash.match(/^\/mutual\/(.+)$/);
  if (accountMatch) {
    selectedAccountId = accountMatch[1];
    selectedAccountType = 'individual';
  } else if (mutualMatch) {
    selectedAccountId = mutualMatch[1];
    selectedAccountType = 'mutual';
  }

  function getAllAccounts() {
    const indAccs = getIndividualAccounts(user.id) || [];
    const mutAccs = getMutualAccounts(user.id) || [];
    return [
      ...indAccs.map(a => ({ ...a, _isMutual: false })),
      ...mutAccs.map(a => ({ ...a, _isMutual: true }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  function getFilteredAccounts() {
    const all = getAllAccounts();
    if (!searchQuery) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(a => {
      const name = (a.other_party_name || '').toLowerCase();
      const role = (a.role || a.creator_role || '').toLowerCase();
      return name.includes(q) || role.includes(q);
    });
  }

  function render() {
    const allAccounts = getAllAccounts();
    const filteredAccounts = getFilteredAccounts();

    container.innerHTML = `
      <style>
        .workspace-shell { display: flex; height: 100vh; overflow: hidden; background: var(--md-sys-color-surface-offwhite, #FAFAF5); }
        .ws-sidebar { 
          width: 300px; min-width: 300px; max-width: 300px;
          background: var(--md-sys-color-surface-offwhite, #FAFAF5);
          border-right: 1px solid rgba(200,200,190,0.3);
          display: flex; flex-direction: column;
          overflow: hidden; z-index: 50;
        }
        .ws-sidebar-header { padding: 16px; border-bottom: 1px solid rgba(200,200,190,0.2); }
        .ws-sidebar-accounts { flex: 1; overflow-y: auto; padding: 8px; }
        .ws-sidebar-footer { padding: 12px; border-top: 1px solid rgba(200,200,190,0.2); }
        .ws-main { flex: 1; overflow-y: auto; overflow-x: hidden; position: relative; }
        .ws-account-item {
          padding: 12px; border-radius: 12px; cursor: pointer;
          transition: all 0.15s ease; margin-bottom: 2px;
          display: flex; align-items: flex-start; gap: 12px;
        }
        .ws-account-item:hover { background: rgba(197,160,40,0.06); }
        .ws-account-item.active { background: rgba(197,160,40,0.12); border: 1px solid rgba(197,160,40,0.3); }
        .ws-account-item:not(.active) { border: 1px solid transparent; }
        .ws-footer-btn {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 8px 12px; border-radius: 8px; font-size: 13px;
          transition: all 0.15s ease; border: none; background: none;
          color: var(--md-sys-color-on-surface-variant, #5C5C56);
          cursor: pointer; text-align: left;
        }
        .ws-footer-btn:hover { background: rgba(197,160,40,0.08); color: var(--md-sys-color-primary, #000101); }
        .ws-footer-btn .material-symbols-outlined { font-size: 20px; }
        .ws-new-btn {
          width: 100%; padding: 10px; border-radius: 10px;
          border: 1px dashed rgba(197,160,40,0.4);
          background: rgba(197,160,40,0.04); color: var(--md-sys-color-primary, #000101);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          font-weight: 600; font-size: 13px; transition: all 0.15s ease;
        }
        .ws-new-btn:hover { background: rgba(197,160,40,0.12); border-color: rgba(197,160,40,0.7); }
        .ws-search-input {
          width: 100%; padding: 8px 12px 8px 36px; border-radius: 8px;
          background: rgba(0,0,0,0.03); border: 1px solid rgba(200,200,190,0.3);
          font-size: 13px; outline: none; transition: border-color 0.15s;
        }
        .ws-search-input:focus { border-color: var(--md-sys-color-gold-metallic, #C5A028); }
        
        /* Mobile sidebar overlay */
        @media (max-width: 1023px) {
          .ws-sidebar {
            position: fixed; left: 0; top: 0; bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          }
          .ws-sidebar.open { transform: translateX(0); }
          .ws-mobile-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.4);
            z-index: 49; opacity: 0; pointer-events: none;
            transition: opacity 0.25s ease;
          }
          .ws-mobile-overlay.active { opacity: 1; pointer-events: auto; }
          .ws-mobile-topbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 16px; border-bottom: 1px solid rgba(200,200,190,0.3);
            background: var(--md-sys-color-surface-offwhite, #FAFAF5);
          }
        }
        @media (min-width: 1024px) {
          .ws-mobile-topbar { display: none; }
          .ws-mobile-overlay { display: none; }
        }
      </style>

      <div class="workspace-shell">
        <!-- Mobile Overlay -->
        <div id="sidebarOverlay" class="ws-mobile-overlay ${sidebarOpen ? 'active' : ''}"></div>

        <!-- LEFT PERSISTENT SIDEBAR -->
        <aside class="ws-sidebar ${sidebarOpen ? 'open' : ''}">
          <!-- SunarKhata Identity -->
          <div class="ws-sidebar-header">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 rounded-lg bg-gold-soft flex items-center justify-center">
                <span class="material-symbols-outlined text-gold-metallic text-lg" style="font-variation-settings: 'FILL' 1;">balance</span>
              </div>
              <div>
                <h1 class="font-headline-md text-sm text-primary font-bold leading-tight">SunarKhata</h1>
                <p class="text-[10px] text-on-surface-variant">Digital Jeweller Ledger</p>
              </div>
            </div>

            <!-- + New Account -->
            <button id="newAccountBtn" class="ws-new-btn">
              <span class="material-symbols-outlined text-base">add</span>
              New Account
            </button>

            <!-- Search -->
            <div class="relative mt-3">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
              <input id="sidebarSearch" type="text" class="ws-search-input" placeholder="Search accounts..." value="${searchQuery}" />
            </div>
          </div>

          <!-- Account List -->
          <div class="ws-sidebar-accounts">
            ${filteredAccounts.length === 0 ? `
              <div class="text-center py-8 text-on-surface-variant text-xs">
                ${searchQuery ? 'No matching accounts' : 'No accounts yet'}
              </div>
            ` : filteredAccounts.map(acc => {
              const isActive = selectedAccountId === acc.id;
              const name = acc.other_party_name || 'Unnamed';
              const r = formatRole(acc.role || acc.creator_role);
              const isMutual = acc._isMutual;
              const isWaiting = isMutual && acc.status === 'waiting';
              const pendingCount = isMutual && acc.transactions ? acc.transactions.filter(t => t.status === 'pending' || t.status === 'pending_cancellation').length : 0;

              return `
                <div class="ws-account-item ${isActive ? 'active' : ''}" data-id="${acc.id}" data-type="${isMutual ? 'mutual' : 'individual'}">
                  <div class="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold ${isMutual ? 'bg-gold-soft/40 text-gold-metallic' : 'bg-surface-container text-on-surface-variant'}">
                    <span class="material-symbols-outlined text-base">${isMutual ? 'handshake' : 'person'}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-primary truncate leading-tight">${name}${isWaiting ? ' <span class="text-[10px] text-gold-metallic">(Waiting)</span>' : ''}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span class="text-[10px] text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded uppercase font-bold leading-none">${r}</span>
                      <span class="text-[10px] text-on-surface-variant bg-surface-dim px-1.5 py-0.5 rounded uppercase font-bold leading-none">${isMutual ? 'Mutual' : 'Individual'}</span>
                    </div>
                  </div>
                  ${pendingCount > 0 ? `<span class="bg-error-crimson text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">${pendingCount}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Bottom Footer -->
          <div class="ws-sidebar-footer space-y-1">
            <button id="footerProfile" class="ws-footer-btn">
              <span class="material-symbols-outlined">settings</span>
              Profile & Settings
            </button>
            <div class="border-t border-outline-variant/20 mt-2 pt-2">
              <div class="flex items-center gap-3 px-3 py-2">
                <div class="w-8 h-8 rounded-full bg-gold-soft flex items-center justify-center text-charcoal-deep font-bold text-xs">
                  ${(user.full_name || user.fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-primary truncate">${user.full_name || user.fullName}</p>
                  <p class="text-[10px] text-on-surface-variant truncate">@${user.khata_id || user.khataId}</p>
                </div>
                <button id="footerLogout" class="text-on-surface-variant hover:text-error-crimson transition-colors" title="Logout">
                  <span class="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- RIGHT WORKSPACE -->
        <div class="ws-main">
          <!-- Mobile Top Bar -->
          <div class="ws-mobile-topbar lg:hidden">
            <button id="mobileMenuBtn" class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">menu</span>
              <span class="font-headline-md text-sm text-primary font-bold">SunarKhata</span>
            </button>
            <div class="flex items-center gap-2">
              <button id="mobileNewAccBtn" class="w-9 h-9 flex items-center justify-center rounded-full bg-gold-soft text-gold-metallic">
                <span class="material-symbols-outlined text-xl">add</span>
              </button>
            </div>
          </div>

          <!-- Workspace Content Area -->
          <div id="workspaceContent" class="h-full"></div>
        </div>
      </div>
    `;

    attachListeners();
    renderWorkspaceContent();
  }

  function renderWorkspaceContent() {
    const workspaceEl = document.getElementById('workspaceContent');
    if (!workspaceEl) return;
    workspaceEl.innerHTML = '';

    if (selectedAccountId) {
      if (selectedAccountType === 'mutual') {
        renderMutualAccount(workspaceEl, selectedAccountId);
      } else {
        renderIndividualAccount(workspaceEl, selectedAccountId);
      }
    } else {
      // Default: show account creation workspace
      renderAccountCreation(workspaceEl, 'individual');
    }
  }

  function selectAccount(id, type) {
    selectedAccountId = id;
    selectedAccountType = type;
    sidebarOpen = false;
    // Update URL for deep-linking
    const hashPrefix = type === 'mutual' ? '#/mutual/' : '#/account/';
    history.replaceState(null, '', hashPrefix + id);
    render();
  }

  function attachListeners() {
    // Sidebar account clicks
    document.querySelectorAll('.ws-account-item').forEach(el => {
      el.addEventListener('click', () => {
        selectAccount(el.dataset.id, el.dataset.type);
      });
    });

    // New Account
    document.getElementById('newAccountBtn')?.addEventListener('click', () => {
      selectedAccountId = null;
      selectedAccountType = null;
      sidebarOpen = false;
      history.replaceState(null, '', '#/dashboard');
      render();
    });

    // Search
    document.getElementById('sidebarSearch')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
      // Restore focus
      const inp = document.getElementById('sidebarSearch');
      if (inp) { inp.focus(); inp.setSelectionRange(searchQuery.length, searchQuery.length); }
    });

    // Footer nav
    document.getElementById('footerProfile')?.addEventListener('click', () => { window.location.hash = '#/profile'; });

    // Logout
    document.getElementById('footerLogout')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        signOut();
        window.location.hash = '#/';
        window.dispatchEvent(new Event('auth-change'));
      }
    });

    // Mobile sidebar toggle
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      sidebarOpen = true;
      const sidebar = document.querySelector('.ws-sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar) sidebar.classList.add('open');
      if (overlay) overlay.classList.add('active');
    });
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
      sidebarOpen = false;
      const sidebar = document.querySelector('.ws-sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    });

    // Mobile top bar buttons
    document.getElementById('mobileNewAccBtn')?.addEventListener('click', () => {
      selectedAccountId = null;
      selectedAccountType = null;
      sidebarOpen = false;
      history.replaceState(null, '', '#/dashboard');
      render();
    });
  }

  render();
}

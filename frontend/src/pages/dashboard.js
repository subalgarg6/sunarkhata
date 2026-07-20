import { getCurrentUser, signOut } from '../services/auth.service.js';
import { getIndividualAccounts } from '../services/individual.service.js';
import { getMutualAccounts, isAccountLocked } from '../services/mutual.service.js';
import { formatIndianNumber, formatCurrency } from '../utils/formatters.js';
import { getPerspectiveTitle, getPerspectiveRole } from '../utils/mutual-perspective.js';
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
export async function renderDashboard(container) {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/auth'; return; }

  container.innerHTML = '<div class="p-8 text-center text-on-surface-variant flex items-center justify-center h-full"><span class="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span> Loading workspace...</div>';

  console.log('[DEBUG] Starting workspace data fetch for user:', user.id);
  let mutualAccountsList = [];
  try {
    mutualAccountsList = await getMutualAccounts(user.id);
    console.log('[DEBUG] Fetch completed. Mutual:', mutualAccountsList.length);
  } catch(err) {
    console.error('[DEBUG] Fetch failed:', err);
  }

  // Listen for real-time updates to refresh the list
  const onMutualUpdate = async () => {
    mutualAccountsList = await getMutualAccounts(user.id);
    if (document.getElementById('sidebarSearch')) {
       render();
    } else {
       window.removeEventListener('mutual-account-updated', onMutualUpdate);
    }
  };
  window.addEventListener('mutual-account-updated', onMutualUpdate);

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

  const editMatch = hash.match(/^\/edit\/(individual|mutual)\/(.+)$/);
  let editModeAccount = null;
  if (editMatch) {
    const editType = editMatch[1];
    const editId = editMatch[2];
    if (editType === 'individual') {
      editModeAccount = getIndividualAccounts(user.id).find(a => a.id === editId);
    } else {
      editModeAccount = mutualAccountsList.find(a => a.id === editId);
    }
  }

  function getAllAccounts() {
    const indAccs = getIndividualAccounts(user.id) || [];
    const mutAccs = mutualAccountsList || [];
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
            <div class="flex items-center gap-4 mb-6">
              <img src="/logo.png" class="rounded-full overflow-hidden shadow-sm w-14 h-14 object-contain" alt="SunarKhata Logo" />
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
              const isMutual = acc._isMutual;
              const name = isMutual ? getPerspectiveTitle(acc, user.id) : (acc.other_party_name || 'Unnamed');
              const rawRole = isMutual ? getPerspectiveRole(acc, user.id) : (acc.role || acc.creator_role);
              const r = formatRole(rawRole);
              const isWaiting = isMutual && acc.status === 'waiting';
              const isLocked = isMutual && isAccountLocked(acc);
              const pendingCount = isMutual && acc.transactions ? acc.transactions.filter(t => t.status === 'pending' || t.status === 'pending_cancellation').length : 0;

              return `
                <div class="ws-account-item ${isActive ? 'active' : ''}" data-id="${acc.id}" data-type="${isMutual ? 'mutual' : 'individual'}">
                  <div class="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold ${isMutual ? 'bg-gold-soft/40 text-gold-metallic' : 'bg-surface-container text-on-surface-variant'}">
                    <span class="material-symbols-outlined text-base">${isMutual ? 'handshake' : 'person'}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-primary truncate leading-tight">${name}${isWaiting ? ' <span class="text-[10px] text-gold-metallic">(Waiting)</span>' : ''}${isLocked ? ' <span class="text-[10px] text-error-crimson">(Closing)</span>' : ''}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span class="text-[10px] text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded uppercase font-bold leading-none">${r}</span>
                      <span class="text-[10px] text-on-surface-variant bg-surface-dim px-1.5 py-0.5 rounded uppercase font-bold leading-none">${isMutual ? 'Mutual' : 'Individual'}</span>
                    </div>
                  </div>
                  ${pendingCount > 0 && !isLocked ? `<span class="bg-error-crimson text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">${pendingCount}</span>` : ''}
                  <div class="relative ml-2 shrink-0">
                    <button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors ws-account-menu-btn" data-id="${acc.id}">
                      <span class="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                    <!-- Dropdown -->
                    <div class="absolute right-0 top-10 w-36 border border-surface-variant rounded-lg shadow-lg py-1 z-[100] hidden ws-account-dropdown" id="dropdown-${acc.id}">
                      ${isLocked ? `
                      <div class="px-4 py-2 text-left text-sm text-on-surface-variant flex items-center gap-2 opacity-50">
                        <span class="material-symbols-outlined text-[18px]">lock</span> Locked
                      </div>
                      ` : `
                      <button class="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 ws-edit-account-btn" data-id="${acc.id}" data-type="${isMutual ? 'mutual' : 'individual'}">
                        <span class="material-symbols-outlined text-[18px]">edit</span> Edit
                      </button>
                      <button class="w-full px-4 py-2 text-left text-sm text-error-crimson hover:bg-error-container/20 flex items-center gap-2 ws-delete-account-btn" data-id="${acc.id}" data-type="${isMutual ? 'mutual' : 'individual'}" data-name="${name}" data-role="${r}" data-is-mutual="${isMutual}">
                        <span class="material-symbols-outlined text-[18px]">delete</span> Delete
                      </button>
                      `}
                    </div>
                  </div>
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

    if (editModeAccount) {
      renderAccountCreation(workspaceEl, {
        isEdit: true,
        type: editMatch[1],
        account: editModeAccount
      });
    } else if (selectedAccountId) {
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
      el.addEventListener('click', (e) => {
        // Prevent click if clicking on the menu button or inside the dropdown
        if (e.target.closest('.ws-account-menu-btn') || e.target.closest('.ws-account-dropdown')) return;
        
        selectAccount(el.dataset.id, el.dataset.type);
      });
    });

    document.getElementById('footerProfile')?.addEventListener('click', () => { window.location.hash = '#/profile'; });


    // Sidebar 3-dot menu toggles
    document.querySelectorAll('.ws-account-menu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const dropdown = document.getElementById(`dropdown-${id}`);
        // Close all others
        document.querySelectorAll('.ws-account-dropdown').forEach(d => {
          if (d !== dropdown) d.classList.add('hidden');
        });
        dropdown.classList.toggle('hidden');
      });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.ws-account-dropdown').forEach(d => d.classList.add('hidden'));
    });

    // Edit Account buttons
    document.querySelectorAll('.ws-edit-account-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const type = btn.dataset.type;
        window.location.hash = `#/edit/${type}/${id}`;
      });
    });

    // Delete Account buttons
    document.querySelectorAll('.ws-delete-account-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { id, type, name, role, isMutual } = btn.dataset;
        showDeleteModal(id, type, name, role, isMutual === 'true');
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

  function showDeleteModal(id, type, name, role, isMutual) {
    const existing = document.getElementById('deleteAccountModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'deleteAccountModal';
    overlay.className = 'fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity';
    
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-y-auto max-h-[90vh] flex flex-col transform transition-transform scale-95 animate-scale-in">
        <div class="p-5 border-b border-surface-variant flex items-center gap-3 bg-error-container/10">
          <div class="w-10 h-10 rounded-full bg-error-container text-error-crimson flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-xl">delete_forever</span>
          </div>
          <div>
            <h3 class="text-lg font-bold text-error-crimson leading-tight">Delete Account</h3>
            <p class="text-[11px] text-on-surface-variant uppercase font-bold tracking-wider mt-0.5">Permanent Action</p>
          </div>
        </div>
        
        <div class="p-5 space-y-4">
          <p class="text-sm text-on-surface-variant leading-relaxed">
            Are you sure you want to permanently delete this account? All associated records will be destroyed.
          </p>
          
          <div class="bg-surface-container-lowest border border-surface-variant rounded-lg p-3 space-y-1">
            <p class="text-base font-bold text-primary truncate">${name}</p>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-bold uppercase">${role}</span>
              <span class="text-[10px] text-on-surface-variant bg-surface-dim px-2 py-0.5 rounded font-bold uppercase">${isMutual ? 'Mutual' : 'Individual'} Account</span>
            </div>
          </div>
        </div>

        <div class="p-4 bg-surface-container-low border-t border-surface-variant flex gap-3">
          <button id="cancelDeleteBtn" class="flex-1 py-2.5 rounded-lg font-bold text-on-surface-variant border border-surface-variant hover:bg-surface-variant transition-colors text-sm">
            Cancel
          </button>
          <button id="confirmDeleteBtn" class="flex-1 py-2.5 rounded-lg font-bold text-white bg-error-crimson hover:bg-[#b00020] transition-colors shadow-sm text-sm flex items-center justify-center gap-2">
            Delete
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.querySelector('.animate-scale-in').classList.remove('scale-95');
      overlay.querySelector('.animate-scale-in').classList.add('scale-100');
    });

    const close = () => {
      overlay.classList.add('opacity-0');
      setTimeout(() => overlay.remove(), 200);
    };

    document.getElementById('cancelDeleteBtn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Deleting...';

      let res = { success: true };
      if (type === 'mutual') {
        import('../services/mutual.service.js').then(async m => {
          res = await m.deleteMutualAccount(id);
          finishDelete(res);
        });
      } else {
        import('../services/individual.service.js').then(m => {
          m.deleteIndividualAccount(id);
          finishDelete(res);
        });
      }

      function finishDelete(result) {
        if (!result.success) {
          alert(result.error);
          btn.disabled = false;
          btn.innerHTML = 'Delete';
          close();
          return;
        }

        if (localStorage.getItem('sk_last_viewed_account') === id) {
          localStorage.removeItem('sk_last_viewed_account');
        }

        if (selectedAccountId === id) {
          selectedAccountId = null;
          selectedAccountType = null;
          window.location.hash = '#/dashboard';
        }
        
        close();
        render(); 
      }
    });
  }

  render();
}

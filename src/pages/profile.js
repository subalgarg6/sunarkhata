import { getCurrentUser, updateProfile, changePassword, signOut, deleteAccount } from '../services/auth.service.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { MAX_ACCOUNT_NAME_LENGTH } from '../utils/constants.js';

export function renderProfilePage(container) {
  const user = getCurrentUser();
  if (!user) {
    window.location.hash = '#/auth';
    return;
  }

  // Local state
  let fullName = user.full_name || user.fullName || '';
  let businessName = user.business_name || user.businessName || '';
  let defaultPurity = parseFloat(user.default_purity) || 100;
  // Determine which preset matches, or 'custom'
  function getPurityPreset(val) {
    if (val === 100) return '24k';
    if (val === 92) return '22k';
    if (val === 75) return '18k';
    return 'custom';
  }
  let purityPreset = getPurityPreset(defaultPurity);
  const safeKhataId = user.khata_id || user.khataId || '';
  const initialChar = fullName ? fullName.charAt(0).toUpperCase() : (safeKhataId ? safeKhataId.charAt(0).toUpperCase() : 'U');

  function render() {
    // TopAppBar
    const headerHtml = `
      <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-surface-offwhite shadow-sm md:flex hidden">
          <div class="flex items-center space-x-4 cursor-pointer" id="desktopBackBtn">
              <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              <div class="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center text-charcoal-deep font-bold font-headline-md text-[16px]">
                  ${initialChar}
              </div>
              <h1 class="font-headline-md text-headline-md font-black text-gold-metallic">
                  @${safeKhataId}
              </h1>
          </div>
      </header>
      
      <!-- Mobile Top Header -->
      <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface-offwhite shadow-sm md:hidden">
          <div class="flex items-center gap-2 cursor-pointer" id="mobileBackBtn">
             <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
             <h1 class="font-headline-lg-mobile text-[20px] font-black text-gold-metallic">
                 @${safeKhataId}
             </h1>
          </div>
      </header>
    `;

    const mainHtml = `
      <main class="w-full max-w-[1200px] mx-auto px-4 md:px-8 pt-24 pb-32 min-h-screen flex flex-col">
          <div class="mb-8 md:mb-10">
              <h2 class="font-display-lg text-[32px] md:text-[40px] text-primary font-bold mb-2">Settings</h2>
              <p class="text-on-surface-variant font-body-lg text-[16px]">Manage your account preferences and ledger configurations.</p>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1">
              <!-- Left Column: Profile & Basics -->
              <div class="lg:col-span-8 space-y-8">
                  <!-- Profile Section -->
                  <section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-surface-variant">
                      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-surface-variant gap-4">
                          <h3 class="font-headline-md text-[20px] text-primary font-bold">Profile Information</h3>
                          <div class="flex items-center space-x-2 bg-surface-container-low px-4 py-2 rounded-lg w-fit">
                              <span class="text-on-surface-variant font-label-md text-[12px] uppercase tracking-wider">Khata ID</span>
                              <span class="font-data-mono text-[14px] text-primary font-bold">@${safeKhataId}</span>
                              <button class="text-primary hover:text-gold-metallic transition-colors" title="Copy Khata ID" id="copyKhataId">
                                  <span class="material-symbols-outlined text-sm">content_copy</span>
                              </button>
                          </div>
                      </div>
                      
                      <div class="space-y-6">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div class="space-y-2 relative">
                                  <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider font-bold" for="fullName">Full Name</label>
                                  <input type="text" id="fullName" value="${fullName}" placeholder="Enter your full name" 
                                      class="w-full bg-surface-container-low border border-surface-variant focus:border-primary rounded-lg px-4 py-3 font-body-md text-[16px] text-primary outline-none transition-colors" maxlength="${MAX_ACCOUNT_NAME_LENGTH}" />
                              </div>
                              <div class="space-y-2 relative">
                                  <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider font-bold" for="businessName">Business Name</label>
                                  <input type="text" id="businessName" value="${businessName}" placeholder="Enter business name" 
                                      class="w-full bg-surface-container-low border border-surface-variant focus:border-primary rounded-lg px-4 py-3 font-body-md text-[16px] text-primary outline-none transition-colors" maxlength="${MAX_ACCOUNT_NAME_LENGTH}" />
                              </div>
                          </div>
                          
                          <div class="pt-6">
                              <button id="saveProfileBtn" class="bg-primary text-white px-8 py-3 rounded-lg font-label-md text-[14px] font-bold hover:bg-black transition-colors shadow-sm w-full md:w-auto">
                                  Save Changes
                              </button>
                          </div>
                      </div>
                  </section>
                  
                  <!-- Ledger Configuration Section -->
                  <section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-surface-variant">
                       <h3 class="font-headline-md text-[20px] text-primary font-bold mb-8 pb-4 border-b border-surface-variant">Ledger Preferences</h3>
                       <div>
                           <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider font-bold mb-2">Default Gold Purity</label>
                           <p class="text-sm text-on-surface-variant mb-5">This sets the default purity value that is pre-filled when creating new items.</p>
                           <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                               <label class="cursor-pointer">
                                   <input type="radio" name="purityPreset" value="24k" class="peer sr-only" ${purityPreset === '24k' ? 'checked' : ''} />
                                   <div class="flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-2 border-surface-variant peer-checked:border-primary peer-checked:bg-primary/5 text-on-surface-variant peer-checked:text-primary transition-all hover:bg-surface-container-low">
                                       <span class="font-headline-md text-[18px] font-bold">24K</span>
                                       <span class="font-label-md text-[11px] text-on-surface-variant">(100%)</span>
                                   </div>
                               </label>
                               <label class="cursor-pointer">
                                   <input type="radio" name="purityPreset" value="22k" class="peer sr-only" ${purityPreset === '22k' ? 'checked' : ''} />
                                   <div class="flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-2 border-surface-variant peer-checked:border-primary peer-checked:bg-primary/5 text-on-surface-variant peer-checked:text-primary transition-all hover:bg-surface-container-low">
                                       <span class="font-headline-md text-[18px] font-bold">22K</span>
                                       <span class="font-label-md text-[11px] text-on-surface-variant">(92%)</span>
                                   </div>
                               </label>
                               <label class="cursor-pointer">
                                   <input type="radio" name="purityPreset" value="18k" class="peer sr-only" ${purityPreset === '18k' ? 'checked' : ''} />
                                   <div class="flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-2 border-surface-variant peer-checked:border-primary peer-checked:bg-primary/5 text-on-surface-variant peer-checked:text-primary transition-all hover:bg-surface-container-low">
                                       <span class="font-headline-md text-[18px] font-bold">18K</span>
                                       <span class="font-label-md text-[11px] text-on-surface-variant">(75%)</span>
                                   </div>
                               </label>
                               <label class="cursor-pointer">
                                   <input type="radio" name="purityPreset" value="custom" class="peer sr-only" ${purityPreset === 'custom' ? 'checked' : ''} />
                                   <div class="flex flex-col items-center justify-center gap-1 py-4 rounded-xl border-2 border-surface-variant peer-checked:border-primary peer-checked:bg-primary/5 text-on-surface-variant peer-checked:text-primary transition-all hover:bg-surface-container-low">
                                       <span class="material-symbols-outlined text-[20px]">tune</span>
                                       <span class="font-label-md text-[11px] text-on-surface-variant">Custom</span>
                                   </div>
                               </label>
                           </div>
                           <div id="customPurityRow" class="mt-4 ${purityPreset === 'custom' ? '' : 'hidden'}">
                               <div class="flex items-center gap-3">
                                   <div class="flex-1 relative">
                                       <input type="number" inputmode="decimal" id="customPurityInput" step="any" min="0" max="100" value="${purityPreset === 'custom' ? defaultPurity : ''}" placeholder="e.g. 87.5"
                                           class="w-full bg-surface-container-low border border-surface-variant focus:border-primary rounded-lg px-4 py-3 font-data-mono text-[16px] text-primary outline-none transition-colors pr-10" />
                                       <span class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-label-md text-[13px]">%</span>
                                   </div>
                                   <button id="saveCustomPurityBtn" class="bg-primary text-white px-5 py-3 rounded-lg font-label-md text-[13px] font-bold hover:bg-black transition-colors shadow-sm whitespace-nowrap">
                                       Save
                                   </button>
                               </div>
                           </div>
                           <div class="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
                               <span class="material-symbols-outlined text-[16px]">info</span>
                               <span>Current default: <strong class="text-primary font-data-mono">${defaultPurity}%</strong></span>
                           </div>
                       </div>
                   </section>

                  <!-- Legal Section -->
                  <section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-surface-variant">
                      <h3 class="font-headline-md text-[20px] text-primary font-bold mb-6 flex items-center">
                          <span class="material-symbols-outlined mr-2 text-on-surface-variant">gavel</span>
                          Legal & About
                      </h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <a href="#/legal/terms" class="flex items-center gap-3 p-4 rounded-lg border border-surface-variant hover:bg-surface-container-low transition-colors text-primary font-bold">
                              <span class="material-symbols-outlined text-on-surface-variant">description</span>
                              <span class="font-label-md text-[14px]">Terms of Service</span>
                          </a>
                          <a href="#/legal/privacy" class="flex items-center gap-3 p-4 rounded-lg border border-surface-variant hover:bg-surface-container-low transition-colors text-primary font-bold">
                              <span class="material-symbols-outlined text-on-surface-variant">policy</span>
                              <span class="font-label-md text-[14px]">Privacy Policy</span>
                          </a>
                          <a href="#/legal/cookies" class="flex items-center gap-3 p-4 rounded-lg border border-surface-variant hover:bg-surface-container-low transition-colors text-primary font-bold">
                              <span class="material-symbols-outlined text-on-surface-variant">cookie</span>
                              <span class="font-label-md text-[14px]">Cookie Policy</span>
                          </a>
                          <a href="#/legal/disclaimer" class="flex items-center gap-3 p-4 rounded-lg border border-surface-variant hover:bg-surface-container-low transition-colors text-primary font-bold">
                              <span class="material-symbols-outlined text-on-surface-variant">info</span>
                              <span class="font-label-md text-[14px]">Legal Disclaimer</span>
                          </a>
                      </div>
                  </section>
              </div>
              
              <!-- Right Column: Security & Actions -->
              <div class="lg:col-span-4 space-y-8">
                  <!-- Security Card -->
                  <section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-surface-variant">
                      <h3 class="font-headline-md text-[20px] text-primary font-bold mb-6 flex items-center">
                          <span class="material-symbols-outlined mr-2 text-primary">security</span>
                          Security
                      </h3>
                      <div class="space-y-4">
                          <button id="changePwBtn" class="w-full text-left px-4 py-4 rounded-lg border border-surface-variant hover:bg-surface-container-low transition-colors flex justify-between items-center group">
                              <div>
                                  <span class="block font-label-md text-[14px] text-primary font-bold">Change Password</span>
                                  <span class="text-[12px] text-on-surface-variant">Update your credentials</span>
                              </div>
                              <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                          </button>
                      </div>
                  </section>
                  
                  <!-- Destructive Actions -->
                  <section class="pt-2 space-y-4">
                      <button id="logoutBtn" class="w-full flex items-center justify-center py-4 rounded-xl border border-surface-variant text-primary font-label-md text-[14px] font-bold hover:bg-surface-container-low transition-colors bg-surface-container-lowest shadow-sm group">
                          <span class="material-symbols-outlined mr-2 group-hover:-translate-x-1 transition-transform">logout</span>
                          Logout Securely
                      </button>
                      
                      <button id="deleteAccBtn" class="w-full flex items-center justify-center py-4 rounded-xl border border-error-crimson/50 text-error-crimson font-label-md font-bold text-[14px] hover:bg-error-container transition-colors bg-surface-container-lowest shadow-sm group">
                          <span class="material-symbols-outlined mr-2 group-hover:scale-110 transition-transform">delete_forever</span>
                          Delete Account
                      </button>
                      
                      <p class="text-center text-[12px] text-on-surface-variant mt-6">
                          SunarKhata Version 2.4.1 (Gold Edition)
                      </p>
                  </section>
              </div>
          </div>
      </main>

      <!-- BottomNavBar (Mobile Only) -->
      <nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-offwhite border-t border-surface-variant shadow-sm md:hidden pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
          <a href="#/dashboard" class="flex flex-col items-center justify-center text-on-surface-variant p-2 font-label-md text-[10px] hover:text-primary">
              <span class="material-symbols-outlined mb-1">dashboard</span>
              Dashboard
          </a>
          <a href="#/profile" class="flex flex-col items-center justify-center text-primary p-2 font-label-md text-[10px]">
              <span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 1;">settings</span>
              Settings
          </a>
      </nav>
    `;

    container.innerHTML = `
      <div class="bg-surface text-on-surface font-body-md antialiased min-h-screen">
        ${headerHtml}
        ${mainHtml}
      </div>
    `;

    attachListeners();
  }

  function attachListeners() {
    document.getElementById('desktopBackBtn')?.addEventListener('click', () => window.location.hash = '#/dashboard');
    document.getElementById('mobileBackBtn')?.addEventListener('click', () => window.location.hash = '#/dashboard');

    document.getElementById('copyKhataId')?.addEventListener('click', (e) => {
        navigator.clipboard.writeText(safeKhataId);
        showToast('Khata ID copied to clipboard', 'success');
    });

    // Handle Purity Preset Radios
    document.querySelectorAll('input[name="purityPreset"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            purityPreset = e.target.value;
            const customRow = document.getElementById('customPurityRow');
            if (purityPreset === 'custom') {
                customRow?.classList.remove('hidden');
                document.getElementById('customPurityInput')?.focus();
            } else {
                customRow?.classList.add('hidden');
                const presetMap = { '24k': 100, '22k': 92, '18k': 75 };
                defaultPurity = presetMap[purityPreset];
                updateProfile({ default_purity: defaultPurity });
                showToast(`Default purity set to ${defaultPurity}%`, 'success');
                render();
            }
        });
    });

    // Handle Custom Purity Save
    document.getElementById('saveCustomPurityBtn')?.addEventListener('click', () => {
        const inp = document.getElementById('customPurityInput');
        const val = parseFloat(inp?.value);
        if (isNaN(val) || val <= 0 || val > 100) {
            showToast('Enter a valid purity between 0 and 100', 'error');
            return;
        }
        defaultPurity = val;
        purityPreset = 'custom';
        updateProfile({ default_purity: defaultPurity });
        showToast(`Default purity set to ${val}%`, 'success');
        render();
    });

    document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
        fullName = document.getElementById('fullName').value.trim();
        businessName = document.getElementById('businessName').value.trim();
        updateProfile({ full_name: fullName, business_name: businessName });
        showToast('Profile updated successfully', 'success');
        render();
    });

    document.getElementById('changePwBtn')?.addEventListener('click', () => {
        const oldPw = prompt("Enter current password:");
        if (!oldPw) return;
        const newPw = prompt("Enter new password:");
        if (!newPw) return;
        const confirmPw = prompt("Confirm new password:");
        if (newPw !== confirmPw) {
            showToast('Passwords do not match', 'error');
            return;
        }
        try {
            changePassword(oldPw, newPw);
            showToast('Password changed successfully', 'success');
        } catch (e) {
            showToast(e.message, 'error');
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        showModal({
            title: 'Logout Securely',
            message: 'Are you sure you want to log out of your session?',
            confirmText: 'Logout',
            onConfirm: () => {
                signOut();
                window.location.hash = '#/auth';
            }
        });
    });

    document.getElementById('deleteAccBtn')?.addEventListener('click', () => {
        const id = prompt(`This action cannot be undone. Type your Khata ID (@${safeKhataId}) to confirm deletion:`);
        if (id === safeKhataId) {
            deleteAccount();
            window.location.hash = '#/auth';
        } else if (id !== null) {
            showToast('Khata ID does not match. Account not deleted.', 'error');
        }
    });
  }

  render();
}


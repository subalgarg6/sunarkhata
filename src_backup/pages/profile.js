import { getCurrentUser, updateProfile, changePassword, signOut, deleteAccount } from '../services/auth.service.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';

export function renderProfilePage(container) {
  const user = getCurrentUser();
  if (!user) {
    window.location.hash = '#/auth';
    return;
  }

  // Local state
  let fullName = user.full_name || '';
  let businessName = user.business_name || '';
  let defaultPurity = user.default_purity || '91.6'; // Store 100, 91.6, 75
  let allowPayable = user.allow_payable ?? true; // Dummy preference if not in auth yet

  function render() {
    // TopAppBar
    const headerHtml = `
      <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-margin-desktop h-16 bg-surface-offwhite shadow-sm md:flex hidden">
          <div class="flex items-center space-x-4 cursor-pointer" id="desktopBackBtn">
              <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
              <div class="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center text-charcoal-deep font-bold font-headline-md text-[16px]">
                  ${fullName.charAt(0) || 'U'}
              </div>
              <h1 class="font-headline-md text-headline-md font-black text-gold-metallic">
                  ${user.khata_id}
              </h1>
          </div>
          <div class="flex items-center space-x-6">
              <nav class="flex space-x-6">
                  <a href="#/dashboard" class="flex flex-col items-center justify-center text-on-surface-variant p-2 font-label-md text-[12px] hover:opacity-80 transition-opacity">
                      <span class="material-symbols-outlined mb-1">dashboard</span>
                      Dashboard
                  </a>
                  <a href="#/profile" class="flex flex-col items-center justify-center text-gold-metallic p-2 font-label-md text-[12px] hover:opacity-80 transition-opacity opacity-70">
                      <span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 1;">settings</span>
                      Settings
                  </a>
              </nav>
          </div>
      </header>
      
      <!-- Mobile Top Header -->
      <header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface-offwhite shadow-sm md:hidden">
          <div class="flex items-center gap-2 cursor-pointer" id="mobileBackBtn">
             <span class="material-symbols-outlined text-on-surface-variant">arrow_back</span>
             <h1 class="font-headline-lg-mobile text-[20px] font-black text-gold-metallic">
                 ${user.khata_id}
             </h1>
          </div>
      </header>
    `;

    const mainHtml = `
      <main class="max-w-container-max mx-auto px-4 md:px-margin-desktop py-8 md:py-12 mt-16 md:mt-0">
          <div class="mb-8 md:mb-12">
              <h2 class="font-display-lg text-[32px] md:text-[48px] text-charcoal-deep mb-2">Settings</h2>
              <p class="text-on-surface-variant font-body-lg text-[16px]">Manage your account preferences and ledger configurations.</p>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-gutter">
              <!-- Left Column: Profile & Basics -->
              <div class="lg:col-span-8 space-y-8">
                  <!-- Profile Section -->
                  <section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-surface-container-highest">
                      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-surface-container-highest gap-4">
                          <h3 class="font-headline-md text-[20px] md:text-headline-md text-charcoal-deep">Profile Information</h3>
                          <div class="flex items-center space-x-2 bg-surface-container-low px-4 py-2 rounded-lg w-fit">
                              <span class="text-on-surface-variant font-label-md text-[12px] uppercase tracking-wider">Khata ID</span>
                              <span class="font-data-mono text-[14px] text-charcoal-deep">${user.khata_id}</span>
                              <button class="text-gold-metallic hover:opacity-80 transition-opacity" title="Copy Khata ID" id="copyKhataId">
                                  <span class="material-symbols-outlined text-sm">content_copy</span>
                              </button>
                          </div>
                      </div>
                      
                      <div class="space-y-6">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div class="space-y-2 relative">
                                  <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider" for="fullName">Full Name</label>
                                  <input type="text" id="fullName" value="${fullName}" placeholder="Enter your full name" 
                                      class="w-full bg-transparent border-0 border-b border-outline-variant focus:border-gold-metallic focus:border-b-2 px-0 py-2 font-body-md text-[16px] text-charcoal-deep outline-none transition-colors" />
                              </div>
                              <div class="space-y-2 relative">
                                  <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider" for="businessName">Business Name</label>
                                  <input type="text" id="businessName" value="${businessName}" placeholder="Enter business name" 
                                      class="w-full bg-transparent border-0 border-b border-outline-variant focus:border-gold-metallic focus:border-b-2 px-0 py-2 font-body-md text-[16px] text-charcoal-deep outline-none transition-colors" />
                              </div>
                          </div>
                          
                          <div class="space-y-2 pt-4">
                              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider">Registered Email</label>
                              <p class="font-body-md text-[16px] text-on-surface-variant py-2">${user.email}</p>
                          </div>
                          
                          <div class="pt-6">
                              <button id="saveProfileBtn" class="bg-charcoal-deep text-on-primary px-8 py-3 rounded-lg font-label-md text-[14px] hover:bg-primary-container transition-colors shadow-sm w-full md:w-auto">
                                  Save Changes
                              </button>
                          </div>
                      </div>
                  </section>
                  
                  <!-- Ledger Configuration Section -->
                  <section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-surface-container-highest">
                      <h3 class="font-headline-md text-[20px] md:text-headline-md text-charcoal-deep mb-8 pb-4 border-b border-surface-container-highest">Ledger Preferences</h3>
                      <div class="space-y-8">
                          <!-- Default Purity -->
                          <div>
                              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-wider mb-4">Default Gold Purity</label>
                              <p class="text-sm text-on-surface-variant mb-4">Select the standard purity used for automated weight conversions.</p>
                              <div class="flex flex-wrap gap-4">
                                  <label class="cursor-pointer">
                                      <input type="radio" name="purity" value="100" class="peer sr-only" ${defaultPurity == '100' ? 'checked' : ''} />
                                      <div class="px-6 py-3 rounded-lg border border-outline-variant peer-checked:border-gold-metallic peer-checked:bg-gold-soft/20 peer-checked:text-charcoal-deep text-on-surface-variant font-label-md text-[14px] transition-all hover:bg-surface-container-low">
                                          24K Pure
                                      </div>
                                  </label>
                                  <label class="cursor-pointer">
                                      <input type="radio" name="purity" value="91.6" class="peer sr-only" ${defaultPurity == '91.6' ? 'checked' : ''} />
                                      <div class="px-6 py-3 rounded-lg border border-outline-variant peer-checked:border-gold-metallic peer-checked:bg-gold-soft/20 peer-checked:text-charcoal-deep text-on-surface-variant font-label-md text-[14px] transition-all hover:bg-surface-container-low">
                                          22K Standard
                                      </div>
                                  </label>
                                  <label class="cursor-pointer">
                                      <input type="radio" name="purity" value="75" class="peer sr-only" ${defaultPurity == '75' ? 'checked' : ''} />
                                      <div class="px-6 py-3 rounded-lg border border-outline-variant peer-checked:border-gold-metallic peer-checked:bg-gold-soft/20 peer-checked:text-charcoal-deep text-on-surface-variant font-label-md text-[14px] transition-all hover:bg-surface-container-low">
                                          18K Alloy
                                      </div>
                                  </label>
                              </div>
                          </div>
                          
                          <!-- Toggle Setting -->
                          <div class="flex items-center justify-between pt-6 border-t border-surface-container-highest">
                              <div>
                                  <h4 class="font-label-md text-[14px] text-charcoal-deep">Allow Payable Balances</h4>
                                  <p class="text-sm text-on-surface-variant mt-1">Enable to allow customer accounts to run into negative metal balances.</p>
                              </div>
                              <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                  <input type="checkbox" id="toggle-payable" class="peer sr-only" ${allowPayable ? 'checked' : ''}/>
                                  <div class="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-metallic cursor-pointer"></div>
                              </div>
                          </div>
                      </div>
                  </section>

                  <!-- Legal Section -->
                  <section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-surface-container-highest">
                      <h3 class="font-headline-md text-[20px] md:text-headline-md text-charcoal-deep mb-6 flex items-center">
                          <span class="material-symbols-outlined mr-2 text-on-surface-variant">gavel</span>
                          Legal & About
                      </h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <a href="#/legal/terms" class="flex items-center gap-3 p-4 rounded-lg border border-surface-container-highest hover:bg-surface-container-low transition-colors text-on-surface">
                              <span class="material-symbols-outlined text-on-surface-variant">description</span>
                              <span class="font-label-md text-[14px]">Terms of Service</span>
                          </a>
                          <a href="#/legal/privacy" class="flex items-center gap-3 p-4 rounded-lg border border-surface-container-highest hover:bg-surface-container-low transition-colors text-on-surface">
                              <span class="material-symbols-outlined text-on-surface-variant">policy</span>
                              <span class="font-label-md text-[14px]">Privacy Policy</span>
                          </a>
                          <a href="#/legal/cookies" class="flex items-center gap-3 p-4 rounded-lg border border-surface-container-highest hover:bg-surface-container-low transition-colors text-on-surface">
                              <span class="material-symbols-outlined text-on-surface-variant">cookie</span>
                              <span class="font-label-md text-[14px]">Cookie Policy</span>
                          </a>
                          <a href="#/legal/disclaimer" class="flex items-center gap-3 p-4 rounded-lg border border-surface-container-highest hover:bg-surface-container-low transition-colors text-on-surface">
                              <span class="material-symbols-outlined text-on-surface-variant">info</span>
                              <span class="font-label-md text-[14px]">Legal Disclaimer</span>
                          </a>
                      </div>
                  </section>
              </div>
              
              <!-- Right Column: Security & Actions -->
              <div class="lg:col-span-4 space-y-8">
                  <!-- Security Card -->
                  <section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm border border-surface-container-highest">
                      <h3 class="font-headline-md text-[20px] md:text-headline-md text-charcoal-deep mb-6 flex items-center">
                          <span class="material-symbols-outlined mr-2 text-gold-metallic">security</span>
                          Security
                      </h3>
                      <div class="space-y-4">
                          <button id="changePwBtn" class="w-full text-left px-4 py-3 rounded-lg border border-surface-container-highest hover:bg-surface-container-low transition-colors flex justify-between items-center group">
                              <div>
                                  <span class="block font-label-md text-[14px] text-charcoal-deep">Change Password</span>
                                  <span class="text-[12px] text-on-surface-variant">Update your credentials</span>
                              </div>
                              <span class="material-symbols-outlined text-on-surface-variant group-hover:text-gold-metallic transition-colors">chevron_right</span>
                          </button>
                      </div>
                  </section>
                  
                  <!-- Destructive Actions -->
                  <section class="pt-4 space-y-4">
                      <button id="logoutBtn" class="w-full flex items-center justify-center py-4 rounded-xl border border-outline-variant text-charcoal-deep font-label-md text-[14px] hover:bg-surface-container-low transition-colors bg-surface-container-lowest shadow-sm group">
                          <span class="material-symbols-outlined mr-2 group-hover:-translate-x-1 transition-transform">logout</span>
                          Logout Securely
                      </button>
                      
                      <button id="deleteAccBtn" class="w-full flex items-center justify-center py-4 rounded-xl border border-error-crimson/50 text-error-crimson font-label-md text-[14px] hover:bg-error-container/50 transition-colors bg-surface-container-lowest shadow-sm group">
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
      <nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-offwhite border-t border-outline-variant shadow-sm md:hidden pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
          <a href="#/dashboard" class="flex flex-col items-center justify-center text-on-surface-variant p-2 font-label-md text-[10px]">
              <span class="material-symbols-outlined mb-1">dashboard</span>
              Dashboard
          </a>
          <a href="#/profile" class="flex flex-col items-center justify-center bg-gold-soft text-gold-metallic rounded-xl px-6 py-2 font-label-md text-[10px] scale-95 transition-transform border border-gold-metallic/20">
              <span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 1;">settings</span>
              Settings
          </a>
      </nav>
    `;

    container.innerHTML = `
      <div class="bg-background text-on-surface font-body-md antialiased min-h-screen">
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
        navigator.clipboard.writeText(user.khata_id);
        showToast('Khata ID copied to clipboard', 'success');
    });

    // Handle Purity Radios
    document.querySelectorAll('input[name="purity"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            defaultPurity = e.target.value;
            updateProfile({ default_purity: defaultPurity });
            showToast('Default purity updated', 'success');
        });
    });

    // Allow Payable toggle
    const togglePayable = document.getElementById('toggle-payable');
    togglePayable?.addEventListener('change', (e) => {
        const div = e.target.nextElementSibling;
        allowPayable = e.target.checked;
        showToast(allowPayable ? 'Payable balances allowed' : 'Payable balances disabled', 'success');
        // If we want to persist, updateProfile({ allow_payable: allowPayable })
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
        const id = prompt(`This action cannot be undone. Type your Khata ID (@${user.khata_id}) to confirm deletion:`);
        if (id === user.khata_id) {
            deleteAccount();
            window.location.hash = '#/auth';
        } else if (id !== null) {
            showToast('Khata ID does not match. Account not deleted.', 'error');
        }
    });
  }

  render();
}

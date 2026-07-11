import { getCurrentUser } from '../services/auth.service.js';
import { validatePromoCode, redeemPromoCode } from '../services/promo.service.js';
import { showToast } from '../components/toast.js';
import { formatDate } from '../utils/formatters.js';

// Plan DB
const STORAGE_KEY = 'sk_user_plans';

export function getUserPlan(userId) {
  const plans = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return plans[userId] || 'free'; 
}

export function setPlan(userId, plan) {
  const plans = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  plans[userId] = plan;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function hasCompletedOnboarding() {
  const user = getCurrentUser();
  if (!user) return false;
  // If plan is 'pro' or 'free_trial' or whatever, they have completed.
  // We'll say 'free' means they are on the free plan which is fine.
  return true;
}

export function renderPricingPage(container) {
  const user = getCurrentUser();
  if (!user) {
    window.location.hash = '#/auth';
    return;
  }

  let showPromoForm = false;
  let promoCode = '';
  let promoResult = null;
  let promoLoading = false;

  function render() {
    container.innerHTML = `
      <div class="font-body-md text-on-surface antialiased bg-background selection:bg-gold-soft selection:text-charcoal-deep min-h-screen pb-24 md:pb-0 pt-20">
        <!-- TopNavBar -->
        <nav class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm transition-transform duration-150">
            <div class="flex justify-between items-center h-20 px-4 md:px-margin-desktop max-w-container-max mx-auto">
                <div class="flex items-center gap-4">
                   <button id="navBackBtn" class="text-on-surface-variant hover:text-primary transition-colors">
                      <span class="material-symbols-outlined">arrow_back</span>
                   </button>
                   <div class="font-headline-md text-headline-md font-bold text-primary">Sunarkhata</div>
                </div>
                <!-- Desktop Nav -->
                <div class="hidden md:flex space-x-8">
                    <a class="font-body-md text-body-md text-on-surface-variant hover:text-gold-metallic transition-colors duration-200" href="#">Product</a>
                    <a class="font-body-md text-body-md text-primary border-b-2 border-gold-metallic pb-1 hover:text-gold-metallic transition-colors duration-200" href="#">Solutions</a>
                    <a class="font-body-md text-body-md text-on-surface-variant hover:text-gold-metallic transition-colors duration-200" href="#">Benefits</a>
                    <a class="font-body-md text-body-md text-on-surface-variant hover:text-gold-metallic transition-colors duration-200" href="#">How it Works</a>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="hidden md:inline-flex items-center justify-center h-10 px-6 font-label-md text-label-md bg-charcoal-deep text-on-primary rounded transition hover:opacity-90">Start 30-Day Trial</button>
                    <button class="md:hidden text-primary">
                        <span class="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="pt-8 md:pt-16 pb-24 px-4 md:px-margin-desktop max-w-container-max mx-auto">
            <!-- Header -->
            <header class="text-center mb-12 md:mb-24">
                <h1 class="font-display-lg text-[32px] md:text-display-lg text-primary mb-6 max-w-3xl mx-auto leading-tight">Precision ledgering, priced for modern tradition.</h1>
                <p class="font-body-lg text-[16px] md:text-body-lg text-on-surface-variant max-w-2xl mx-auto">Select a plan that scales with your craftsmanship. Absolute accuracy, guaranteed.</p>
            </header>

            <!-- Pricing Cards Bento Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 md:mb-24 items-center">
                
                <!-- Free Trial -->
                <div class="bg-surface-offwhite rounded-xl p-8 border border-outline-variant/30 shadow-[0_8px_24px_rgba(26,28,30,0.04)] h-full md:h-[90%] flex flex-col relative z-10">
                    <h3 class="font-headline-md text-headline-md text-on-surface mb-2">30-Day Free Trial</h3>
                    <div class="mb-6">
                        <span class="font-display-lg text-display-lg text-primary">₹0</span>
                        <span class="font-body-md text-body-md text-on-surface-variant">/mo</span>
                    </div>
                    <p class="font-body-md text-body-md text-on-surface-variant mb-8 flex-grow">Experience the full power of Sunarkhata risk-free for 30 days.</p>
                    <button id="btnFree" class="w-full h-12 flex items-center justify-center border border-charcoal-deep font-label-md text-label-md text-charcoal-deep rounded transition hover:bg-surface-variant">Start 30-Day Free Trial</button>
                </div>

                <!-- Yearly (Recommended) -->
                <div class="bg-surface-offwhite rounded-xl p-10 shadow-[0_8px_24px_rgba(26,28,30,0.04)] border-2 border-gold-metallic relative z-20 md:-my-8 md:scale-105 transform transition-transform hover:scale-[1.07]">
                    <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gold-metallic text-charcoal-deep px-4 py-1 rounded-full font-label-md text-[12px] uppercase tracking-wider font-bold whitespace-nowrap">
                        Recommended - Best Value
                    </div>
                    <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Yearly</h3>
                    <div class="mb-2">
                        <span class="font-display-lg text-display-lg text-primary">₹499</span>
                        <span class="font-body-md text-body-md text-on-surface-variant">/mo</span>
                    </div>
                    <div class="font-label-md text-[12px] text-gold-metallic mb-6">Billed ₹5,988 annually (Save 37%)</div>
                    <p class="font-body-md text-body-md text-on-surface-variant mb-8">The complete solution for dedicated jewelers demanding uninterrupted precision.</p>
                    <button id="btnYearly" class="w-full h-12 flex items-center justify-center bg-charcoal-deep text-on-primary font-label-md text-label-md rounded transition hover:opacity-90">Subscribe Yearly</button>
                    <p class="text-center font-label-md text-[12px] text-on-surface-variant mt-4">Available after trial</p>
                </div>

                <!-- Monthly -->
                <div class="bg-surface-offwhite rounded-xl p-8 border border-outline-variant/30 shadow-[0_8px_24px_rgba(26,28,30,0.04)] h-full md:h-[90%] flex flex-col relative z-10">
                    <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Monthly</h3>
                    <div class="mb-6">
                        <span class="font-display-lg text-display-lg text-primary">₹799</span>
                        <span class="font-body-md text-body-md text-on-surface-variant">/mo</span>
                    </div>
                    <p class="font-body-md text-body-md text-on-surface-variant mb-8 flex-grow">Flexible month-to-month access for growing businesses.</p>
                    <button id="btnMonthly" class="w-full h-12 flex items-center justify-center border border-charcoal-deep font-label-md text-label-md text-charcoal-deep rounded transition hover:bg-surface-variant">Subscribe Monthly</button>
                    <p class="text-center font-label-md text-[12px] text-on-surface-variant mt-4">Available after trial</p>
                </div>

            </div>

            <!-- Promo Code Section -->
            <div class="max-w-md mx-auto mb-24">
                ${!showPromoForm ? `
                  <button id="promoToggle" class="w-full text-center text-on-surface-variant font-label-md text-[14px] hover:text-gold-metallic transition-colors">
                      Have a Promo Code?
                  </button>
                ` : `
                  <div class="flex gap-2">
                      <input type="text" id="promoInput" value="${promoCode}" placeholder="Enter Promo Code" 
                          class="flex-1 bg-surface-container-lowest border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg px-4 py-3 font-data-mono text-primary outline-none uppercase transition-colors" />
                      <button id="promoApplyBtn" ${(promoCode.trim().length === 0 || promoLoading) ? 'disabled' : ''} 
                          class="bg-gold-metallic text-charcoal-deep font-bold px-6 py-3 rounded-lg disabled:opacity-50 transition-opacity">
                          ${promoLoading ? '...' : 'Apply'}
                      </button>
                  </div>
                `}
                
                ${promoResult ? `
                  <div class="mt-4 p-4 rounded-lg ${promoResult.type === 'success' ? 'bg-success-emerald/10 border border-success-emerald/30 text-success-emerald' : 'bg-error-crimson/10 border border-error-crimson/30 text-error-crimson'} text-sm font-body-md">
                      <div class="font-bold mb-1">${promoResult.title}</div>
                      ${promoResult.body ? `<div>${promoResult.body}</div>` : ''}
                  </div>
                ` : ''}
            </div>

            <!-- Comprehensive Features List -->
            <div class="max-w-4xl mx-auto">
                <h2 class="font-headline-lg text-[24px] md:text-headline-lg text-primary text-center mb-12">All Plans Include Complete Access</h2>
                <div class="bg-surface-offwhite rounded-xl border border-outline-variant/30 shadow-[0_8px_24px_rgba(26,28,30,0.04)] p-8 md:p-12">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <!-- Feature Group 1 -->
                        <div>
                            <h4 class="font-label-md text-[14px] text-gold-metallic uppercase mb-6 flex items-center gap-2">
                                <span class="material-symbols-outlined text-[20px]">account_balance</span>
                                Core Ledgering
                            </h4>
                            <ul class="space-y-4">
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Dual Ledger System</span>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Mutual &amp; Individual Accounts</span>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Receivable &amp; Payable Tracking</span>
                                </li>
                            </ul>
                        </div>
                        <!-- Feature Group 2 -->
                        <div>
                            <h4 class="font-label-md text-[14px] text-gold-metallic uppercase mb-6 flex items-center gap-2">
                                <span class="material-symbols-outlined text-[20px]">handshake</span>
                                Settlement Tools
                            </h4>
                            <ul class="space-y-4">
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Adjust in Gold</span>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Cash Settlement</span>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Book Gold Rate</span>
                                </li>
                            </ul>
                        </div>
                        <!-- Feature Group 3 -->
                        <div>
                            <h4 class="font-label-md text-[14px] text-gold-metallic uppercase mb-6 flex items-center gap-2">
                                <span class="material-symbols-outlined text-[20px]">security</span>
                                Security &amp; Audit
                            </h4>
                            <ul class="space-y-4">
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Comprehensive Audit Trail</span>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Strict 1-Hour Modification Limit</span>
                                </li>
                            </ul>
                        </div>
                        <!-- Feature Group 4 -->
                        <div>
                            <h4 class="font-label-md text-[14px] text-gold-metallic uppercase mb-6 flex items-center gap-2">
                                <span class="material-symbols-outlined text-[20px]">devices</span>
                                Platform Access
                            </h4>
                            <ul class="space-y-4">
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Progressive Web App (PWA)</span>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="material-symbols-outlined text-success-emerald text-[20px] mt-0.5">check_circle</span>
                                    <span class="font-body-md text-body-md text-on-surface">Seamless Mobile &amp; Desktop Sync</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="w-full py-12 bg-charcoal-deep text-on-primary mt-12">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-margin-desktop max-w-container-max mx-auto">
                <div class="flex flex-col gap-4">
                    <div class="font-headline-md text-headline-md font-bold text-gold-metallic">Sunarkhata</div>
                    <div class="font-body-md text-body-md text-on-primary/70">© 2024 Sunarkhata. Modern Tradition in Jewellery Ledgering.</div>
                </div>
                <div class="flex flex-col gap-4">
                    <a class="font-body-md text-body-md text-on-primary/70 hover:text-gold-soft transition-colors" href="#">Support: support@sunarkhata.com</a>
                    <a class="font-body-md text-body-md text-on-primary/70 hover:text-gold-soft transition-colors" href="#">Contact Us</a>
                </div>
                <div class="flex flex-col gap-4">
                    <a class="font-body-md text-body-md text-on-primary/70 hover:text-gold-soft transition-colors" href="#">Terms of Service</a>
                    <a class="font-body-md text-body-md text-on-primary/70 hover:text-gold-soft transition-colors" href="#">Privacy Policy</a>
                    <a class="font-body-md text-body-md text-on-primary/70 hover:text-gold-soft transition-colors" href="#">Security</a>
                </div>
            </div>
        </footer>
      </div>
    `;
    attachListeners();
  }

  function attachListeners() {
    document.getElementById('navBackBtn')?.addEventListener('click', () => window.location.hash = '#/dashboard');

    document.getElementById('promoToggle')?.addEventListener('click', () => { 
        showPromoForm = true; 
        render(); 
        setTimeout(() => document.getElementById('promoInput')?.focus(), 50); 
    });
    
    document.getElementById('promoInput')?.addEventListener('input', (e) => {
      promoCode = e.target.value;
      promoResult = null;
      const btn = document.getElementById('promoApplyBtn');
      if (btn) btn.disabled = promoCode.trim().length === 0;
    });

    document.getElementById('promoInput')?.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') document.getElementById('promoApplyBtn')?.click(); 
    });

    document.getElementById('promoApplyBtn')?.addEventListener('click', () => {
      promoLoading = true;
      render();
      setTimeout(() => {
        const result = validatePromoCode(promoCode, user.id);
        if (result.valid) {
          const expiresAt = redeemPromoCode(user.id);
          promoResult = { type: 'success', title: 'Promo Code Applied Successfully!', body: `You have unlocked SunarKhata Pro FREE. Expires: ${formatDate(new Date(expiresAt))}` };
          promoLoading = false;
          render();
          showToast('Pro activated!', 'success');
          setTimeout(() => { window.location.hash = '#/dashboard'; window.dispatchEvent(new CustomEvent('auth-change')); }, 2000);
        } else {
          promoResult = { type: 'error', title: result.message, body: '' };
          promoLoading = false;
          render();
        }
      }, 800);
    });

    document.getElementById('btnFree')?.addEventListener('click', () => {
      setPlan(user.id, 'free');
      showToast('Free trial activated!', 'success');
      window.location.hash = '#/dashboard';
      window.dispatchEvent(new CustomEvent('auth-change'));
    });

    const triggerPayment = () => {
      showPromoForm = true;
      promoResult = null;
      render();
      setTimeout(() => document.getElementById('promoInput')?.focus(), 50);
      showToast('Enter promo code or payment coming soon!', 'info');
    };

    document.getElementById('btnYearly')?.addEventListener('click', triggerPayment);
    document.getElementById('btnMonthly')?.addEventListener('click', triggerPayment);
  }

  render();
}

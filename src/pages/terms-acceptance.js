import { LEGAL_PAGES } from './legal.js';
import { acceptTerms, getCurrentUser } from '../services/auth.service.js';
import { CURRENT_TERMS_VERSION } from '../utils/constants.js';

export function renderTermsAcceptancePage(container) {
  const termsContent = LEGAL_PAGES.terms.content;
  const privacyContent = LEGAL_PAGES.privacy.content;

  container.innerHTML = `
    <div class="min-h-screen bg-surface-offwhite text-on-background flex flex-col font-body-md overflow-hidden h-screen w-full">
      <!-- Header -->
      <div class="sticky top-0 w-full bg-surface/90 backdrop-blur-md px-4 py-3 z-20 flex justify-center items-center border-b border-surface-variant shadow-sm">
        <h1 class="font-display-md text-[18px] text-primary font-bold tracking-wide">Terms & Policy</h1>
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto bg-surface pb-[100px] relative">
        <div class="max-w-[800px] mx-auto px-4 py-6">
          <header class="mb-6 text-center">
            <h2 class="text-xl font-bold text-on-surface mb-2">Welcome to SunarKhata</h2>
            <p class="text-sm text-on-surface-variant">Please read and accept our Terms & Conditions and Privacy Policy to continue.</p>
          </header>

          <div class="bg-surface-container-low rounded-lg p-5 border border-surface-variant shadow-sm space-y-8">
            
            <section class="prose prose-sm prose-primary max-w-none">
              <h3 class="text-lg font-bold text-primary mb-4 pb-2 border-b border-surface-variant">Terms & Conditions</h3>
              ${termsContent}
            </section>

            <section class="prose prose-sm prose-primary max-w-none">
              <h3 class="text-lg font-bold text-primary mb-4 pb-2 border-b border-surface-variant mt-8">Privacy Policy</h3>
              ${privacyContent}
            </section>

          </div>
          
          <div id="termsError" class="mt-4 p-3 bg-error-crimson/10 text-error-crimson border border-error-crimson rounded-sm text-sm font-semibold hidden">
            <!-- Error message goes here -->
          </div>
        </div>
      </main>

      <!-- Sticky Footer / Action Area -->
      <div class="fixed bottom-0 left-0 w-full bg-white border-t border-surface-variant p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div class="max-w-[800px] mx-auto">
          <button id="acceptTermsBtn" class="w-full bg-primary hover:bg-black text-on-primary py-3.5 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 text-[15px]">
            I AGREE TO THE TERMS & POLICY
          </button>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById('acceptTermsBtn');
  const errorBox = document.getElementById('termsError');

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Accepting...';
    errorBox.classList.add('hidden');
    errorBox.textContent = '';

    try {
      await acceptTerms(CURRENT_TERMS_VERSION);
      // Wait a tick for localstorage event or state propagation, then navigate directly to dashboard
      setTimeout(() => {
        window.location.hash = '#/dashboard';
      }, 100);
    } catch (err) {
      console.error(err);
      errorBox.textContent = err.message || 'Failed to persist terms acceptance. Please try again.';
      errorBox.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = 'I AGREE TO THE TERMS & POLICY';
    }
  });
}

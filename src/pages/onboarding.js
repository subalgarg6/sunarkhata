import { completeOnboarding, checkUsernameAvailability } from '../services/auth.service.js';
import { validateUsername } from '../utils/validators.js';
import { debounce } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';
import { MAX_ACCOUNT_NAME_LENGTH } from '../utils/constants.js';

export function renderOnboarding(container) {
  let state = {
    fullName: '',
    username: '',
    usernameStatus: '',
    businessName: '',
    loading: false,
    error: ''
  };

  const checkAvailability = debounce(async (id) => {
    const statusEl = document.getElementById('goUsernameStatusIcon');
    if (!id || id.length < 4) { 
        state.usernameStatus = ''; 
        if (statusEl) statusEl.innerHTML = ''; 
        return; 
    }
    const v = validateUsername(id);
    if (!v.valid) { 
        state.usernameStatus = 'invalid'; 
        if (statusEl) statusEl.innerHTML = `<span class="text-error-crimson text-xs mt-1 block">${v.error || 'Invalid'}</span>`; 
        return; 
    }
    state.usernameStatus = 'checking';
    if (statusEl) statusEl.innerHTML = '<span class="text-outline text-xs mt-1 block">Checking...</span>';
    try {
      const available = await checkUsernameAvailability(id);
      state.usernameStatus = available ? 'available' : 'taken';
      
      if (statusEl) {
        if (available) {
            statusEl.innerHTML = '<span class="text-success-emerald text-xs mt-1 block">Available</span>';
        } else {
            statusEl.innerHTML = '<span class="text-error-crimson text-xs mt-1 block">Already taken</span>';
        }
      }
    } catch (e) {
      state.usernameStatus = '';
      if (statusEl) statusEl.innerHTML = '';
    }
  }, 500);

  function render() {
    container.innerHTML = `
      <div class="bg-background text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 font-body-md">
        <main class="w-full max-w-[460px] relative">
            <div class="bg-surface-container-lowest rounded-[20px] border border-outline-variant/30 shadow-[0_8px_24px_rgba(26,28,30,0.04)] p-8 md:p-10 w-full">
                
                <div class="flex flex-col items-center mb-10">
                    <h1 class="font-headline-md text-headline-md text-charcoal-deep tracking-tight font-bold">Almost Done!</h1>
                    <p class="text-outline text-sm mt-2 text-center">Please choose a unique username to complete your account setup.</p>
                </div>

                <form class="space-y-5" id="form-onboarding">
                    ${state.error ? `<div class="bg-error-container text-on-error-container p-3 rounded text-sm text-center border border-error-crimson/20">${state.error}</div>` : ''}
                    
                    <div class="space-y-2">
                        <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Full Name</label>
                        <input id="goName" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="e.g. Ramesh Kumar" required type="text" value="${state.fullName}" maxlength="${MAX_ACCOUNT_NAME_LENGTH}">
                    </div>

                    <div class="space-y-2">
                        <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Choose Username</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span class="text-on-surface-variant/60 font-medium">@</span>
                            </div>
                            <input id="goUsername" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 pl-10 pr-4 font-body-md text-on-surface outline-none transition-colors" placeholder="your_username" required type="text" value="${state.username}">
                        </div>
                        <div id="goUsernameStatusIcon"></div>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Business Name (Optional)</label>
                        <input id="goBusiness" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="e.g. Agarwal Jeweller" type="text" value="${state.businessName}" maxlength="${MAX_ACCOUNT_NAME_LENGTH}">
                    </div>
                    
                    <button type="submit" ${(state.loading || state.usernameStatus === 'taken' || state.usernameStatus === 'invalid') ? 'disabled' : ''} class="w-full bg-gold-metallic hover:brightness-105 text-white font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 mt-6 shadow-[0_4px_14px_rgba(201,168,76,0.39)] disabled:opacity-50">
                        ${state.loading ? 'Completing Setup...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </main>
      </div>
    `;
    attachListeners();
  }

  function attachListeners() {
    const goName = document.getElementById('goName');
    const goUsername = document.getElementById('goUsername');
    const goBusiness = document.getElementById('goBusiness');

    goName?.addEventListener('input', e => { state.fullName = e.target.value; });

    goUsername?.addEventListener('input', e => {
        let val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        e.target.value = val;
        state.username = val;
        checkAvailability(val);
    });
    
    goBusiness?.addEventListener('input', e => { state.businessName = e.target.value; });

    document.getElementById('form-onboarding')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        state.error = '';
        
        if (state.usernameStatus === 'taken' || state.usernameStatus === 'invalid') return;
        if (state.usernameStatus === 'checking') {
           state.error = 'Please wait, checking username availability...'; render(); return;
        }
        if (state.usernameStatus === '') {
            state.error = 'Please enter a valid username'; render(); return;
        }

        state.loading = true;
        render();
        try {
            await completeOnboarding(state.fullName, state.username, state.businessName);
            showToast('Account setup complete!', 'success');
            // Routing will be handled automatically by auth-change listener, 
            // but we can proactively trigger it here.
            window.dispatchEvent(new CustomEvent('auth-change'));
        } catch (err) {
            state.error = err.message || 'Setup failed';
            state.loading = false;
            render();
        }
    });
  }

  render();
}

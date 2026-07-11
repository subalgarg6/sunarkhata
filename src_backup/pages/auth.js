import { signUp, signIn, checkKhataIdAvailability } from '../services/auth.service.js';
import { validateKhataId, validatePassword, passwordsMatch } from '../utils/validators.js';
import { debounce } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';

export function renderAuthPage(container) {
  let activeTab = 'signin';
  
  let signupState = { 
      khataId: '', khataIdStatus: '', 
      fullName: '', businessName: '', 
      password: '', confirmPassword: '', 
      showPw: false, showCpw: false, 
      loading: false, error: '' 
  };
  let signinState = { 
      khataId: '', password: '', 
      showPw: false, loading: false, error: '' 
  };

  const checkAvailability = debounce(async (id) => {
    const statusEl = document.getElementById('khataIdStatusIcon');
    if (!id || id.length < 4) { 
        signupState.khataIdStatus = ''; 
        if (statusEl) statusEl.innerHTML = ''; 
        return; 
    }
    const v = validateKhataId(id);
    if (!v.valid) { 
        signupState.khataIdStatus = 'invalid'; 
        if (statusEl) statusEl.innerHTML = `<span class="text-error-crimson text-xs mt-1 block">?O ${v.error || 'Invalid'}</span>`; 
        return; 
    }
    signupState.khataIdStatus = 'checking';
    if (statusEl) statusEl.innerHTML = '<span class="text-outline text-xs mt-1 block">?3 Checking...</span>';
    try {
      const available = await checkKhataIdAvailability(id);
      signupState.khataIdStatus = available ? 'available' : 'taken';
      
      if (statusEl) {
        if (available) {
            statusEl.innerHTML = '<span class="text-success-emerald text-xs mt-1 block">o. Available</span>';
        } else {
            statusEl.innerHTML = '<span class="text-error-crimson text-xs mt-1 block">?O Already taken</span>';
        }
      }
    } catch (e) {
      signupState.khataIdStatus = '';
      if (statusEl) statusEl.innerHTML = '';
    }
  }, 500);

  function render() {
    container.innerHTML = `
      <div class="bg-background text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 font-body-md">
        <main class="w-full max-w-[460px] relative">
            <div class="bg-surface-container-lowest rounded-[20px] border border-outline-variant/30 shadow-[0_8px_24px_rgba(26,28,30,0.04)] p-8 md:p-10 w-full">
                
                <!-- Logo Header -->
                <div class="flex flex-col items-center mb-10">
                    <img alt="Sunarkhata Logo" class="w-20 h-20 object-contain mb-4" src="https://lh3.googleusercontent.com/aida/AP1WRLv1TaNwFL6SSoyeCrNwSPLftIO3jl8kJAkfeWvWmqIub_M1h_bDDy5uC3ITdUehJWaRIUZ64-QJ-7rgBnuZ9hnfw8QkhEjfF_rfJgWt6gJ0fNmKpt8VmUmKOVQNJWkc8YfbIYOjcNEAbgbGSvP-Dh-UHtVfVBTPFQOwR8faQLZwtYNScNv94odE6HeAVE4Kcp8zKq7gS68vv4XFqDrmKBoPfQtNe7hRd0WdH6G3BqzDpk7Y3fxmQv5_fIQ">
                    <h1 class="font-headline-md text-headline-md text-charcoal-deep tracking-tight font-bold">Sunarkhata</h1>
                    <p class="text-outline text-sm mt-1">Your Digital Gold Ledger</p>
                </div>

                <!-- Tabs -->
                <div class="flex mb-8 w-full border-b border-outline-variant/30">
                    <button class="flex-1 py-3 text-center font-label-md text-label-md transition-colors duration-200 ${activeTab === 'signin' ? 'border-b-2 border-gold-metallic text-gold-metallic font-bold' : 'text-on-surface-variant hover:text-on-surface'}" id="tab-signin">
                        Sign In
                    </button>
                    <button class="flex-1 py-3 text-center font-label-md text-label-md transition-colors duration-200 ${activeTab === 'signup' ? 'border-b-2 border-gold-metallic text-gold-metallic font-bold' : 'text-on-surface-variant hover:text-on-surface'}" id="tab-signup">
                        Create Account
                    </button>
                </div>

                ${activeTab === 'signin' ? renderSignIn() : renderSignUp()}

                <!-- Trust Badge & Footer-->
                <div class="mt-8 pt-6 border-t border-outline-variant/20 text-center flex flex-col items-center">
                    <div class="flex items-center gap-2 text-outline mb-6">
                        <span class="material-symbols-outlined text-gold-metallic text-[16px]">lock</span>
                        <span class="text-[12px]">256-bit encrypted · Your data stays yours</span>
                    </div>
                    <div class="flex gap-4 text-[12px] text-outline font-medium mb-4">
                        <a href="#/legal/terms" class="hover:text-on-surface transition-colors">Terms</a>
                        <a href="#/legal/privacy" class="hover:text-on-surface transition-colors">Privacy</a>
                        <a href="#/legal/disclaimer" class="hover:text-on-surface transition-colors">Disclaimer</a>
                        <a href="#/legal/refund" class="hover:text-on-surface transition-colors">Refund</a>
                    </div>
                    <p class="text-[10px] text-outline/60 leading-relaxed max-w-[280px]">
                        SunarKhata is a personal record-keeping tool. Records are not legal documents.
                    </p>
                </div>

            </div>
        </main>
      </div>
    `;

    attachListeners();
  }

  function renderSignIn() {
    return `
      <form class="space-y-6" id="form-signin">
          ${signinState.error ? `<div class="bg-error-container text-on-error-container p-3 rounded text-sm text-center border border-error-crimson/20">${signinState.error}</div>` : ''}
          
          <div class="space-y-2">
              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Khata ID</label>
              <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span class="text-on-surface-variant/60 font-medium">@</span>
                  </div>
                  <input id="siKhataId" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 pl-10 pr-4 font-body-md text-on-surface outline-none transition-colors" placeholder="your_khata_id" required type="text" value="${signinState.khataId}">
              </div>
          </div>
          
          <div class="space-y-2">
              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Password</label>
              <div class="relative">
                  <input id="siPassword" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="••••••••••••" required type="${signinState.showPw ? 'text' : 'password'}" value="${signinState.password}">
                  <div class="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer" id="siTogglePw">
                      <span class="material-symbols-outlined text-outline hover:text-on-surface transition-colors">${signinState.showPw ? 'visibility_off' : 'visibility'}</span>
                  </div>
              </div>
          </div>
          
          <div class="flex justify-end">
              <a class="text-gold-metallic hover:text-gold-metallic/80 text-sm font-medium transition-colors" href="#">Forgot password?</a>
          </div>
          
          <button type="submit" ${signinState.loading ? 'disabled' : ''} class="w-full bg-gold-metallic hover:brightness-105 text-white font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_14px_rgba(201,168,76,0.39)] disabled:opacity-50">
              ${signinState.loading ? 'Signing In...' : 'Sign In'}
          </button>
      </form>
    `;
  }

  function renderSignUp() {
    return `
      <form class="space-y-5" id="form-signup">
          ${signupState.error ? `<div class="bg-error-container text-on-error-container p-3 rounded text-sm text-center border border-error-crimson/20">${signupState.error}</div>` : ''}
          
          <div class="space-y-2">
              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Full Name</label>
              <input id="suName" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="e.g. Ramesh Kumar" required type="text" value="${signupState.fullName}">
          </div>
          
          <div class="space-y-2">
              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Business Name (Optional)</label>
              <input id="suBusiness" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="e.g. Sharma Jewellers" type="text" value="${signupState.businessName}">
          </div>
          
          <div class="space-y-2">
              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Khata ID</label>
              <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span class="text-on-surface-variant/60 font-medium">@</span>
                  </div>
                  <input id="suKhataId" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 pl-10 pr-4 font-body-md text-on-surface outline-none transition-colors" placeholder="your_khata_id" required type="text" value="${signupState.khataId}">
              </div>
              <div id="khataIdStatusIcon"></div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2 relative">
                  <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Password</label>
                  <input id="suPassword" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="••••••••" required type="${signupState.showPw ? 'text' : 'password'}" value="${signupState.password}">
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer mt-7" id="suTogglePw">
                      <span class="material-symbols-outlined text-[20px] text-outline hover:text-on-surface transition-colors">${signupState.showPw ? 'visibility_off' : 'visibility'}</span>
                  </div>
              </div>
              
              <div class="space-y-2 relative">
                  <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Confirm Password</label>
                  <input id="suConfirmPw" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="••••••••" required type="${signupState.showCpw ? 'text' : 'password'}" value="${signupState.confirmPassword}">
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer mt-7" id="suToggleCpw">
                      <span class="material-symbols-outlined text-[20px] text-outline hover:text-on-surface transition-colors">${signupState.showCpw ? 'visibility_off' : 'visibility'}</span>
                  </div>
              </div>
          </div>
          
          ${(() => {
              const pv = validatePassword(signupState.password);
              return `
                <div class="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    <div id="req-len" class="flex items-center gap-1.5 text-[12px] font-medium transition-colors ${pv.length ? 'text-success-emerald' : 'text-on-surface-variant'}">
                        <span id="req-len-icon" class="material-symbols-outlined text-[14px]">${pv.length ? 'check_circle' : 'radio_button_unchecked'}</span>
                        <span>8 - 16 characters</span>
                    </div>
                    <div id="req-up" class="flex items-center gap-1.5 text-[12px] font-medium transition-colors ${pv.uppercase ? 'text-success-emerald' : 'text-on-surface-variant'}">
                        <span id="req-up-icon" class="material-symbols-outlined text-[14px]">${pv.uppercase ? 'check_circle' : 'radio_button_unchecked'}</span>
                        <span>At least 1 uppercase letter</span>
                    </div>
                    <div id="req-num" class="flex items-center gap-1.5 text-[12px] font-medium transition-colors ${pv.number ? 'text-success-emerald' : 'text-on-surface-variant'}">
                        <span id="req-num-icon" class="material-symbols-outlined text-[14px]">${pv.number ? 'check_circle' : 'radio_button_unchecked'}</span>
                        <span>At least 1 number</span>
                    </div>
                </div>
              `;
          })()}
          
          <button type="submit" ${(signupState.loading || signupState.khataIdStatus === 'taken' || signupState.khataIdStatus === 'invalid') ? 'disabled' : ''} class="w-full bg-gold-metallic hover:brightness-105 text-white font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 mt-6 shadow-[0_4px_14px_rgba(201,168,76,0.39)] disabled:opacity-50">
              ${signupState.loading ? 'Creating Account...' : 'Create My Khata'}
          </button>
          
          <div class="text-center mt-[12px]">
              <p class="font-[Inter] text-[13px] font-normal leading-[20px] text-[#6B6B66]">Paid plans may range from ₹500–₹800/month after your free trial.</p>
              <p class="font-[Inter] text-[11px] font-normal leading-[16px] text-[#8A8A85] mt-[4px] whitespace-normal">(*Indicative pricing only. This is a rough estimate and does not constitute a final price, offer, or commitment. Final plans and pricing may vary.)</p>
          </div>
      </form>
    `;
  }

  function attachListeners() {
    document.getElementById('tab-signin')?.addEventListener('click', () => { activeTab = 'signin'; render(); });
    document.getElementById('tab-signup')?.addEventListener('click', () => { activeTab = 'signup'; render(); });

    if (activeTab === 'signin') {
        const siKhataId = document.getElementById('siKhataId');
        const siPassword = document.getElementById('siPassword');
        
        siKhataId?.addEventListener('input', e => { signinState.khataId = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); e.target.value = signinState.khataId; });
        siPassword?.addEventListener('input', e => { signinState.password = e.target.value; });
        
        document.getElementById('siTogglePw')?.addEventListener('click', () => { signinState.showPw = !signinState.showPw; render(); });
        
        document.getElementById('form-signin')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            signinState.error = '';
            signinState.loading = true;
            render();
            try {
                await signIn(signinState.khataId, signinState.password);
                showToast('Welcome back!', 'success');
                window.location.hash = '#/dashboard';
                window.dispatchEvent(new CustomEvent('auth-change'));
            } catch (err) {
                signinState.error = err.message || 'Login failed';
                signinState.loading = false;
                render();
            }
        });
    } else {
        const suKhataId = document.getElementById('suKhataId');
        const suName = document.getElementById('suName');
        const suBusiness = document.getElementById('suBusiness');
        const suPassword = document.getElementById('suPassword');
        const suConfirmPw = document.getElementById('suConfirmPw');

        suKhataId?.addEventListener('input', e => {
            let val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
            e.target.value = val;
            signupState.khataId = val;
            checkAvailability(val);
        });
        suName?.addEventListener('input', e => { signupState.fullName = e.target.value; });
        suBusiness?.addEventListener('input', e => { signupState.businessName = e.target.value; });
        suPassword?.addEventListener('input', e => { 
            signupState.password = e.target.value; 
            const pv = validatePassword(signupState.password);
            const updateReq = (id, valid) => {
                const el = document.getElementById(id);
                const icon = document.getElementById(id + '-icon');
                if (el && icon) {
                    el.className = valid ? 'flex items-center gap-1.5 text-[12px] font-medium transition-colors text-success-emerald' : 'flex items-center gap-1.5 text-[12px] font-medium transition-colors text-on-surface-variant';
                    icon.textContent = valid ? 'check_circle' : 'radio_button_unchecked';
                }
            };
            updateReq('req-len', pv.length);
            updateReq('req-up', pv.uppercase);
            updateReq('req-num', pv.number);
        });
        suConfirmPw?.addEventListener('input', e => { signupState.confirmPassword = e.target.value; });
        
        document.getElementById('suTogglePw')?.addEventListener('click', () => { signupState.showPw = !signupState.showPw; render(); });
        document.getElementById('suToggleCpw')?.addEventListener('click', () => { signupState.showCpw = !signupState.showCpw; render(); });

        document.getElementById('form-signup')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            signupState.error = '';
            
            const pv = validatePassword(signupState.password);
            if (!pv.valid) { signupState.error = pv.error; render(); return; }
            if (!passwordsMatch(signupState.password, signupState.confirmPassword)) { signupState.error = 'Passwords do not match'; render(); return; }
            if (signupState.khataIdStatus === 'taken' || signupState.khataIdStatus === 'invalid') { return; }
            
            // Check if checking is still in progress
            if (signupState.khataIdStatus === 'checking') {
               signupState.error = 'Please wait, checking Khata ID availability...'; render(); return;
            }
            if (signupState.khataIdStatus === '') {
                signupState.error = 'Please enter a valid Khata ID'; render(); return;
            }

            signupState.loading = true;
            render();
            try {
                await signUp(signupState.khataId, signupState.password, signupState.fullName, signupState.businessName);
                showToast('Account created successfully!', 'success');
                window.location.hash = '#/dashboard';
                window.dispatchEvent(new CustomEvent('auth-change'));
            } catch (err) {
                signupState.error = err.message || 'Registration failed';
                signupState.loading = false;
                render();
            }
        });
    }
  }

  render();
}

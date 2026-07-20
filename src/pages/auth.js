import { signUp, signIn, signInWithGoogle, checkUsernameAvailability } from '../services/auth.service.js';
import { validateUsername, validateEmail, validatePassword, passwordsMatch } from '../utils/validators.js';
import { debounce } from '../utils/helpers.js';
import { showToast } from '../components/toast.js';
import { MAX_ACCOUNT_NAME_LENGTH } from '../utils/constants.js';

export function renderAuthPage(container) {
  let activeTab = 'signin';
  
  let signupState = { 
      email: '', emailStatus: '',
      password: '', confirmPassword: '', 
      showPw: false, showCpw: false, 
      loading: false, error: '', termsAccepted: false 
  };
  let signinState = { 
      identifier: '', password: '', 
      showPw: false, loading: false, error: '' 
  };

  const checkAvailability = debounce(async (id) => {
    // Unused in initial signup, kept placeholder if needed or remove entirely
  }, 500);

  function render() {
    container.innerHTML = `
      <div class="bg-background text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 font-body-md">
        <main class="w-full max-w-[460px] relative">
            <div class="bg-surface-container-lowest rounded-[20px] border border-outline-variant/30 shadow-[0_8px_24px_rgba(26,28,30,0.04)] p-8 md:p-10 w-full">
                
                <!-- Logo Header -->
                <div class="flex flex-col items-center mb-10">
                    <img alt="Sunarkhata Logo" class="rounded-full overflow-hidden shadow-sm w-16 h-16 object-contain mb-5" src="/logo.png">
                    <h1 class="font-headline-md text-headline-md text-charcoal-deep tracking-tight font-bold">Sunarkhata</h1>
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
                        <span class="text-[12px]">Encrypted communication · Your data stays yours</span>
                    </div>
                    <div class="flex gap-4 text-[12px] text-outline font-medium mb-4">
                        <a href="#/legal/terms" class="hover:text-on-surface transition-colors">Terms</a>
                        <a href="#/legal/privacy" class="hover:text-on-surface transition-colors">Privacy</a>
                        <a href="#/legal/disclaimer" class="hover:text-on-surface transition-colors">Disclaimer</a>
                        <a href="#/legal/contact" class="hover:text-on-surface transition-colors">Contact</a>
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
              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Email or Username</label>
              <div class="relative">
                  <input id="siIdentifier" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="support@sunarkhata.com or username" required type="text" autocomplete="username" autocapitalize="off" spellcheck="false" value="${signinState.identifier}">
              </div>
          </div>
          
          <div class="space-y-2">
              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Password</label>
              <div class="relative">
                  <input id="siPassword" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 pl-4 pr-12 font-body-md text-on-surface outline-none transition-colors" placeholder="••••••••••••" required type="${signinState.showPw ? 'text' : 'password'}" autocomplete="current-password" value="${signinState.password}">
                  <div class="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer" id="siTogglePw">
                      <span class="material-symbols-outlined text-[20px] text-outline hover:text-on-surface transition-colors">${signinState.showPw ? 'visibility_off' : 'visibility'}</span>
                  </div>
              </div>
          </div>
          
          <div class="flex justify-end">
              <a class="text-gold-metallic hover:text-gold-metallic/80 text-sm font-medium transition-colors" href="#">Forgot password?</a>
          </div>
          
          <button type="submit" ${signinState.loading ? 'disabled' : ''} class="w-full bg-gold-metallic hover:brightness-105 text-white font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_14px_rgba(201,168,76,0.39)] disabled:opacity-50">
              ${signinState.loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div class="relative flex items-center py-4">
              <div class="flex-grow border-t border-outline-variant/50"></div>
              <span class="flex-shrink-0 mx-4 text-outline text-[12px] uppercase tracking-wider">OR</span>
              <div class="flex-grow border-t border-outline-variant/50"></div>
          </div>

          <button type="button" id="btn-google-signin" class="w-full border border-outline-variant hover:bg-surface-offwhite text-on-surface font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-sm">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5">
              Continue with Google
          </button>
      </form>
    `;
  }

  function renderSignUp() {
    return `
      <form class="space-y-5" id="form-signup">
          ${signupState.error ? `<div class="bg-error-container text-on-error-container p-3 rounded text-sm text-center border border-error-crimson/20">${signupState.error}</div>` : ''}
          
          <div class="space-y-2">
              <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Email</label>
              <input id="suEmail" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 px-4 font-body-md text-on-surface outline-none transition-colors" placeholder="support@sunarkhata.com" required type="email" autocomplete="email" autocapitalize="off" spellcheck="false" value="${signupState.email}">
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                  <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Password</label>
                  <div class="relative">
                      <input id="suPassword" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 pl-4 pr-12 font-body-md text-on-surface outline-none transition-colors" placeholder="••••••••" required type="${signupState.showPw ? 'text' : 'password'}" autocomplete="new-password" value="${signupState.password}">
                      <div class="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer" id="suTogglePw">
                          <span class="material-symbols-outlined text-[20px] text-outline hover:text-on-surface transition-colors">${signupState.showPw ? 'visibility_off' : 'visibility'}</span>
                      </div>
                  </div>
              </div>
              
              <div class="space-y-2">
                  <label class="block font-label-md text-[12px] text-on-surface-variant uppercase tracking-widest">Confirm Password</label>
                  <div class="relative">
                      <input id="suConfirmPw" class="w-full bg-surface-offwhite border border-outline-variant focus:border-gold-metallic focus:ring-0 rounded-lg py-3.5 pl-4 pr-12 font-body-md text-on-surface outline-none transition-colors" placeholder="••••••••" required type="${signupState.showCpw ? 'text' : 'password'}" autocomplete="new-password" value="${signupState.confirmPassword}">
                      <div class="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer" id="suToggleCpw">
                          <span class="material-symbols-outlined text-[20px] text-outline hover:text-on-surface transition-colors">${signupState.showCpw ? 'visibility_off' : 'visibility'}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          ${(() => {
              const pv = validatePassword(signupState.password);
              return `
                  <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 px-0.5">
                      <div id="req-len" class="flex items-center gap-1 text-[10.5px] transition-colors ${pv.length ? 'text-success-emerald/75 font-medium' : 'text-outline/50 font-normal'}">
                          <span id="req-len-icon" class="material-symbols-outlined text-[12px] leading-none opacity-80">${pv.length ? 'check' : 'circle'}</span>
                          <span>8 - 16 characters</span>
                      </div>
                      <div id="req-up" class="flex items-center gap-1 text-[10.5px] transition-colors ${pv.uppercase ? 'text-success-emerald/75 font-medium' : 'text-outline/50 font-normal'}">
                          <span id="req-up-icon" class="material-symbols-outlined text-[12px] leading-none opacity-80">${pv.uppercase ? 'check' : 'circle'}</span>
                          <span>At least 1 uppercase letter</span>
                      </div>
                      <div id="req-num" class="flex items-center gap-1 text-[10.5px] transition-colors ${pv.number ? 'text-success-emerald/75 font-medium' : 'text-outline/50 font-normal'}">
                          <span id="req-num-icon" class="material-symbols-outlined text-[12px] leading-none opacity-80">${pv.number ? 'check' : 'circle'}</span>
                          <span>At least 1 number</span>
                      </div>
                  </div>
              `;
          })()}
          
                    <div class="flex items-center gap-3 mt-5 mb-2 pl-1">
                <style>
                  #suTermsCheck {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border: 2px solid black !important;
                    border-radius: 3px;
                    background-color: white !important;
                    position: relative;
                    cursor: pointer;
                    flex-shrink: 0;
                  }
                  #suTermsCheck:checked {
                    background-color: #C5A028 !important;
                    border-color: #C5A028 !important;
                  }
                  #suTermsCheck:checked::after {
                    content: '';
                    position: absolute;
                    left: 4px;
                    top: 1px;
                    width: 5px;
                    height: 9px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                  }
                </style>
                <input type="checkbox" id="suTermsCheck" ${signupState.termsAccepted ? 'checked' : ''}>
              <label for="suTermsCheck" class="text-[13px] text-on-surface-variant leading-tight">
                  I have read and agree to the <a href="#/legal?policy=terms" target="_blank" class="text-primary hover:text-gold-metallic font-semibold underline transition-colors">Terms & Conditions</a>.
              </label>
          </div>
          <button type="submit" ${signupState.loading ? 'disabled' : ''}  ${!signupState.termsAccepted ? 'disabled' : ''} class="w-full bg-gold-metallic hover:brightness-105 text-white font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 mt-6 shadow-[0_4px_14px_rgba(201,168,76,0.39)] disabled:opacity-50">
              ${signupState.loading ? 'Creating Account...' : 'Create My Khata'}
          </button>
          
          <div class="relative flex items-center py-4">
              <div class="flex-grow border-t border-outline-variant/50"></div>
              <span class="flex-shrink-0 mx-4 text-outline text-[12px] uppercase tracking-wider">OR</span>
              <div class="flex-grow border-t border-outline-variant/50"></div>
          </div>

          <button type="button" id="btn-google-signup" class="w-full border border-outline-variant hover:bg-surface-offwhite text-on-surface font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-sm">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5">
              Continue with Google
          </button>
          
          <div class="text-center mt-[12px]">
              <p class="font-[Inter] text-[13px] font-normal leading-[20px] text-[#6B6B66]">Pricing Revealing Soon</p>
              <p class="font-[Inter] text-[11px] font-normal leading-[16px] text-[#8A8A85] mt-[4px] whitespace-normal">Pricing may vary from ₹299 to ₹599 per month depending on the selected plan, business size and features.</p>
          </div>
      </form>
    `;
  }

  function attachListeners() {
    document.getElementById('tab-signin')?.addEventListener('click', () => { activeTab = 'signin'; render(); });
    document.getElementById('tab-signup')?.addEventListener('click', () => { activeTab = 'signup'; render(); });

    if (activeTab === 'signin') {
        const siIdentifier = document.getElementById('siIdentifier');
        const siPassword = document.getElementById('siPassword');
        
        siIdentifier?.addEventListener('input', e => { signinState.identifier = e.target.value.toLowerCase().replace(/\s/g, ''); e.target.value = signinState.identifier; });
        siPassword?.addEventListener('input', e => { signinState.password = e.target.value; });
        
        document.getElementById('siTogglePw')?.addEventListener('click', () => { signinState.showPw = !signinState.showPw; render(); });
        
        document.getElementById('btn-google-signin')?.addEventListener('click', async () => {
            try {
                await signInWithGoogle();
            } catch (err) {
                signinState.error = err.message || 'Google Sign-In failed';
                render();
            }
        });

        document.getElementById('form-signin')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            signinState.error = '';
            signinState.loading = true;
            render();
            try {
                await signIn(signinState.identifier, signinState.password);
                showToast('Welcome back!', 'success');
                window.location.hash = '#/terms';
                window.dispatchEvent(new CustomEvent('auth-change'));
            } catch (err) {
                signinState.error = err.message || 'Login failed';
                signinState.loading = false;
                render();
            }
        });
    } else {
        const suEmail = document.getElementById('suEmail');
        const suPassword = document.getElementById('suPassword');
        const suConfirmPw = document.getElementById('suConfirmPw');
        const suTermsCheck = document.getElementById('suTermsCheck');
        if (suTermsCheck) {
            suTermsCheck.addEventListener('change', (e) => {
                signupState.termsAccepted = e.target.checked;
                render();
            });
        }

        suEmail?.addEventListener('input', e => { signupState.email = e.target.value.toLowerCase().replace(/\s/g, ''); });
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
        
        document.getElementById('btn-google-signup')?.addEventListener('click', async () => {
            try {
                await signInWithGoogle();
            } catch (err) {
                signupState.error = err.message || 'Google Sign-In failed';
                render();
            }
        });

        document.getElementById('form-signup')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            signupState.error = '';
            
            const ev = validateEmail(signupState.email);
            if (!ev.valid) { signupState.error = ev.error; render(); return; }

            const pv = validatePassword(signupState.password);
            if (!pv.valid) { signupState.error = pv.error; render(); return; }
            if (!passwordsMatch(signupState.password, signupState.confirmPassword)) { signupState.error = 'Passwords do not match'; render(); return; }

            signupState.loading = true;
            render();
            try {
                await signUp({
                    email: signupState.email,
                    password: signupState.password
                });
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

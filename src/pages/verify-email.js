import { firebaseAuth } from '../firebase.js';
import { sendEmailVerification } from 'firebase/auth';
import { showToast } from '../components/toast.js';

export function renderVerifyEmail(container) {
  let loading = false;
  let resending = false;

  async function handleRefresh() {
    if (loading) return;
    loading = true;
    render();
    try {
      const user = firebaseAuth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          // Force refresh the ID token so Supabase gets the updated email_verified claim
          await user.getIdToken(true);
        }
        // The auth state change listener or router will handle the redirect
        // if emailVerified is now true. We dispatch an event to force router check.
        window.dispatchEvent(new CustomEvent('auth-change'));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to refresh status. Please try again.', 'error');
    } finally {
      loading = false;
      render();
    }
  }

  async function handleResend() {
    if (resending) return;
    resending = true;
    render();
    try {
      const user = firebaseAuth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        showToast('Verification email sent!', 'success');
      }
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      const errorCode = err.code || 'unknown-error';
      const errorMessage = err.message || 'An unexpected error occurred.';
      showToast(`Failed: [${errorCode}] ${errorMessage}`, 'error');
    } finally {
      resending = false;
      render();
    }
  }

  function render() {
    container.innerHTML = `
      <div class="bg-background text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 font-body-md">
        <main class="w-full max-w-[460px] relative">
            <div class="bg-surface-container-lowest rounded-[20px] border border-outline-variant/30 shadow-[0_8px_24px_rgba(26,28,30,0.04)] p-8 md:p-10 w-full text-center">
                
                <span class="material-symbols-outlined text-6xl text-gold-metallic mb-6 block">mark_email_unread</span>
                
                <h1 class="font-headline-md text-headline-md text-charcoal-deep tracking-tight font-bold mb-4">Verify your email</h1>
                
                <p class="text-on-surface-variant text-sm mb-8 leading-relaxed">
                    We've sent a verification email to your address. Please check your inbox and click the link to activate your account.
                </p>
                
                <div class="space-y-4">
                    <button id="btn-refresh" ${loading ? 'disabled' : ''} class="w-full bg-gold-metallic hover:brightness-105 text-white font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_14px_rgba(201,168,76,0.39)] disabled:opacity-50">
                        ${loading ? 'Checking...' : 'I have verified my email'}
                    </button>
                    
                    <button id="btn-resend" ${resending ? 'disabled' : ''} class="w-full bg-surface-offwhite border border-outline-variant hover:bg-surface-container text-on-surface font-label-md text-label-md py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm disabled:opacity-50">
                        ${resending ? 'Sending...' : 'Resend verification email'}
                    </button>
                </div>
                
                <div class="mt-8 text-sm text-outline font-medium">
                    <a href="#/auth" id="btn-signOut" class="hover:text-on-surface transition-colors">Sign in with a different account</a>
                </div>
            </div>
        </main>
      </div>
    `;

    document.getElementById('btn-refresh')?.addEventListener('click', handleRefresh);
    document.getElementById('btn-resend')?.addEventListener('click', handleResend);
    document.getElementById('btn-signOut')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { signOut } = await import('../services/auth.service.js');
        await signOut();
    });
  }

  render();
}

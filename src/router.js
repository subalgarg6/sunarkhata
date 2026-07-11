import { isAuthenticated, getCurrentUser } from './services/auth.service.js';
import { renderAuthPage } from './pages/auth.js';
import { renderLandingPage } from './pages/landing.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderCalculatorPage } from './pages/calculator.js';
import { renderProfilePage } from './pages/profile.js';
import { renderPricingPage, hasCompletedOnboarding } from './pages/pricing.js';
import { renderLegalPage } from './pages/legal-renderer.js';
import { renderTransaction } from './pages/transaction.js';
import { getAccount as getIndAccount } from './services/individual.service.js';
import { getMutualAccount as getMutAccount } from './services/mutual.service.js';
import { CURRENT_TERMS_VERSION } from './utils/constants.js';
import { renderTermsAcceptancePage } from './pages/terms-acceptance.js';


const routes = {
  '/terms': { render: renderTermsAcceptancePage, requiresAuth: true },
  '/': { render: renderLandingPage, requiresAuth: false },
  '/auth': { render: renderAuthPage, requiresAuth: false },
  '/pricing': { render: renderPricingPage, requiresAuth: true },
  '/dashboard': { render: renderDashboard, requiresAuth: true },
  '/calculator': { render: renderCalculatorPage, requiresAuth: true },
  '/profile': { render: renderProfilePage, requiresAuth: true },
  // Legal pages — accessible to anyone
  '/legal/terms': { render: (c) => renderLegalPage(c, 'terms'), requiresAuth: false },
  '/legal/privacy': { render: (c) => renderLegalPage(c, 'privacy'), requiresAuth: false },
  '/legal/cookies': { render: (c) => renderLegalPage(c, 'cookies'), requiresAuth: false },
  '/legal/disclaimer': { render: (c) => renderLegalPage(c, 'disclaimer'), requiresAuth: false },
  '/legal/refund': { render: (c) => renderLegalPage(c, 'refund'), requiresAuth: false },
};

export function initRouter() {
  const app = document.getElementById('app');

  function navigate() {
    const hash = window.location.hash.slice(1) || '/';
    const authed = isAuthenticated();
    const user = getCurrentUser();
    // --- TERMS & POLICY ROUTE GUARD (ACTIVE REGISTRATION ONLY) ---
    if (authed && user) {
      const isPendingTerms = sessionStorage.getItem('pendingTermsAcceptance') === 'true';
      
      if (isPendingTerms && hash !== '/terms' && !hash.startsWith('/legal/')) {
        const routeRequiresAuth = routes[hash] ? routes[hash].requiresAuth : false;
        const isDeepLink = hash.match(/^\/account\/(.+)$/) || hash.match(/^\/mutual\/(.+)$/) || hash.match(/^\/transaction\/(individual|mutual)\/(.+)$/) || hash === '/new-individual' || hash === '/new-mutual';
        const isAuthRedirect = (hash === '/' || hash === '/auth');

        if (routeRequiresAuth || isDeepLink || isAuthRedirect) {
          window.location.hash = '#/terms';
          return;
        }
      }
    }
    // --- END GUARD ---


    // Account deep links → render through workspace dashboard
    const accountMatch = hash.match(/^\/account\/(.+)$/);
    const mutualMatch = hash.match(/^\/mutual\/(.+)$/);
    if (accountMatch || mutualMatch) {
      if (!authed) { window.location.hash = '#/auth'; return; }
      app.innerHTML = '';
      renderDashboard(app);
      return;
    }

    // Legacy Transaction Route Fix
    const txnMatch = hash.match(/^\/transaction\/(individual|mutual)\/(.+)$/);
    if (txnMatch) {
      if (!authed) { window.location.hash = '#/auth'; return; }
      const type = txnMatch[1];
      const accountId = txnMatch[2];
      
      let exists = false;
      if (type === 'individual' && getIndAccount(accountId)) exists = true;
      if (type === 'mutual' && getMutAccount(accountId)) exists = true;
      
      if (exists) {
        window.location.hash = type === 'mutual' ? `#/mutual/${accountId}` : `#/account/${accountId}`;
      } else {
        app.innerHTML = `
          <div class="min-h-screen flex flex-col items-center justify-center bg-surface-offwhite p-4">
            <span class="material-symbols-outlined text-4xl text-error-crimson mb-4">error</span>
            <h1 class="text-xl font-bold text-on-surface mb-2">Account Not Found</h1>
            <p class="text-on-surface-variant text-sm mb-6">The requested account could not be found or you do not have access to it.</p>
            <button onclick="window.location.hash='#/dashboard'" class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-black transition-colors font-semibold">
              Go to Dashboard
            </button>
          </div>
        `;
      }
      return;
    }

    // Account creation routes → render through workspace dashboard
    if (hash === '/new-individual' || hash === '/new-mutual') {
      if (!authed) { window.location.hash = '#/auth'; return; }
      app.innerHTML = '';
      renderDashboard(app);
      return;
    }

    const route = routes[hash] || routes['/'];

    // Legal pages are always accessible
    if (hash.startsWith('/legal/')) {
      app.innerHTML = '';
      route.render(app);
      return;
    }

    // Not logged in → go to auth
    if (route.requiresAuth && !authed) {
      window.location.hash = '#/auth';
      return;
    }

    // Logged in user hitting auth page (either / or /auth)
    if ((hash === '/' || hash === '/auth') && authed) {
      if (user && !hasCompletedOnboarding(user.id)) {
        window.location.hash = '#/pricing';
      } else {
        window.location.hash = '#/dashboard';
      }
      return;
    }

    // If trying to access dashboard without plan selection
    if (hash === '/dashboard' && authed && user && !hasCompletedOnboarding(user.id)) {
      window.location.hash = '#/pricing';
      return;
    }

    app.innerHTML = '';
    route.render(app);
  }

  window.addEventListener('hashchange', navigate);
  window.addEventListener('auth-change', () => {
    const user = getCurrentUser();
    if (isAuthenticated() && user) {
      if (sessionStorage.getItem('pendingTermsAcceptance') === 'true') {
        window.location.hash = '#/terms';
      } else if (!hasCompletedOnboarding(user.id)) {
        window.location.hash = '#/pricing';
      } else {
        window.location.hash = '#/dashboard';
      }
    } else {
      window.location.hash = '#/auth';
    }
  });

  navigate();
}

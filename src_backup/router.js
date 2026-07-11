import { isAuthenticated, getCurrentUser } from './services/auth.service.js';
import { renderAuthPage } from './pages/auth.js';
import { renderLandingPage } from './pages/landing.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderCalculatorPage } from './pages/calculator.js';
import { renderProfilePage } from './pages/profile.js';
import { renderPricingPage, hasCompletedOnboarding } from './pages/pricing.js';
import { renderLegalPage } from './pages/legal-renderer.js';
import { renderIndividualAccount } from './pages/individual-account.js';
import { renderMutualAccount } from './pages/mutual-account.js';
import { renderAccountCreation } from './pages/account-creation.js';
import { renderTransaction } from './pages/transaction.js';

const routes = {
  '/': { render: renderLandingPage, requiresAuth: false },
  '/auth': { render: renderAuthPage, requiresAuth: false },
  '/pricing': { render: renderPricingPage, requiresAuth: true },
  '/dashboard': { render: renderDashboard, requiresAuth: true },
  '/calculator': { render: renderCalculatorPage, requiresAuth: true },
  '/profile': { render: renderProfilePage, requiresAuth: true },
  '/new-individual': { render: (c) => renderAccountCreation(c, 'individual'), requiresAuth: true },
  '/new-mutual': { render: (c) => renderAccountCreation(c, 'mutual'), requiresAuth: true },
  // Legal pages — accessible to anyone (no auth required)
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

    // Handle dynamic routes: /account/:id (individual)
    const accountMatch = hash.match(/^\/account\/(.+)$/);
    if (accountMatch) {
      if (!authed) { window.location.hash = '#/auth'; return; }
      app.innerHTML = '';
      renderIndividualAccount(app, accountMatch[1]);
      return;
    }

    // Handle dynamic routes: /mutual/:id
    const mutualMatch = hash.match(/^\/mutual\/(.+)$/);
    if (mutualMatch) {
      if (!authed) { window.location.hash = '#/auth'; return; }
      app.innerHTML = '';
      renderMutualAccount(app, mutualMatch[1]);
      return;
    }

    // Handle transaction routes: /transaction/:context/:id
    const txnMatch = hash.match(/^\/transaction\/(individual|mutual)\/(.+)$/);
    if (txnMatch) {
      if (!authed) { window.location.hash = '#/auth'; return; }
      app.innerHTML = '';
      renderTransaction(app, txnMatch[1], txnMatch[2]);
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

    // If trying to access dashboard without plan selection, redirect to pricing
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
      if (!hasCompletedOnboarding(user.id)) {
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

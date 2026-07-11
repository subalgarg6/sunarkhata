const fs = require('fs');
let content = fs.readFileSync('src/router.js', 'utf8');

// 1. Add Imports
if (!content.includes('CURRENT_TERMS_VERSION')) {
    const importsToAdd = `
import { CURRENT_TERMS_VERSION } from './utils/constants.js';
import { renderTermsAcceptancePage } from './pages/terms-acceptance.js';
`;
    // Insert after the last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfLastImport) + importsToAdd + content.slice(endOfLastImport);
}

// 2. Add /terms to routes mapping
if (!content.includes("'/terms':")) {
    content = content.replace(
        "const routes = {",
        "const routes = {\n  '/terms': { render: renderTermsAcceptancePage, requiresAuth: true },"
    );
}

// 3. Add Terms Guard inside navigate()
// Look for `const authed = isAuthenticated();` and `const user = getCurrentUser();`
// Insert right after `const user = getCurrentUser();`
const guardCode = `
    // --- TERMS & POLICY ROUTE GUARD ---
    if (authed && user) {
      const termsAccepted = user.termsAccepted === true && user.termsVersion === CURRENT_TERMS_VERSION;
      
      // If user hasn't accepted current terms, and they are trying to access ANY protected route (except /terms itself)
      // Note: hash is already sliced e.g., '/dashboard'
      if (!termsAccepted && hash !== '/terms' && !hash.startsWith('/legal/')) {
        // Only redirect if the route they requested actually requires auth or is a dashboard redirect attempt
        // We let them access public routes like /auth or / landing.
        // Wait, the requirement says: "The user must not access Dashboard... or any protected route until accepted"
        // If they hit '/' or '/auth', they are logged in, so they normally go to Dashboard. We should redirect to /terms instead.
        const routeRequiresAuth = routes[hash] ? routes[hash].requiresAuth : false;
        const isDeepLink = hash.match(/^\\/account\\/(.+)$/) || hash.match(/^\\/mutual\\/(.+)$/) || hash.match(/^\\/transaction\\/(individual|mutual)\\/(.+)$/) || hash === '/new-individual' || hash === '/new-mutual';
        const isAuthRedirect = (hash === '/' || hash === '/auth');

        if (routeRequiresAuth || isDeepLink || isAuthRedirect) {
          window.location.hash = '#/terms';
          return;
        }
      }
    }
    // --- END GUARD ---
`;

if (!content.includes('TERMS & POLICY ROUTE GUARD')) {
    content = content.replace(
        "const user = getCurrentUser();",
        "const user = getCurrentUser();" + guardCode
    );
}

fs.writeFileSync('src/router.js', content);
console.log('Patched router.js');

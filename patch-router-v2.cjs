const fs = require('fs');
let content = fs.readFileSync('src/router.js', 'utf8');

// Replace the Terms & Policy Route Guard
const oldGuardRegex = /\/\/ --- TERMS & POLICY ROUTE GUARD ---[\s\S]*?\/\/ --- END GUARD ---/;
const newGuard = `
    // --- TERMS & POLICY ROUTE GUARD (ACTIVE REGISTRATION ONLY) ---
    if (authed && user) {
      const isPendingTerms = sessionStorage.getItem('pendingTermsAcceptance') === 'true';
      
      if (isPendingTerms && hash !== '/terms' && !hash.startsWith('/legal/')) {
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

if (oldGuardRegex.test(content)) {
    content = content.replace(oldGuardRegex, newGuard.trim());
    fs.writeFileSync('src/router.js', content);
    console.log('Patched router.js');
} else {
    console.log('Could not find guard in router.js');
}

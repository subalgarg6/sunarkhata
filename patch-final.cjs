const fs = require('fs');

// Patch auth.js
let authContent = fs.readFileSync('src/pages/auth.js', 'utf8');
authContent = authContent.replace(
    "window.location.hash = '#/dashboard';",
    "window.location.hash = '#/terms';"
);
fs.writeFileSync('src/pages/auth.js', authContent);
console.log('Patched auth.js');

// Patch router.js auth-change listener
let routerContent = fs.readFileSync('src/router.js', 'utf8');
const oldAuthChange = /window\.addEventListener\('auth-change', \(\) => \{[\s\S]*?\}\);/;
const newAuthChange = `window.addEventListener('auth-change', () => {
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
  });`;

if (oldAuthChange.test(routerContent)) {
    routerContent = routerContent.replace(oldAuthChange, newAuthChange);
    fs.writeFileSync('src/router.js', routerContent);
    console.log('Patched router.js auth-change');
} else {
    console.log('Failed to patch auth-change in router.js');
}

// Patch terms-acceptance.js to not use setTimeout before dispatching an event if needed.
// Oh wait, in terms-acceptance.js we already do `window.location.hash = '#/dashboard'` which triggers navigate(),
// we don't dispatch 'auth-change' there, but the user is already authenticated.

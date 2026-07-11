const fs = require('fs');
let content = fs.readFileSync('src/services/auth.service.js', 'utf8');

// 1. Revert getCurrentUser
const oldGetCurrentUser = /export function getCurrentUser\(\) \{[\s\S]*?return user;\n\}/;
const newGetCurrentUser = `export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
}`;
if (oldGetCurrentUser.test(content)) {
    content = content.replace(oldGetCurrentUser, newGetCurrentUser);
}

// 2. Inject sessionStorage flag in signUp (Supabase Mode)
const sbSignUpTarget = "localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));\\n    notifyListeners();";
const sbSignUpReplacement = "localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));\n    sessionStorage.setItem('pendingTermsAcceptance', 'true');\n    notifyListeners();";
content = content.replace(new RegExp(sbSignUpTarget), sbSignUpReplacement);

// 3. Inject sessionStorage flag in signUp (Demo Mode)
const demoSignUpTarget = "localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));\\n    notifyListeners();";
const demoSignUpReplacement = "localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));\n    sessionStorage.setItem('pendingTermsAcceptance', 'true');\n    notifyListeners();";
content = content.replace(new RegExp(demoSignUpTarget), demoSignUpReplacement);

// 4. Clear flag in acceptTerms
const acceptTermsTarget = "export async function acceptTerms\\(version\\) \\{";
const acceptTermsReplacement = "export async function acceptTerms(version) {\n  sessionStorage.removeItem('pendingTermsAcceptance');";
content = content.replace(new RegExp(acceptTermsTarget), acceptTermsReplacement);

fs.writeFileSync('src/services/auth.service.js', content);
console.log('Patched auth.service.js for v2 flow');

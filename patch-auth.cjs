const fs = require('fs');
let content = fs.readFileSync('src/services/auth.service.js', 'utf8');

// 1. Update getCurrentUser to handle migration logic
const newGetCurrentUser = `export function getCurrentUser() {
  const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
  if (user && user.termsAccepted === undefined) {
    user.termsAccepted = false;
    user.termsAcceptedAt = null;
    user.termsVersion = null;
  }
  return user;
}`;
content = content.replace(/export function getCurrentUser\(\) \{[\s\S]*?\}/, newGetCurrentUser);

// 2. Add terms fields to demo mode sign up
content = content.replace(/legal_accepted: false/, 'legal_accepted: false,\n      termsAccepted: false, termsAcceptedAt: null, termsVersion: null');

// 3. Add acceptTerms function at the end
const acceptTermsCode = `
export async function acceptTerms(version) {
  const current = getCurrentUser();
  if (!current) throw new Error('Not authenticated');

  const now = new Date().toISOString();
  
  if (isSupabaseConfigured && supabase) {
    // Supabase Mode
    const cleanUpdates = {
      terms_accepted: true,
      terms_accepted_at: now,
      terms_version: version,
      updated_at: now
    };
    const { error } = await supabase.from('users').update(cleanUpdates).eq('id', current.id);
    if (error) throw new Error('Failed to save terms acceptance: ' + error.message);
    
    // Also update the local caching state using camelCase to match app expectations
    const updated = { 
      ...current, 
      termsAccepted: true, 
      termsAcceptedAt: now, 
      termsVersion: version 
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    notifyListeners();
  } else {
    // Demo Mode
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === current.id);
    if (idx === -1) throw new Error('User not found in local store');
    
    users[idx].termsAccepted = true;
    users[idx].termsAcceptedAt = now;
    users[idx].termsVersion = version;
    users[idx].updated_at = now;
    
    saveLocalUsers(users);
    
    const safeUser = { ...users[idx] };
    delete safeUser.password;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    notifyListeners();
  }
}
`;

if (!content.includes('acceptTerms(version)')) {
    content += acceptTermsCode;
}

fs.writeFileSync('src/services/auth.service.js', content);
console.log('Patched auth.service.js');

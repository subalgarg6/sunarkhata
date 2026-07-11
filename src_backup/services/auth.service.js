import { supabase, isSupabaseConfigured } from '../supabase.js';
import { generateId } from '../utils/helpers.js';

// ============================================
// DUAL MODE: Supabase (real) or localStorage (demo)
// If Supabase keys are set → uses real auth
// If not → falls back to localStorage demo mode
// ============================================

const USERS_KEY = 'sk_users';
const CURRENT_USER_KEY = 'sk_current_user';

function getLocalUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
function saveLocalUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

const listeners = [];
function notifyListeners() { const user = getCurrentUser(); listeners.forEach(cb => cb(user)); }

export function onAuthChange(callback) {
  listeners.push(callback);

  // If Supabase is configured, also listen to Supabase auth changes
  if (isSupabaseConfigured && supabase) {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (data) {
          const userMeta = session.user.user_metadata || {};
          const combined = { ...data, ...userMeta };
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(combined));
          callback(combined);
        }
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
        callback(null);
      }
    });
  }

  return () => { const i = listeners.indexOf(callback); if (i > -1) listeners.splice(i, 1); };
}

export async function signUp(khataId, password, fullName, businessName) {
  if (isSupabaseConfigured && supabase) {
    // --- SUPABASE MODE ---
    // Map khataId to email: khataId@sunarkhata.app
    const email = `${khataId}@sunarkhata.app`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          khata_id: khataId,
          full_name: fullName,
          business_name: businessName || ''
        }
      }
    });

    if (error) throw new Error(error.message);

    // The trigger function in Supabase auto-creates the users profile row
    // Wait a moment for the trigger to complete, then fetch the profile
    await new Promise(r => setTimeout(r, 500));

    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    const userMeta = data.user.user_metadata || {};
    const user = { ...(profile || { id: data.user.id, khata_id: khataId, full_name: fullName, business_name: businessName || '', preferred_unit: 'gram', default_purity: '22K', plan: 'pro' }), ...userMeta };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    notifyListeners();
    return user;

  } else {
    // --- DEMO MODE (localStorage) ---
    const users = getLocalUsers();
    if (users.some(u => u.khata_id === khataId)) throw new Error('Khata ID already taken');
    const user = {
      id: generateId(), khata_id: khataId, password, full_name: fullName,
      business_name: businessName || '', preferred_unit: 'gram', default_purity: '22K',
      plan: 'pro', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      legal_accepted: false
    };
    users.push(user);
    saveLocalUsers(users);
    const safeUser = { ...user }; delete safeUser.password;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    notifyListeners();
    return safeUser;
  }
}

export async function signIn(khataId, password) {
  if (isSupabaseConfigured && supabase) {
    // --- SUPABASE MODE ---
    const email = `${khataId}@sunarkhata.app`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Incorrect Khata ID or password' : error.message);

    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    const userMeta = data.user.user_metadata || {};
    const user = { ...(profile || { id: data.user.id, khata_id: khataId, full_name: '' }), ...userMeta };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    notifyListeners();
    return user;

  } else {
    // --- DEMO MODE ---
    const users = getLocalUsers();
    const user = users.find(u => u.khata_id === khataId);
    if (!user) throw new Error('Khata ID not found');
    if (user.password !== password) throw new Error('Incorrect password');
    const safeUser = { ...user }; delete safeUser.password;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    notifyListeners();
    return safeUser;
  }
}

export async function signOut() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(CURRENT_USER_KEY);
  notifyListeners();
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
}

export function isAuthenticated() { return getCurrentUser() !== null; }

export async function checkKhataIdAvailability(khataId) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('check_khata_id', { p_khata_id: khataId });
    if (error) return true; // assume available on error
    return data;
  } else {
    return !getLocalUsers().some(u => u.khata_id === khataId);
  }
}

export async function updateProfile(updates) {
  const current = getCurrentUser();
  if (!current) return;

  if (isSupabaseConfigured && supabase) {
    const allowed = ['full_name', 'business_name', 'preferred_unit', 'default_purity'];
    const cleanUpdates = {};
    allowed.forEach(key => { if (updates[key] !== undefined) cleanUpdates[key] = updates[key]; });
    cleanUpdates.updated_at = new Date().toISOString();

    await supabase.from('users').update(cleanUpdates).eq('id', current.id);
    const updated = { ...current, ...cleanUpdates };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    notifyListeners();
  } else {
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === current.id);
    if (idx === -1) return;
    const allowed = ['full_name', 'business_name', 'preferred_unit', 'default_purity'];
    allowed.forEach(key => { if (updates[key] !== undefined) users[idx][key] = updates[key]; });
    users[idx].updated_at = new Date().toISOString();
    saveLocalUsers(users);
    const safeUser = { ...users[idx] }; delete safeUser.password;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    notifyListeners();
  }
}

export async function changePassword(oldPassword, newPassword) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  } else {
    const current = getCurrentUser();
    if (!current) throw new Error('Not authenticated');
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === current.id);
    if (idx === -1) throw new Error('User not found');
    if (users[idx].password !== oldPassword) throw new Error('Incorrect current password');
    users[idx].password = newPassword;
    users[idx].updated_at = new Date().toISOString();
    saveLocalUsers(users);
  }
}

export async function deleteAccount() {
  if (isSupabaseConfigured && supabase) {
    // Note: Full account deletion requires a server-side function
    // For now, just sign out and clear local data
    await supabase.auth.signOut();
  } else {
    const current = getCurrentUser();
    if (!current) return;
    const users = getLocalUsers().filter(u => u.id !== current.id);
    saveLocalUsers(users);
  }
  localStorage.removeItem(CURRENT_USER_KEY);
  notifyListeners();
}


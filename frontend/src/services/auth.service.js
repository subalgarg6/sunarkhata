/**
 * SunarKhata — Production Authentication Service
 *
 * Supports:
 *   • Email + Password sign-up / login
 *   • Username + Password login (username resolved to email via RPC)
 *   • Google OAuth sign-in with first-time onboarding flow
 *   • Persistent sessions with automatic token refresh
 *   • Multi-device login via Supabase session management
 *   • Dual-mode: Supabase (production) / localStorage (demo)
 *
 * IMPORTANT: This module exposes ONLY backend logic.
 * All UI is the responsibility of the consuming pages.
 */

import { supabase, isSupabaseConfigured } from '../supabase.js';
import { firebaseAuth, isFirebaseConfigured } from '../firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';

import { generateId } from '../utils/helpers.js';
import { MAX_ACCOUNT_NAME_LENGTH } from '../utils/constants.js';

// ════════════════════════════════════════════════════
// CONSTANTS & INTERNAL STATE
// ════════════════════════════════════════════════════

const USERS_KEY = 'sk_users';           // demo-mode user list
const CURRENT_USER_KEY = 'sk_current_user'; // cached profile

let _googleOnboardingPending = false;
const _listeners = [];

// ════════════════════════════════════════════════════
// INTERNAL HELPERS
// ════════════════════════════════════════════════════

function _getLocalUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}
function _saveLocalUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function _notifyListeners() {
  const user = getCurrentUser();
  _listeners.forEach(cb => cb(user));
}

/** Build a user object with backward-compatible aliases */
function _buildUserObject(profile) {
  if (!profile) return null;
  return {
    ...profile,
    // Legacy aliases (consumed by dashboard, profile page, etc.)
    khata_id: profile.username || '',
    khataId: profile.username || '',
    fullName: profile.full_name || '',
    businessName: profile.business_name || '',
    preferredUnit: profile.preferred_unit || 'gram',
    defaultPurity: profile.default_purity ?? 100,
    termsAccepted: profile.terms_accepted || false,
    termsAcceptedAt: profile.terms_accepted_at || null,
    termsVersion: profile.terms_version || null,
  };
}

/** Write user object to localStorage cache */
function _setCachedUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  _googleOnboardingPending =
    !!user && user.onboarding_complete === false && user.auth_provider === 'google';
}

/** Clear cached user from localStorage */
function _clearCachedUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
  _googleOnboardingPending = false;
}

/**
 * Fetch the user's profile from Supabase and cache it locally.
 * Falls back to session metadata if the profile row isn't ready yet.
 */
async function _syncProfile(firebaseUser) {
  if (!firebaseUser || !supabase) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', firebaseUser.uid)
    .single();

  if (profile) {
    const user = _buildUserObject(profile);
    _setCachedUser(user);
    return user;
  }

  // Profile row may not exist yet — build from Firebase user metadata
  const fallback = _buildUserObject({
    id: firebaseUser.uid,
    username: '',
    email: firebaseUser.email || '',
    full_name: firebaseUser.displayName || '',
    business_name: '',
    preferred_unit: 'gram',
    default_purity: 100,
    plan: 'free',
    auth_provider: firebaseUser.providerData?.some(p => p.providerId === 'google.com') ? 'google' : 'email',
    onboarding_complete: false,
    terms_accepted: false,
    terms_accepted_at: null,
    terms_version: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  _setCachedUser(fallback);
  return fallback;
}

// ════════════════════════════════════════════════════
// EXPORTED FUNCTIONS
// ════════════════════════════════════════════════════

export function initAuth() {
  return new Promise((resolve) => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      resolve();
      return;
    }

    let initialResolved = false;
    onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        await _syncProfile(firebaseUser);
      } else {
        _clearCachedUser();
      }
      _notifyListeners();
      window.dispatchEvent(new CustomEvent('auth-change'));
      if (!initialResolved) {
        initialResolved = true;
        resolve();
      }
    });

    // Safety: resolve after 4 s even if onAuthStateChanged never fires
    setTimeout(() => {
      if (!initialResolved) {
        initialResolved = true;
        resolve();
      }
    }, 4000);
  });
}

export function onAuthChange(callback) {
  _listeners.push(callback);
  return () => {
    const index = _listeners.indexOf(callback);
    if (index !== -1) _listeners.splice(index, 1);
  };
}

export async function signUp(paramsOrUsername, passwordArg) {
  let email, password;

  if (typeof paramsOrUsername === 'object' && paramsOrUsername !== null) {
    ({ email, password } = paramsOrUsername);
  } else {
    email = paramsOrUsername;
    password = passwordArg;
  }

  const safeEmail = email ? String(email).trim().toLowerCase() : '';
  email = safeEmail;

  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    const users = _getLocalUsers();
    if (users.find(u => u.email === email)) {
      throw new Error('Email already exists');
    }
    const newUser = {
      id: generateId(),
      email,
      username: '',
      password,
      full_name: '',
      business_name: '',
      auth_provider: 'email',
      onboarding_complete: false,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    _saveLocalUsers(users);
    const userProfile = _buildUserObject(newUser);
    _setCachedUser(userProfile);
    _notifyListeners();
    return userProfile;
  }

  // 1. Create user in Firebase
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const firebaseUser = userCredential.user;

  // 2. Send email verification
  try {
    await sendEmailVerification(firebaseUser);
  } catch (err) {
    console.error("Failed to send verification email", err);
    // DO NOT SWALLOW THIS ERROR.
    // If we can't send the verification email, the user will be stuck.
    // However, the Firebase user is already created. We should still return the profile, 
    // but the error will need to be exposed. Since the user is already created, throwing here 
    // means the UI signup fails, but the user actually exists.
    // Wait, let's just throw it so the UI knows.
    throw err;
  }

  // We DO NOT create the profile row here. We wait until emailVerified is true,
  // and then the user will complete onboarding to create their profile.
  return await _syncProfile(firebaseUser);
}

export async function signIn(identifier, password) {
  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    const users = _getLocalUsers();
    const user = users.find(u => 
      (u.username === identifier.toLowerCase() || u.email === identifier.toLowerCase()) && 
      u.password === password
    );
    if (!user) throw new Error('Invalid credentials');
    const userProfile = _buildUserObject(user);
    _setCachedUser(userProfile);
    _notifyListeners();
    return userProfile;
  }

  identifier = identifier.toLowerCase();
  let email = identifier;

  // Resolve username to email if it doesn't look like an email
  if (!identifier.includes('@')) {
    const { data: resolvedEmail, error } = await supabase.rpc('get_email_for_username', { p_username: identifier });
    if (error || !resolvedEmail) {
      throw new Error('Invalid username or password');
    }
    email = resolvedEmail;
  }

  const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return await _syncProfile(userCredential.user);
}

export async function signInWithGoogle() {
  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    throw new Error('Google sign-in is not available in demo mode.');
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(firebaseAuth, provider);
  const firebaseUser = result.user;

  // We no longer hardcode profile creation here.
  // Profile creation is uniformly handled by completeOnboarding.
  return await _syncProfile(firebaseUser);
}

export function isEmailVerified() {
  if (!isFirebaseConfigured || !firebaseAuth) return true;
  const user = firebaseAuth.currentUser;
  return user ? user.emailVerified : false;
}

export function isOnboardingPending() {
  const user = getCurrentUser();
  return user ? user.onboarding_complete === false : false;
}

export async function completeOnboarding(fullName, username, businessName) {
  username = username.toLowerCase();
  fullName = fullName ? String(fullName).trim().substring(0, MAX_ACCOUNT_NAME_LENGTH) : '';
  businessName = businessName ? String(businessName).trim().substring(0, MAX_ACCOUNT_NAME_LENGTH) : '';

  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('No authenticated user');
    
    const users = _getLocalUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], full_name: fullName, username, business_name: businessName, onboarding_complete: true };
      _saveLocalUsers(users);
      const userProfile = _buildUserObject(users[index]);
      _setCachedUser(userProfile);
      _notifyListeners();
      window.dispatchEvent(new CustomEvent('auth-change'));
      return userProfile;
    }
    return currentUser;
  }

  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('No authenticated user');

  if (!user.emailVerified) {
    throw new Error('Email must be verified before completing onboarding.');
  }

  const isAvailable = await checkUsernameAvailability(username);
  if (!isAvailable) throw new Error('Username is already taken');

  const profileData = {
    id: user.uid,
    email: user.email,
    full_name: fullName,
    username,
    business_name: businessName,
    auth_provider: user.providerData?.some(p => p.providerId === 'google.com') ? 'google' : 'email',
    onboarding_complete: true,
    plan: 'free',
    preferred_unit: 'gram',
    default_purity: 100,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profileData);

  if (error) throw new Error('Failed to complete onboarding: ' + error.message);

  const updated = await _syncProfile(user);
  _notifyListeners();
  window.dispatchEvent(new CustomEvent('auth-change'));
  return updated;
}

export async function signOut() {
  if (isFirebaseConfigured && firebaseAuth) {
    await firebaseSignOut(firebaseAuth);
  }
  _clearCachedUser();
  _notifyListeners();
}

export function getCurrentUser() {
  const cached = localStorage.getItem(CURRENT_USER_KEY);
  return cached ? JSON.parse(cached) : null;
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export async function refreshProfile() {
  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    return getCurrentUser();
  }
  
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  
  const updatedUser = await _syncProfile(user);
  _notifyListeners();
  return updatedUser;
}

export async function checkUsernameAvailability(username) {
  if (!isSupabaseConfigured) {
    const users = _getLocalUsers();
    return !users.some(u => u.username === username.toLowerCase());
  }

  // Supabase call
  const { data, error } = await supabase.rpc('check_username_availability', {
    p_username: username.toLowerCase()
  });
  
  if (error) {
    // fallback if RPC fails
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();
    return !profile;
  }
  
  return data;
}

export async function checkKhataIdAvailability(khataId) {
  return checkUsernameAvailability(khataId);
}

export async function updateProfile(updates) {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated');

  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    const users = _getLocalUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      _saveLocalUsers(users);
      const userProfile = _buildUserObject(users[index]);
      _setCachedUser(userProfile);
      _notifyListeners();
      return userProfile;
    }
    return currentUser;
  }

  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.uid);

  if (error) throw new Error(error.message);

  return await refreshProfile();
}

export async function changePassword(oldPassword, newPassword) {
  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');
    const users = _getLocalUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      if (users[index].password !== oldPassword) throw new Error('Incorrect old password');
      users[index].password = newPassword;
      _saveLocalUsers(users);
    }
    return;
  }

  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function forgotPassword(email) {
  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    throw new Error('Forgot password not available in demo mode');
  }
  await sendPasswordResetEmail(firebaseAuth, email);
}

export async function resetPassword(newPassword) {
  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    throw new Error('Reset password not available in demo mode');
  }
  
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Not authenticated for password reset');
  
  await updatePassword(user, newPassword);
}

export async function deleteAccount() {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated');

  if (!isFirebaseConfigured || !isSupabaseConfigured) {
    const users = _getLocalUsers();
    _saveLocalUsers(users.filter(u => u.id !== currentUser.id));
    _clearCachedUser();
    _notifyListeners();
    return;
  }

  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Delete profile from Supabase first
  await supabase.from('profiles').delete().eq('id', user.uid);

  // Delete user from Firebase
  await deleteUser(user);
  
  _clearCachedUser();
  _notifyListeners();
}

export async function acceptTerms(version) {
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('Not authenticated');

  const updates = {
    terms_accepted: true,
    terms_accepted_at: new Date().toISOString(),
    terms_version: version || '1.0'
  };

  return await updateProfile(updates);
}

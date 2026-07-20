import { createClient } from '@supabase/supabase-js';
import { firebaseAuth, isFirebaseConfigured } from './firebase.js';

// Supabase configuration via VITE environment variables
// Support both Vite (import.meta.env) and Node.js (process.env) for testing
const getEnv = (key) => {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
    return null;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

// Check if keys are configured
export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

/**
 * Create the Supabase client.
 *
 * When Firebase is configured, the client uses the `accessToken` option
 * to pass Firebase JWTs to Supabase. This enables Supabase Third-Party Auth:
 * PostgREST trusts the Firebase-issued JWT, and the `sub` claim (Firebase UID)
 * is available via `auth.jwt() ->> 'sub'` in RLS policies.
 *
 * When Firebase is NOT configured (demo/test mode), the client falls back
 * to the legacy Supabase Auth configuration with session persistence.
 */
function buildSupabaseClient() {
  if (!isSupabaseConfigured) return null;

  if (isFirebaseConfigured && firebaseAuth) {
    // ── FIREBASE MODE ──
    // Pass Firebase JWTs to Supabase via the accessToken callback.
    // Supabase will verify these JWTs against Firebase's public signing keys.
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      accessToken: async () => {
        const user = firebaseAuth.currentUser;
        if (!user) return null;
        return await user.getIdToken(/* forceRefresh */ false);
      },
    });
  } else {
    // ── LEGACY SUPABASE AUTH MODE ──
    // Used when Firebase is not configured (e.g., demo mode).
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sk_supabase_auth',
        storage: window.localStorage,
      },
    });
  }
}

export const supabase = buildSupabaseClient();

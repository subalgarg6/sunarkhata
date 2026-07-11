import { createClient } from '@supabase/supabase-js';

// ============================================
// PASTE YOUR SUPABASE KEYS HERE
// Get them from: Supabase Dashboard → Settings → API
// ============================================
const SUPABASE_URL = 'YOUR_SUPABASE_URL';    // e.g. https://xyzabc123.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';   // e.g. eyJhbGciOiJI...

// Check if keys are configured
export const isSupabaseConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY';

// Create the Supabase client
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    !!rawUrl &&
    rawUrl.startsWith('https://') &&
    !rawUrl.includes('placeholder') &&
    rawUrl !== 'your_supabase_project_url' &&
    !!rawKey &&
    rawKey !== 'placeholder_key' &&
    rawKey !== 'your_supabase_anon_key' &&
    !rawKey.includes('placeholder') &&
    rawKey.length > 20
  );
};

export const getSupabaseConfigStatus = () => {
  const missing: string[] = [];
  if (!rawUrl || rawUrl.includes('placeholder') || rawUrl === 'your_supabase_project_url') {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!rawKey || rawKey.includes('placeholder') || rawKey === 'your_supabase_anon_key' || rawKey.length <= 20) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }
  return {
    configured: isSupabaseConfigured(),
    missing,
    url: rawUrl,
  };
};

/**
 * Maps Supabase Auth, network, and validation errors into helpful, human-friendly messages.
 */
export const mapAuthError = (err: unknown): string => {
  if (!isSupabaseConfigured()) {
    return 'Supabase is not configured. Please check the application environment settings.';
  }

  if (!err) {
    return 'An unexpected authentication error occurred. Please try again.';
  }

  const rawMessage = (err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : String(err)).trim();
  const lower = rawMessage.toLowerCase();

  // Invalid login credentials
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid email or password') ||
    lower.includes('user not found')
  ) {
    return 'Email or password is incorrect.';
  }

  // User already exists
  if (
    lower.includes('user already registered') ||
    lower.includes('already registered') ||
    lower.includes('already exists') ||
    lower.includes('email_exists')
  ) {
    return 'An account with this email already exists.';
  }

  // Password requirements
  if (
    lower.includes('password should be at least') ||
    lower.includes('weak_password') ||
    lower.includes('password is too weak') ||
    lower.includes('password must be')
  ) {
    return 'Please use a stronger password.';
  }

  // Network / server connection error
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('fetch error') ||
    lower.includes('networkrequestfailed') ||
    lower.includes('econnrefused') ||
    lower.includes('connection refused')
  ) {
    return 'Unable to connect to the authentication service. Please try again.';
  }

  // Email verification required
  if (lower.includes('email not confirmed')) {
    return 'Please verify your email address to sign in.';
  }

  // Rate limiting
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }

  return rawMessage || 'Unable to connect to the authentication service. Please try again.';
};

// Safe fallback credentials so createClient never throws on startup if .env is missing/empty
const safeUrl = isSupabaseConfigured() ? rawUrl : 'https://placeholder-project.supabase.co';
const safeKey = isSupabaseConfigured() ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

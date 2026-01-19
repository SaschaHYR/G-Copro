import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite's import.meta.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate that required environment variables are set
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.');
}

// Create Supabase client with enhanced security configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  // Enable auto-refresh of JWT tokens
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // Enable realtime functionality
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Global fetch options
  global: {
    fetch: (url, options = {}) => {
      // Add security headers
      const headers = new Headers(options.headers);
      headers.set('X-Client-Info', 'web-app');
      headers.set('X-Requested-With', 'XMLHttpRequest');

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
    }
  }
});
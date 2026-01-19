import { createClient } from '@supabase/supabase-js';

// Use environment variables for configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://krxfkcdnrsywwofefqpp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGZrY2RucnN5d3dvZmVmcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDA1MDcsImV4cCI6MjA4NDQxNjUwN30.sRFUMS3BCM4OTb1Luk2gOdIbrizfxKHepLO3iqKmKw8";

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

      // Remove credentials to avoid CORS issues with wildcard origins
      const newOptions = { ...options, headers, credentials: 'omit' };

      return fetch(url, newOptions);
    }
  }
});
import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite's import.meta.env with fallback values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://krxfkcdnrsywwofefqpp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGZrY2RucnN5d3dvZmVmcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDA1MDcsImV4cCI6MjA4NDQxNjUwN30.sRFUMS3BCM4OTb1Luk2gOdIbrizfxKHepLO3iqKmKw8";

// Validate Supabase URL
const validateSupabaseUrl = (url: string): string => {
  // Remove any trailing slashes
  let validatedUrl = url.replace(/\/$/, '');

  // Ensure the URL starts with https://
  if (!validatedUrl.startsWith('https://')) {
    validatedUrl = `https://${validatedUrl}`;
  }

  return validatedUrl;
};

const validatedSupabaseUrl = validateSupabaseUrl(SUPABASE_URL);

// Create Supabase client with basic configuration
export const supabase = createClient(validatedSupabaseUrl, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
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

// Create a custom fetch function with CORS handling
const createFetchWithCORS = () => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Add custom headers for CORS
    const headers = new Headers(options.headers || {});
    headers.set('X-Client-Info', 'web-app');
    headers.set('X-Requested-With', 'XMLHttpRequest');
    headers.set('apikey', SUPABASE_PUBLISHABLE_KEY);
    headers.set('Authorization', `Bearer ${SUPABASE_PUBLISHABLE_KEY}`);
    headers.set('Content-Type', 'application/json');

    // Add timeout to the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout

    try {
      // Log the request for debugging
      console.log('Making request to:', url);
      console.log('With headers:', Object.fromEntries(headers.entries()));

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
        mode: 'cors' // Explicitly set CORS mode
      });

      clearTimeout(timeoutId);

      // Log response status for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Response error data:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Fetch error details:', error);

      // If the error is a CORS error, try with a proxy
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.log('Attempting to use proxy for CORS issue...');
        // Here you could implement a proxy solution if needed
      }

      throw error;
    }
  };
};

// Create Supabase client with enhanced configuration
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
  },
  global: {
    fetch: createFetchWithCORS()
  }
});
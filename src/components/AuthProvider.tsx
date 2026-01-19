"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // True initially
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async (userId: string) => {
    console.log('[AuthProvider] Fetching user data for ID:', userId);
    try {
      const { data, error } = await supabase
        .from('user_informations')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthProvider] User data fetch error:', error);
        throw error;
      }
      console.log('[AuthProvider] User data fetched:', data);
      return data;
    } catch (err: any) {
      console.error('[AuthProvider] Error in fetchUserData:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const initializeAuth = async () => {
      console.log('[AuthProvider] Initializing authentication...');
      setLoading(true); // Ensure loading is true at the start of initialization
      setError(null); // Clear any previous errors

      try {
        if (typeof window === 'undefined') {
          console.log('[AuthProvider] Running in non-browser environment, skipping auth init.');
          return; // Exit early for SSR or similar environments
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthProvider] Supabase session check complete. Session:', session, 'Error:', sessionError);

        if (sessionError) {
          console.error('[AuthProvider] Session error during initialization:', sessionError);
          setError(sessionError.message);
          setUser(null);
        } else if (session) {
          try {
            const userData = await fetchUserData(session.user.id);
            if (userData) {
              setUser(userData);
            } else {
              console.warn('[AuthProvider] User not found in database after session, signing out.');
              await supabase.auth.signOut();
              setUser(null);
              setError('User profile not found. Please sign up or contact support.');
            }
          } catch (userError: any) {
            console.error('[AuthProvider] Error fetching user data after session:', userError.message);
            await supabase.auth.signOut();
            setUser(null);
            setError(userError.message || 'Failed to load user profile.');
          }
        } else {
          console.log('[AuthProvider] No active session found.');
          setUser(null);
        }
      } catch (err: any) {
        console.error('[AuthProvider] Unexpected error during authentication initialization:', err.message);
        setError(err.message || 'Failed to initialize authentication');
        setUser(null);
      } finally {
        if (isMounted) {
          console.log('[AuthProvider] Authentication initialization finished. Setting loading to false.');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const setupAuthListener = () => {
      console.log('[AuthProvider] Setting up auth state change listener.');
      const { data: listenerData } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthProvider] Auth state change event:', event, 'Session:', session);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            try {
              const userData = await fetchUserData(session.user.id);
              if (userData) {
                setUser(userData);
                setError(null); // Clear error on successful sign-in/refresh
              } else {
                console.warn('[AuthProvider] User not found in database on auth state change, signing out.');
                await supabase.auth.signOut();
                setUser(null);
                setError('User profile not found. Please sign up or contact support.');
              }
            } catch (userError: any) {
              console.error('[AuthProvider] Error fetching user data on auth state change:', userError.message);
              await supabase.auth.signOut();
              setUser(null);
              setError(userError.message || 'Failed to load user profile on auth change.');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] User signed out.');
          setUser(null);
          setError(null); // Clear error on sign out
        }
        // For other events like PASSWORD_RECOVERY, USER_UPDATED, etc., we don't necessarily need to change user state
      });

      authListener = listenerData;
    };

    setupAuthListener();

    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        console.log('[AuthProvider] Unsubscribing from auth state change listener.');
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Display loading or error state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive">Erreur d'authentification</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
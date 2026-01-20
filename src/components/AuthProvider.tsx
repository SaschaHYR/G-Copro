"use client";

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string): Promise<User | null> => {
    console.log(`[AuthProvider] Fetching user data for ID: ${userId}`);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[AuthProvider] fetchUserData for ${userId} timed out after 15 seconds.`);
      abortController.abort();
    }, 15000); // 15 seconds timeout

    try {
      const { data, error } = await supabase
        .from('user_informations')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      clearTimeout(timeoutId); // Clear timeout if request completes

      if (error) {
        console.error('[AuthProvider] User data fetch error:', error);
        return null;
      }

      if (!data) {
        console.warn('[AuthProvider] No user data found for ID:', userId);
        return null;
      }

      console.log('[AuthProvider] User data fetched successfully:', data);
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId); // Ensure timeout is cleared on error too
      if (err.name === 'AbortError') {
        console.error('[AuthProvider] User data fetch aborted (likely due to timeout).');
      } else {
        console.error('[AuthProvider] Error in fetchUserData:', err.message);
      }
      return null;
    }
  }, []);

  const login = async (email: string, password: string) => {
    console.log(`[AuthProvider] Login attempt for: ${email}`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthProvider] Login error:', error.message);
        throw error;
      }

      if (data.user) {
        const userData = await fetchUserData(data.user.id);
        if (userData) {
          setUser(userData);
          console.log('[AuthProvider] Login successful, user data set:', userData);
        } else {
          console.warn('[AuthProvider] Login successful but no user data found');
          setUser(null);
        }
      }
    } catch (error: any) {
      console.error('[AuthProvider] Login failed:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    console.log('[AuthProvider] Logging out user');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      console.log('[AuthProvider] Logout successful');
    } catch (error: any) {
      console.error('[AuthProvider] Logout error:', error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log(`[AuthProvider] Signup attempt for: ${email}`);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[AuthProvider] Signup error:', error.message);
        throw error;
      }

      if (data.user) {
        console.log('[AuthProvider] Signup successful, user created:', data.user.id);
        // User will be in "En attente" role until approved by admin
      }
    } catch (error: any) {
      console.error('[AuthProvider] Signup failed:', error.message);
      throw error;
    }
  };

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] Auth state changed: ${event}`, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await fetchUserData(session.user.id);
        if (userData) {
          setUser(userData);
          console.log('[AuthProvider] User signed in and data loaded:', userData);
        } else {
          console.warn('[AuthProvider] User signed in but no data found');
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        console.log('[AuthProvider] User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthProvider] Token refreshed');
      } else if (event === 'USER_UPDATED') {
        console.log('[AuthProvider] User updated');
      }
    });

    // Check initial session
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (userData) {
            setUser(userData);
            console.log('[AuthProvider] Initial session found, user data loaded:', userData);
          } else {
            console.warn('[AuthProvider] Initial session found but no user data');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[AuthProvider] Error checking initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const value = {
    user,
    loading,
    login,
    logout,
    signUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
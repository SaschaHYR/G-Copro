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
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

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
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const [realtimeSubscription, setRealtimeSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  const fetchUserData = useCallback(async (userId: string): Promise<User | null> => {
    console.log(`[AuthProvider] Fetching user data for ID: ${userId}`);

    // Check cache first
    if (userCache[userId]) {
      console.log(`[AuthProvider] User data found in cache for ID: ${userId}`);
      return userCache[userId];
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[AuthProvider] fetchUserData for ${userId} timed out after 15 seconds.`);
      abortController.abort();
    }, 15000);

    try {
      console.log(`[AuthProvider] Starting Supabase query for user_informations for ID: ${userId}`);
      const { data, error } = await supabase
        .from('user_informations')
        .select('id, username, role, copro, first_name, last_name, actif')
        .eq('id', userId)
        .limit(1);

      clearTimeout(timeoutId);

      if (error) {
        console.error('[AuthProvider] Supabase user data query error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('[AuthProvider] No user data found for ID:', userId);
        return null;
      }

      const userData = data[0] as User;
      console.log('[AuthProvider] User data fetched successfully from Supabase:', userData);

      // Update cache
      setUserCache(prevCache => ({ ...prevCache, [userId]: userData }));

      return userData;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error('[AuthProvider] User data fetch aborted (likely due to timeout).');
      } else {
        console.error('[AuthProvider] Error in fetchUserData:', err.message);
      }
      return null;
    }
  }, [userCache]);

  const setupRealtimeSubscription = useCallback((userId: string) => {
    console.log(`[AuthProvider] Setting up realtime subscription for user ID: ${userId}`);

    // Clean up any existing subscription
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
    }

    const channel = supabase
      .channel(`user_informations_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_informations',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log(`[AuthProvider] Realtime update received for user ID: ${userId}`, payload);
          const updatedUser = payload.new as User;
          setUserCache(prevCache => ({ ...prevCache, [userId]: updatedUser }));
          setUser(updatedUser);
        }
      )
      .subscribe();

    // Store the unsubscribe function
    setRealtimeSubscription({
      unsubscribe: () => {
        console.log(`[AuthProvider] Unsubscribing from realtime updates for user ID: ${userId}`);
        supabase.removeChannel(channel);
      }
    });
  }, [realtimeSubscription]);

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
          setupRealtimeSubscription(data.user.id); // Setup realtime subscription after login
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
      // Clean up realtime subscription
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
        setRealtimeSubscription(null);
      }

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
      }
    } catch (error: any) {
      console.error('[AuthProvider] Signup failed:', error.message);
      throw error;
    }
  };

  const refreshUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (authUser) {
        const userData = await fetchUserData(authUser.id);
        if (userData) {
          setUser(userData);
          setupRealtimeSubscription(authUser.id); // Setup realtime subscription after refresh
          console.log('[AuthProvider] User profile refreshed:', userData);
        } else {
          console.warn('[AuthProvider] Failed to refresh user profile: No user data found.');
          setUser(null);
        }
      } else {
        console.warn('[AuthProvider] Failed to refresh user profile: No authenticated user.');
        setUser(null);
      }
    } catch (error: any) {
      console.error('[AuthProvider] Error refreshing user profile:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, setupRealtimeSubscription]);

  useEffect(() => {
    console.log('[AuthProvider] Setting up auth listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthProvider] Auth state changed: ${event}`, session?.user?.id ? `User ID: ${session.user.id}` : 'No user');

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
        console.log(`[AuthProvider] Handling ${event} event for user ID: ${session.user.id}`);
        const userData = await fetchUserData(session.user.id);
        if (userData) {
          setUser(userData);
          setupRealtimeSubscription(session.user.id); // Setup realtime subscription after auth event
          console.log('[AuthProvider] User data loaded after auth event:', userData);
        } else {
          console.warn('[AuthProvider] User signed in/updated/initial session but no data found');
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clean up realtime subscription
        if (realtimeSubscription) {
          realtimeSubscription.unsubscribe();
          setRealtimeSubscription(null);
        }
        setUser(null);
        console.log('[AuthProvider] User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthProvider] Token refreshed');
      }
      setLoading(false);
    });

    const checkInitialSessionDirectly = async () => {
      console.log('[AuthProvider] Checking initial session directly...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthProvider] Error getting initial session:', error);
          setUser(null);
        } else if (session?.user) {
          console.log('[AuthProvider] Initial session found directly, user ID:', session.user.id);
          const userData = await fetchUserData(session.user.id);
          if (userData) {
            setUser(userData);
            setupRealtimeSubscription(session.user.id); // Setup realtime subscription for initial session
            console.log('[AuthProvider] Initial session user data loaded:', userData);
          } else {
            console.warn('[AuthProvider] Initial session found directly but no user data');
            setUser(null);
          }
        } else {
          console.log('[AuthProvider] No initial session found directly.');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthProvider] Error in checkInitialSessionDirectly:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSessionDirectly();

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener');
      subscription.unsubscribe();

      // Clean up realtime subscription
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, [fetchUserData, setupRealtimeSubscription, realtimeSubscription]);

  const value = {
    user,
    loading,
    login,
    logout,
    signUp,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
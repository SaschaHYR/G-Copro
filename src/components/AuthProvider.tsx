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

  const fetchUserData = useCallback(async (userId: string): Promise<User | null> => {
    console.log(`[AuthProvider] Fetching user data for ID: ${userId}`);

    if (userCache[userId]) {
      console.log(`[AuthProvider] User data found in cache for ID: ${userId}`);
      return userCache[userId];
    }

    try {
      console.log(`[AuthProvider] Starting direct query to user_informations for ID: ${userId}`);

      const { data, error } = await supabase
        .from('user_informations')
        .select('*')
        .eq('id', userId)
        .limit(1);

      if (error) {
        console.error('[AuthProvider] Direct query error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('[AuthProvider] No user data found for ID:', userId);
        return null;
      }

      const userData = data[0] as User;
      console.log('[AuthProvider] User data fetched successfully via direct query:', userData);

      setUserCache(prevCache => ({ ...prevCache, [userId]: userData }));

      return userData;
    } catch (err: any) {
      console.error('[AuthProvider] Error in fetchUserData:', err.message);
      return null;
    }
  }, [userCache]);

  const login = async (email: string, password: string) => {
    console.log(`[AuthProvider] Login attempt for: ${email}`);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthProvider] Login error:', error.message);
        throw error;
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
      setUserCache({});
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
  }, [fetchUserData]);

  useEffect(() => {
    let currentRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const handleAuthStateChange = async (event: string, session: any | null) => {
      console.log(`[AuthProvider] Auth state changed: ${event}`, session?.user?.id ? `User ID: ${session.user.id}` : 'No user');

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
        console.log(`[AuthProvider] Handling ${event} event for user ID: ${session.user.id}`);
        const userData = await fetchUserData(session.user.id);
        if (userData) {
          setUser(userData);
          if (currentRealtimeChannel) {
            console.log(`[AuthProvider] Unsubscribing existing realtime channel for user ID: ${session.user.id}`);
            supabase.removeChannel(currentRealtimeChannel);
          }
          console.log(`[AuthProvider] Setting up new realtime subscription for user ID: ${session.user.id}`);
          currentRealtimeChannel = supabase
            .channel(`user_informations_changes_${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'user_informations',
                filter: `id=eq.${session.user.id}`
              },
              (payload) => {
                console.log(`[AuthProvider] Realtime update received for user ID: ${session.user.id}`, payload);
                const updatedUser = payload.new as User;
                setUserCache(prevCache => ({ ...prevCache, [session.user.id]: updatedUser }));
                setUser(updatedUser);
              }
            )
            .subscribe();
          console.log('[AuthProvider] User data loaded after auth event:', userData);
        } else {
          console.warn('[AuthProvider] User signed in/updated/initial session but no data found');
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        if (currentRealtimeChannel) {
          console.log('[AuthProvider] Unsubscribing realtime channel on SIGNED_OUT');
          supabase.removeChannel(currentRealtimeChannel);
          currentRealtimeChannel = null;
        }
        setUser(null);
        setUserCache({});
        console.log('[AuthProvider] User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthProvider] Token refreshed');
      }
      setLoading(false);
    };

    // Abonnement aux changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authSubscription = subscription;

    const checkInitialSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthProvider] Error getting initial session:', error);
          setUser(null);
        } else if (session?.user) {
          await handleAuthStateChange('INITIAL_SESSION', session);
        } else {
          console.log('[AuthProvider] No initial session found directly.');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthProvider] Error in checkInitialSession:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener and realtime channel on unmount');
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      if (currentRealtimeChannel) {
        supabase.removeChannel(currentRealtimeChannel);
      }
    };
  }, [fetchUserData, userCache]);

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
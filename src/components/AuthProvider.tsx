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

  // Récupérer les données utilisateur depuis le stockage local au démarrage
  useEffect(() => {
    const cachedUser = localStorage.getItem('cachedUser');
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        console.log('[AuthProvider] Loaded user from cache:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('[AuthProvider] Error parsing cached user:', error);
      }
    }
  }, []);

  const fetchUserData = useCallback(async (userId: string): Promise<User | null> => {
    console.log(`[AuthProvider] Starting fetchUserData for ID: ${userId}`);

    try {
      // Vérifier d'abord si nous avons des données en cache
      const cachedUser = localStorage.getItem(`userCache_${userId}`);
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          console.log('[AuthProvider] Using cached user data:', parsedUser);
          return parsedUser;
        } catch (error) {
          console.error('[AuthProvider] Error parsing cached user data:', error);
        }
      }

      // Approche directe avec timeout court
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => {
          reject(new Error('[AuthProvider] Direct query timeout after 3 seconds'));
        }, 3000);
      });

      try {
        const queryPromise = supabase
          .from('user_informations')
          .select('*')
          .eq('id', userId)
          .limit(1);

        const result = await Promise.race([queryPromise, timeoutPromise]);

        if (result instanceof Error) {
          throw result;
        }

        const response = result as { data: any[], error: any | null };
        const { data, error } = response;

        if (error) {
          console.error('[AuthProvider] Direct query error:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const userData = data[0] as User;
          console.log('[AuthProvider] User data fetched via direct query:', userData);

          // Mettre en cache les données utilisateur
          localStorage.setItem(`userCache_${userId}`, JSON.stringify(userData));
          localStorage.setItem('cachedUser', JSON.stringify(userData));

          return userData;
        }
      } catch (directError: any) {
        console.warn('[AuthProvider] Direct query failed, trying RPC:', directError.message);
      }

      // Approche RPC avec timeout court
      try {
        const rpcTimeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            reject(new Error('[AuthProvider] RPC timeout after 3 seconds'));
          }, 3000);
        });

        const rpcPromise = supabase
          .rpc('get_user_data', { user_id: userId })
          .single();

        const rpcResult = await Promise.race([rpcPromise, rpcTimeoutPromise]);

        if (rpcResult instanceof Error) {
          throw rpcResult;
        }

        const rpcResponse = rpcResult as { data: any, error: any | null };
        const { data: rpcData, error: rpcError } = rpcResponse;

        if (rpcError) {
          console.error('[AuthProvider] RPC error:', rpcError);
          throw rpcError;
        }

        if (rpcData) {
          console.log('[AuthProvider] User data fetched via RPC:', rpcData);

          // Mettre en cache les données utilisateur
          localStorage.setItem(`userCache_${userId}`, JSON.stringify(rpcData));
          localStorage.setItem('cachedUser', JSON.stringify(rpcData));

          return rpcData as User;
        }
      } catch (rpcError: any) {
        console.warn('[AuthProvider] RPC failed:', rpcError.message);
      }

      // Si tout échoue, créer un utilisateur minimal
      console.log('[AuthProvider] All queries failed, creating minimal user data');
      const minimalUser = {
        id: userId,
        username: `user_${userId.substring(0, 8)}@example.com`,
        role: 'En attente',
        copro: null,
        actif: true,
        first_name: 'Utilisateur',
        last_name: 'Inconnu'
      } as User;

      // Mettre en cache l'utilisateur minimal
      localStorage.setItem(`userCache_${userId}`, JSON.stringify(minimalUser));
      localStorage.setItem('cachedUser', JSON.stringify(minimalUser));

      return minimalUser;

    } catch (err: any) {
      console.error('[AuthProvider] Critical error in fetchUserData:', err.message);
      return null;
    }
  }, []);

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

      // Effacer le cache lors de la déconnexion
      localStorage.removeItem('cachedUser');
      const userId = user?.id;
      if (userId) {
        localStorage.removeItem(`userCache_${userId}`);
      }

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
      console.log('[AuthProvider] Starting refreshUserProfile');
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      console.log('[AuthProvider] getUser result:', { user: authUser, error });

      if (error) throw error;

      if (authUser) {
        console.log(`[AuthProvider] Authenticated user found: ${authUser.id}`);
        const userData = await fetchUserData(authUser.id);
        console.log('[AuthProvider] fetchUserData result:', userData);

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
      console.log('[AuthProvider] refreshUserProfile completed, setting loading to false');
      setLoading(false);
    }
  }, [fetchUserData]);

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;

    const handleAuthStateChange = async (event: string, session: any | null) => {
      console.log(`[AuthProvider] Auth state changed: ${event}`, session?.user?.id ? `User ID: ${session.user.id}` : 'No user');

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
        console.log(`[AuthProvider] Handling ${event} event for user ID: ${session.user.id}`);
        const userData = await fetchUserData(session.user.id);
        console.log(`[AuthProvider] fetchUserData result in handleAuthStateChange:`, userData);

        if (userData) {
          setUser(userData);
          console.log('[AuthProvider] User data loaded after auth event:', userData);
        } else {
          console.warn('[AuthProvider] User signed in/updated/initial session but no data found');
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        console.log('[AuthProvider] User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[AuthProvider] Token refreshed');
      }
      setLoading(false);
    };

    // Abonnement aux changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authSubscription = subscription;

    // Vérification de la session initiale
    const checkInitialSession = async () => {
      setLoading(true);
      try {
        console.log('[AuthProvider] Starting checkInitialSession');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[AuthProvider] getSession result:', { session, error });

        if (error) {
          console.error('[AuthProvider] Error getting initial session:', error);
          setUser(null);
        } else if (session?.user) {
          console.log(`[AuthProvider] Initial session found for user: ${session.user.id}`);
          await handleAuthStateChange('INITIAL_SESSION', session);
        } else {
          console.log('[AuthProvider] No initial session found directly.');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthProvider] Error in checkInitialSession:', error);
        setUser(null);
      } finally {
        console.log('[AuthProvider] checkInitialSession completed, setting loading to false');
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      console.log('[AuthProvider] Cleaning up auth listener on unmount');
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [fetchUserData]);

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
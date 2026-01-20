"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { useNavigate } from 'react-router-dom';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degradedMode, setDegradedMode] = useState(false);
  const navigate = useNavigate();

  // Configuration adaptée pour le développement local
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  const fetchUserData = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('user_informations')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

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
      console.error('[AuthProvider] Error in fetchUserData:', err.message);
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log('[AuthProvider] Attempting login for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthProvider] Login error:', error);
        throw error;
      }

      console.log('[AuthProvider] Login successful, session:', data.session);

      if (data.user) {
        const userData = await fetchUserData(data.user.id);
        if (userData) {
          setUser(userData);
          setError(null);
          setDegradedMode(false);
        } else {
          console.warn('[AuthProvider] User not found in database after login. Signing out.');
          await supabase.auth.signOut();
          throw new Error('User profile not found. Please sign up or contact support.');
        }
      }
    } catch (err: any) {
      console.error('[AuthProvider] Login failed:', err.message);
      throw err;
    }
  }, [fetchUserData]);

  const logout = useCallback(async () => {
    console.log('[AuthProvider] Attempting logout');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthProvider] Logout error:', error);
        throw error;
      }
      console.log('[AuthProvider] Logout successful');
      setUser(null);
      navigate('/login');
    } catch (err: any) {
      console.error('[AuthProvider] Logout failed:', err.message);
      throw err;
    }
  }, [navigate]);

  const signUp = useCallback(async (email: string, password: string) => {
    console.log('[AuthProvider] Attempting signup for:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        console.error('[AuthProvider] Signup error:', error);
        throw error;
      }

      console.log('[AuthProvider] Signup successful, user:', data.user);

      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_informations')
          .insert({
            id: data.user.id,
            username: email,
            role: 'En attente',
            actif: true,
            first_name: '',
            last_name: '',
            copro: null
          });

        if (profileError) {
          console.error('[AuthProvider] Profile creation error:', profileError);
          throw profileError;
        }
      }
    } catch (err: any) {
      console.error('[AuthProvider] Signup failed:', err.message);
      throw err;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const initializeAuth = async () => {
      console.log('[AuthProvider] Initializing authentication...');
      setLoading(true); 
      setError(null);

      try {
        // Use supabase.auth.getUser() for a more direct way to get the current user
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('[AuthProvider] Supabase getUser error:', userError);
          throw userError; 
        }

        if (supabaseUser) {
          console.log('[AuthProvider] Active user found, fetching profile data...');
          const userData = await fetchUserData(supabaseUser.id);

          if (userData) {
            console.log('[AuthProvider] User data loaded successfully');
            if (isMounted) {
              setUser(userData);
              setError(null);
              setDegradedMode(false);
            }
          } else {
            console.warn('[AuthProvider] User found in auth.users but not in public.user_informations. Signing out.');
            await supabase.auth.signOut();
            if (isMounted) {
              setUser(null);
              setError('User profile not found. Please sign up or contact support.');
            }
          }
        } else {
          console.log('[AuthProvider] No active user found.');
          if (isMounted) {
            setUser(null);
            setError(null);
            setDegradedMode(false);
          }
        }
      } catch (err: any) {
        console.error('[AuthProvider] Error during authentication initialization:', err.message);
        if (isMounted) {
          setError(err.message || 'Failed to initialize authentication. Please check your connection.');
          setUser(null);
          setDegradedMode(true);
        }
      } finally {
        // This finally block ensures loading is always set to false after the initial check
        if (isMounted) {
          console.log('[AuthProvider] Authentication initialization completed.');
          setLoading(false);
        }
      }
    };

    // Setup auth state change listener
    const setupAuthListener = () => {
      console.log('[AuthProvider] Setting up auth state change listener.');
      const { data: listenerData } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthProvider] Auth state change:', event);
        if (!isMounted) return; // Ensure component is still mounted

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            try {
              const userData = await fetchUserData(session.user.id);
              if (userData) {
                console.log('[AuthProvider] User signed in/refreshed:', userData.username);
                setUser(userData);
                setError(null);
                setDegradedMode(false);
              } else {
                console.warn('[AuthProvider] User not found in database on auth state change. Signing out.');
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
          setError(null);
          setDegradedMode(false);
        }
      });

      authListener = listenerData;
    };

    initializeAuth(); // Call immediately on mount
    setupAuthListener(); // Set up listener

    return () => {
      console.log('[AuthProvider] Cleaning up...');
      isMounted = false;
      if (authListener && authListener.subscription) {
        console.log('[AuthProvider] Cleaning up auth listener.');
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchUserData]); // Dependencies for useEffect

  if (loading) { 
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Chargement de l'authentification...</p>
          {isLocalhost && (
            <p className="text-sm text-muted-foreground/70">
              Environnement de développement - cela peut prendre plus de temps
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-destructive">Erreur d'authentification</h2>
          <p className="text-muted-foreground">{error}</p>

          {isLocalhost && (
            <div className="bg-background/80 p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">Conseils pour le développement local :</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Vérifiez votre connexion Internet</li>
                <li>• Assurez-vous que Supabase est accessible</li>
                <li>• Essayez de vider le cache du navigateur</li>
                <li>• Si le problème persiste, vérifiez la console pour plus de détails</li>
              </ul>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>

          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            Se connecter à nouveau
          </button>
        </div>
      </div>
    );
  }

  if (degradedMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-warning">Mode dégradé</h2>
          <p className="text-muted-foreground">
            L'application fonctionne avec des fonctionnalités limitées en raison de problèmes de connexion.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Réessayer la connexion
          </button>

          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            Se connecter à nouveau
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
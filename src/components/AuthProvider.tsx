"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const navigate = useNavigate();

  // Augmenter les timeouts pour les opérations d'authentification
  const AUTH_TIMEOUT = 30000; // 30 secondes au lieu de 10
  const SESSION_TIMEOUT = 15000; // 15 secondes pour la vérification de session

  const fetchUserData = async (userId: string) => {
    console.log('[AuthProvider] Fetching user data for ID:', userId);

    // Créer une promesse avec timeout
    const fetchWithTimeout = new Promise(async (resolve, reject) => {
      // Définir un timeout plus long
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout: Unable to fetch user data within the time limit'));
      }, AUTH_TIMEOUT);

      try {
        const { data, error } = await supabase
          .from('user_informations')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        // Clear timeout si la requête réussit
        clearTimeout(timeoutId);

        if (error) {
          console.error('[AuthProvider] User data fetch error:', error);
          reject(error);
          return;
        }

        console.log('[AuthProvider] User data fetched:', data);
        resolve(data);
      } catch (err: any) {
        // Clear timeout si une erreur se produit
        clearTimeout(timeoutId);
        console.error('[AuthProvider] Error in fetchUserData:', err.message);
        reject(err);
      }
    });

    return fetchWithTimeout;
  };

  const login = async (email: string, password: string) => {
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
      // Le listener onAuthStateChange va gérer la mise à jour de l'utilisateur
    } catch (err: any) {
      console.error('[AuthProvider] Login failed:', err.message);
      throw err;
    }
  };

  const logout = async () => {
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
  };

  const signUp = async (email: string, password: string) => {
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

      // Create user profile in user_informations table
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
          // Even if profile creation fails, the auth signup succeeded
        }
      }

      // Le listener onAuthStateChange va gérer la mise à jour de l'utilisateur
    } catch (err: any) {
      console.error('[AuthProvider] Signup failed:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    let initializationTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      console.log('[AuthProvider] Initializing authentication...');
      setLoading(true);
      setError(null);

      // Timeout pour l'initialisation complète
      initializationTimeout = setTimeout(() => {
        if (isMounted) {
          console.error('[AuthProvider] Authentication initialization timeout');
          setError('Timeout: Authentication initialization took too long');
          setLoading(false);
        }
      }, AUTH_TIMEOUT);

      try {
        if (typeof window === 'undefined') {
          console.log('[AuthProvider] Running in non-browser environment, skipping auth init.');
          clearTimeout(initializationTimeout);
          return;
        }

        // Vérifier la session avec timeout
        const sessionCheck = new Promise(async (resolve, reject) => {
          const sessionTimeout = setTimeout(() => {
            reject(new Error('Timeout: Session check took too long'));
          }, SESSION_TIMEOUT); // 15 secondes pour la vérification de session

          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            clearTimeout(sessionTimeout);

            if (sessionError) {
              console.error('[AuthProvider] Session error during initialization:', sessionError);
              reject(sessionError);
              return;
            }

            console.log('[AuthProvider] Supabase session check complete. Session:', session);
            resolve(session);
          } catch (err) {
            clearTimeout(sessionTimeout);
            reject(err);
          }
        });

        const session = await sessionCheck;

        if (session) {
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
        // Toujours nettoyer le timeout
        clearTimeout(initializationTimeout);

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
                setError(null);
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
          setError(null);
        }
      });

      authListener = listenerData;
    };

    setupAuthListener();

    return () => {
      isMounted = false;
      clearTimeout(initializationTimeout);
      if (authListener && authListener.subscription) {
        console.log('[AuthProvider] Unsubscribing from auth state change listener.');
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

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
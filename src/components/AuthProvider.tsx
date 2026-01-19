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
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  // Configuration adaptée pour le développement local
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const MAX_RETRIES = 3;

  // Timeouts adaptés à l'environnement
  const AUTH_TIMEOUT = isLocalhost ? 60000 : 30000; // 60s en localhost, 30s en production
  const SESSION_TIMEOUT = isLocalhost ? 45000 : 15000; // 45s en localhost, 15s en production
  const RETRY_DELAY = 5000; // 5 secondes entre les tentatives

  const fetchUserData = async (userId: string, attempt = 1): Promise<User | null> => {
    console.log(`[AuthProvider] Attempt ${attempt}: Fetching user data for ID:`, userId);

    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (attempt < MAX_RETRIES) {
          console.warn(`[AuthProvider] Timeout on attempt ${attempt}, retrying...`);
          fetchUserData(userId, attempt + 1).then(resolve).catch(reject);
        } else {
          reject(new Error(`Timeout: Unable to fetch user data after ${MAX_RETRIES} attempts`));
        }
      }, AUTH_TIMEOUT);

      try {
        const { data, error } = await supabase
          .from('user_informations')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        clearTimeout(timeoutId);

        if (error) {
          console.error('[AuthProvider] User data fetch error:', error);
          reject(error);
          return;
        }

        if (!data) {
          console.warn('[AuthProvider] No user data found for ID:', userId);
          resolve(null);
          return;
        }

        console.log('[AuthProvider] User data fetched successfully:', data);
        resolve(data);
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('[AuthProvider] Error in fetchUserData:', err.message);

        if (attempt < MAX_RETRIES) {
          console.log(`[AuthProvider] Retrying fetchUserData (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          setTimeout(() => {
            fetchUserData(userId, attempt + 1).then(resolve).catch(reject);
          }, RETRY_DELAY);
        } else {
          reject(new Error(`Failed to fetch user data after ${MAX_RETRIES} attempts: ${err.message}`));
        }
      }
    });
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
        }
      }
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

      initializationTimeout = setTimeout(() => {
        if (isMounted) {
          console.error('[AuthProvider] Authentication initialization timeout');
          setError('Timeout: Authentication initialization took too long. Please check your internet connection.');
          setLoading(false);
        }
      }, AUTH_TIMEOUT);

      try {
        if (typeof window === 'undefined') {
          console.log('[AuthProvider] Running in non-browser environment, skipping auth init.');
          clearTimeout(initializationTimeout);
          return;
        }

        // Configuration spécifique pour localhost
        if (isLocalhost) {
          console.log('[AuthProvider] Detected localhost environment, adjusting settings...');
          // Configuration spécifique pour améliorer la stabilité en localhost
          supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL || "https://krxfkcdnrsywwofefqpp.supabase.co",
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGZrY2RucnN5d3dvZmVmcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDA1MDcsImV4cCI6MjA4NDQxNjUwN30.sRFUMS3BCM4OTb1Luk2gOdIbrizfxKHepLO3iqKmKw8",
            {
              auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: {
                  getItem: (key) => localStorage.getItem(key),
                  setItem: (key, value) => localStorage.setItem(key, value),
                  removeItem: (key) => localStorage.removeItem(key),
                },
              },
              realtime: {
                params: {
                  eventsPerSecond: 5, // Réduit pour localhost
                },
              },
            }
          );
        }

        // Vérification de session avec réessais
        const checkSessionWithRetry = async (attempt = 1): Promise<any> => {
          return new Promise(async (resolve, reject) => {
            const sessionTimeout = setTimeout(() => {
              if (attempt < MAX_RETRIES) {
                console.warn(`[AuthProvider] Session check timeout (attempt ${attempt}), retrying...`);
                checkSessionWithRetry(attempt + 1).then(resolve).catch(reject);
              } else {
                reject(new Error(`Timeout: Session check failed after ${MAX_RETRIES} attempts`));
              }
            }, SESSION_TIMEOUT);

            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              clearTimeout(sessionTimeout);

              if (sessionError) {
                console.error(`[AuthProvider] Session error (attempt ${attempt}):`, sessionError);
                if (attempt < MAX_RETRIES) {
                  setTimeout(() => {
                    checkSessionWithRetry(attempt + 1).then(resolve).catch(reject);
                  }, RETRY_DELAY);
                } else {
                  reject(sessionError);
                }
                return;
              }

              console.log('[AuthProvider] Session check successful:', session);
              resolve(session);
            } catch (err) {
              clearTimeout(sessionTimeout);
              if (attempt < MAX_RETRIES) {
                setTimeout(() => {
                  checkSessionWithRetry(attempt + 1).then(resolve).catch(reject);
                }, RETRY_DELAY);
              } else {
                reject(err);
              }
            }
          });
        };

        const session = await checkSessionWithRetry();

        if (session) {
          try {
            const userData = await fetchUserData(session.user.id);
            if (userData) {
              setUser(userData);
              setError(null);
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
        console.error('[AuthProvider] Error during authentication initialization:', err.message);
        setError(err.message || 'Failed to initialize authentication. Please check your connection.');
        setUser(null);
      } finally {
        clearTimeout(initializationTimeout);
        if (isMounted) {
          console.log('[AuthProvider] Authentication initialization completed.');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const setupAuthListener = () => {
      console.log('[AuthProvider] Setting up auth state change listener.');
      const { data: listenerData } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthProvider] Auth state change:', event);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            try {
              const userData = await fetchUserData(session.user.id);
              if (userData) {
                setUser(userData);
                setError(null);
                console.log('[AuthProvider] User signed in:', userData.username);
              } else {
                console.warn('[AuthProvider] User not found in database on auth state change.');
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
        console.log('[AuthProvider] Cleaning up auth listener.');
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

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
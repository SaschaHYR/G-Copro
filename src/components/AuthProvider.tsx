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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [degradedMode, setDegradedMode] = useState(false); // Mode dégradé
  const navigate = useNavigate();

  // Configuration adaptée pour le développement local
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const isProduction = !isLocalhost;

  // Timeouts adaptés à l'environnement
  const AUTH_TIMEOUT = isLocalhost ? 60000 : 30000; // 60s en localhost, 30s en production
  const SESSION_TIMEOUT = isLocalhost ? 45000 : 15000; // 45s en localhost, 15s en production
  const MAX_RETRIES = 2; // Nombre maximal de tentatives

  const fetchUserData = useCallback(async (userId: string, attempt = 1): Promise<User | null> => {
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
          }, 5000); // Attendre 5 secondes avant de réessayer
        } else {
          reject(new Error(`Failed to fetch user data after ${MAX_RETRIES} attempts: ${err.message}`));
        }
      }
    });
  }, [AUTH_TIMEOUT, MAX_RETRIES]);

  // ... (garder les autres fonctions login, logout, signUp inchangées)

  useEffect(() => {
    let isMounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    let initializationTimeout: NodeJS.Timeout;
    let sessionCheckTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      console.log('[AuthProvider] Initializing authentication...');
      setLoading(true);
      setError(null);

      // Timeout global pour l'initialisation
      initializationTimeout = setTimeout(() => {
        if (isMounted) {
          console.error('[AuthProvider] Authentication initialization timeout');
          setError('Timeout: Authentication initialization took too long. Please check your internet connection.');
          setLoading(false);
          setInitialLoadComplete(true);
          setDegradedMode(true); // Activer le mode dégradé
        }
      }, AUTH_TIMEOUT);

      try {
        if (typeof window === 'undefined') {
          console.log('[AuthProvider] Running in non-browser environment, skipping auth init.');
          clearTimeout(initializationTimeout);
          if (isMounted) {
            setLoading(false);
            setInitialLoadComplete(true);
          }
          return;
        }

        console.log(`[AuthProvider] Environment: ${isProduction ? 'Production' : 'Development'}`);

        // Vérification de session avec timeout
        const checkSession = async (attempt = 1) => {
          return new Promise(async (resolve, reject) => {
            sessionCheckTimeout = setTimeout(() => {
              if (attempt < MAX_RETRIES) {
                console.warn(`[AuthProvider] Session check timeout (attempt ${attempt}), retrying...`);
                checkSession(attempt + 1).then(resolve).catch(reject);
              } else {
                reject(new Error(`Timeout: Session check failed after ${MAX_RETRIES} attempts`));
              }
            }, SESSION_TIMEOUT);

            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              clearTimeout(sessionCheckTimeout);

              if (sessionError) {
                console.error(`[AuthProvider] Session error (attempt ${attempt}):`, sessionError);
                if (attempt < MAX_RETRIES) {
                  setTimeout(() => {
                    checkSession(attempt + 1).then(resolve).catch(reject);
                  }, 5000);
                } else {
                  reject(sessionError);
                }
                return;
              }

              console.log('[AuthProvider] Session check successful:', session);
              resolve(session);
            } catch (err) {
              clearTimeout(sessionCheckTimeout);
              if (attempt < MAX_RETRIES) {
                setTimeout(() => {
                  checkSession(attempt + 1).then(resolve).catch(reject);
                }, 5000);
              } else {
                reject(err);
              }
            }
          });
        };

        try {
          const session = await checkSession();

          if (session) {
            console.log('[AuthProvider] Active session found, fetching user data...');
            const userData = await fetchUserData(session.user.id);

            if (userData) {
              console.log('[AuthProvider] User data loaded successfully');
              if (isMounted) {
                setUser(userData);
                setError(null);
              }
            } else {
              console.warn('[AuthProvider] User not found in database, signing out.');
              await supabase.auth.signOut();
              if (isMounted) {
                setUser(null);
                setError('User profile not found. Please sign up or contact support.');
              }
            }
          } else {
            console.log('[AuthProvider] No active session found.');
            if (isMounted) {
              setUser(null);
            }
          }
        } catch (sessionError: any) {
          console.error('[AuthProvider] Session check failed:', sessionError.message);
          if (isMounted) {
            setError(sessionError.message || 'Failed to check session. Please try again.');
            setUser(null);
            setDegradedMode(true); // Activer le mode dégradé
          }
        }
      } catch (err: any) {
        console.error('[AuthProvider] Error during authentication initialization:', err.message);
        if (isMounted) {
          setError(err.message || 'Failed to initialize authentication. Please check your connection.');
          setUser(null);
          setDegradedMode(true); // Activer le mode dégradé
        }
      } finally {
        clearTimeout(initializationTimeout);
        clearTimeout(sessionCheckTimeout);
        if (isMounted) {
          console.log('[AuthProvider] Authentication initialization completed.');
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    // Exécuter l'initialisation une seule fois
    if (!initialLoadComplete) {
      initializeAuth();
    }

    const setupAuthListener = () => {
      console.log('[AuthProvider] Setting up auth state change listener.');
      const { data: listenerData } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthProvider] Auth state change:', event);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            try {
              const userData = await fetchUserData(session.user.id);
              if (userData) {
                console.log('[AuthProvider] User signed in:', userData.username);
                if (isMounted) {
                  setUser(userData);
                  setError(null);
                  setDegradedMode(false); // Désactiver le mode dégradé
                }
              } else {
                console.warn('[AuthProvider] User not found in database on auth state change.');
                await supabase.auth.signOut();
                if (isMounted) {
                  setUser(null);
                  setError('User profile not found. Please sign up or contact support.');
                }
              }
            } catch (userError: any) {
              console.error('[AuthProvider] Error fetching user data on auth state change:', userError.message);
              await supabase.auth.signOut();
              if (isMounted) {
                setUser(null);
                setError(userError.message || 'Failed to load user profile on auth change.');
              }
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] User signed out.');
          if (isMounted) {
            setUser(null);
            setError(null);
          }
        }
      });

      authListener = listenerData;
    };

    setupAuthListener();

    return () => {
      console.log('[AuthProvider] Cleaning up...');
      isMounted = false;
      clearTimeout(initializationTimeout);
      clearTimeout(sessionCheckTimeout);
      if (authListener && authListener.subscription) {
        console.log('[AuthProvider] Cleaning up auth listener.');
        authListener.subscription.unsubscribe();
      }
    };
  }, [initialLoadComplete, fetchUserData, isProduction, AUTH_TIMEOUT, SESSION_TIMEOUT, MAX_RETRIES]);

  if (loading && !initialLoadComplete) {
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

  // Mode dégradé - permet à l'application de fonctionner avec des fonctionnalités limitées
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
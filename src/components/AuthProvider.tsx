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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_informations')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('User data fetch error:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error in fetchUserData:', err);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        if (typeof window === 'undefined') {
          if (isMounted) setLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          if (isMounted) {
            setUser(null);
            setLoading(false);
            setInitialLoadComplete(true);
          }
          return;
        }

        if (session) {
          try {
            const userData = await fetchUserData(session.user.id);
            if (userData && isMounted) {
              setUser(userData);
            } else if (isMounted) {
              await supabase.auth.signOut();
              setUser(null);
            }
          } catch (userError) {
            console.error('User data error:', userError);
            if (isMounted) {
              await supabase.auth.signOut();
              setUser(null);
            }
          }
        } else if (isMounted) {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        if (isMounted) {
          setError('Failed to fetch user data. Please check your network connection.');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out:', signOutError);
          }
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          if (session) {
            try {
              const userData = await fetchUserData(session.user.id);
              if (userData && isMounted) {
                setUser(userData);
              } else if (isMounted) {
                await supabase.auth.signOut();
                setUser(null);
              }
            } catch (userError) {
              console.error('User data error on auth state change:', userError);
              if (isMounted) {
                await supabase.auth.signOut();
                setUser(null);
              }
            }
          }
        } catch (err) {
          console.error('Error on auth state change:', err);
          if (isMounted) {
            setError('Failed to update user data');
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Error signing out:', signOutError);
            }
            setUser(null);
          }
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.user) {
        try {
          const userData = await fetchUserData(data.user.id);
          if (userData) {
            setUser(userData);
          } else {
            await supabase.auth.signOut();
            throw new Error('User not found in database');
          }
        } catch (userError) {
          console.error('User data error after login:', userError);
          await supabase.auth.signOut();
          throw userError;
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Only show loading state if initial load is not complete
  if (!initialLoadComplete) {
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
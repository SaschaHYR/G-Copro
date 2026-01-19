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

  // Test Supabase connectivity
  const testSupabaseConnectivity = async () => {
    try {
      // Simple health check
      const response = await fetch('https://krxfkcdnrsywwofefqpp.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGZrY2RucnN5d3dvZmVmcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDA1MDcsImV4cCI6MjA4NDQxNjUwN30.sRFUMS3BCM4OTb1Luk2gOdIbrizfxKHepLO3iqKmKw8',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGZrY2RucnN5d3dvZmVmcXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDA1MDcsImV4cCI6MjA4NDQxNjUwN30.sRFUMS3BCM4OTb1Luk2gOdIbrizfxKHepLO3iqKmKw8'
        }
      });

      if (!response.ok) {
        console.error('Supabase health check failed:', response.status);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase health check error:', err);
      return false;
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        // Test connectivity first
        const isConnected = await testSupabaseConnectivity();
        if (!isConnected) {
          throw new Error('Unable to connect to Supabase service. Please check your network connection and CORS settings.');
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (session) {
          // Fetch user data from the database
          const { data: userData, error: userError } = await supabase
            .from('user_informations')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error('User data error:', userError);
            throw userError;
          }

          if (userData) {
            setUser(userData);
          } else {
            // User not found in database, sign out
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to fetch user data. Please check your network connection.');
        // Sign out if there's an error to ensure clean state
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          if (session) {
            const { data: userData, error: userError } = await supabase
              .from('user_informations')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userError) {
              console.error('User data error on auth state change:', userError);
              throw userError;
            }

            if (userData) {
              setUser(userData);
            } else {
              // User not found in database, sign out
              await supabase.auth.signOut();
              setUser(null);
            }
          }
        } catch (err) {
          console.error('Error on auth state change:', err);
          setError('Failed to update user data');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out:', signOutError);
          }
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Test connectivity before attempting login
      const isConnected = await testSupabaseConnectivity();
      if (!isConnected) {
        throw new Error('Unable to connect to authentication service');
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
        const { data: userData, error: userError } = await supabase
          .from('user_informations')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('User data error after login:', userError);
          throw userError;
        }

        if (userData) {
          setUser(userData);
        } else {
          // User not found in database, sign out
          await supabase.auth.signOut();
          throw new Error('User not found in database');
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
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Test connectivity before attempting signup
      const isConnected = await testSupabaseConnectivity();
      if (!isConnected) {
        throw new Error('Unable to connect to authentication service');
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
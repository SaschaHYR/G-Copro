"use client";

import React from 'react';
import { useAuth } from './AuthProvider';
import { Navigate } from 'react-router-dom';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('[PrivateRoute] Current auth state:', { user, loading });

  if (loading) {
    console.log('[PrivateRoute] Still loading, showing loading state');
    return <div>Chargement...</div>;
  }

  if (!user) {
    console.log('[PrivateRoute] No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Vérification supplémentaire : si l'utilisateur existe mais n'a pas de rôle valide
  if (user && !user.role) {
    console.log('[PrivateRoute] User exists but has no role, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('[PrivateRoute] User authenticated, rendering children');
  return <>{children}</>;
};

export default PrivateRoute;
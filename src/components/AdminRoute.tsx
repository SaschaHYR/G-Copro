"use client";

import React from 'react';
import { useAuth } from './AuthProvider';
import { Navigate } from 'react-router-dom';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  // Allow access if user is authenticated and has Superadmin or ASL role
  if (!user || (user.role !== 'Superadmin' && user.role !== 'ASL')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
"use client";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { NotificationProvider } from './components/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import Index from './pages/Index';
import Admin from './pages/Admin';
import Gestion from './pages/Gestion';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './globals.css';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="Superadmin">
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/gestion" element={
                <ProtectedRoute>
                  <Gestion />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Routes>
          </QueryClientProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
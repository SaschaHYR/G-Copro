"use client";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { NotificationProvider } from './components/NotificationContext';
import Login from './pages/Login';
import Index from './pages/Index';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import './globals.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
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
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
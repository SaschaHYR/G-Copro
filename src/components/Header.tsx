"use client";

import { Button } from './ui/button';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';

const Header = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border rounded-b-lg shadow-sm">
      <h1 className="text-2xl font-bold text-primary">G Copro</h1>
      <div className="flex items-center space-x-2">
        {user?.role === 'Superadmin' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="rounded-full"
            title="Panneau d'administration"
          >
            <Shield className="h-5 w-5 text-primary hover:text-primary/80" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
          <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
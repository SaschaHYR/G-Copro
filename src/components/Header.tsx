"use client";

import { Button } from './ui/button';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border rounded-b-lg shadow-sm">
      <h1 className="text-2xl font-bold text-primary">Gestion des Tickets</h1>
      <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
        <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive" />
      </Button>
    </header>
  );
};

export default Header;
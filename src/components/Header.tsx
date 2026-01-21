"use client";

import { Button } from './ui/button';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Bell } from 'lucide-react';
import { Badge } from './ui/badge';
import { useNotifications } from './NotificationContext'; // Import useNotifications

const Header = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { notificationCount } = useNotifications(); // Use notificationCount from context

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    // Filter tickets with new actions from others
    navigate('/?filter=new-actions');
  };

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-border rounded-b-lg shadow-sm">
      <h1 className="text-2xl font-bold text-primary">G Copro</h1>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNotificationClick}
          className="rounded-full relative"
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground hover:text-primary" />
          {notificationCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
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
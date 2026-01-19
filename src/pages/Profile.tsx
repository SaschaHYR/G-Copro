"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const Profile = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Utilisateur non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Mon Profil</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/')}
          className="rounded-full"
          title="Retour à l'accueil"
        >
          <Home className="h-5 w-5 text-primary hover:text-primary/80" />
        </Button>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-col items-center gap-4">
          <Avatar className="w-24 h-24">
            <AvatarImage src="/placeholder.svg" alt="Photo de profil" />
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {user.first_name ? user.first_name.charAt(0) : 'U'}
              {user.last_name ? user.last_name.charAt(0) : ''}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {user.first_name} {user.last_name}
            </CardTitle>
            <Badge
              variant={
                user.role === 'Superadmin' ? 'default' :
                user.role === 'ASL' ? 'secondary' :
                user.role === 'En attente' ? 'outline' : 'default'
              }
              className="mt-2"
            >
              {user.role.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Copropriété</p>
              <p className="font-medium">{user.copro || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="font-medium">{user.actif ? 'Actif' : 'Inactif'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      toast({
        title: "Pas de connexion Internet",
        description: "Veuillez vérifier votre connexion réseau",
        variant: "destructive",
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = "Email ou mot de passe incorrect";

      if (error.message.includes('Failed to fetch')) {
        errorMessage = "Impossible de se connecter au serveur. Veuillez vérifier votre connexion Internet.";
      } else if (error.message.includes('network')) {
        errorMessage = "Problème de réseau. Veuillez vérifier votre connexion.";
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Email ou mot de passe incorrect";
      }

      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
      </CardHeader>
      <CardContent>
        {!isOnline && (
          <div className="mb-4 p-3 bg-destructive/10 rounded-md text-destructive text-sm">
            Vous êtes hors ligne. Certaines fonctionnalités peuvent ne pas être disponibles.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !isOnline}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
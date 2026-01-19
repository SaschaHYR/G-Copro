"use client";

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password);
      toast({
        title: "Inscription réussie",
        description: "Votre compte est en attente de validation",
      });
      navigate('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "Une erreur est survenue lors de l'inscription";

      if (error.message.includes('No API key found in request')) {
        errorMessage = "Clé API manquante. Veuillez vérifier la configuration.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Impossible de se connecter au serveur d'inscription. Veuillez vérifier votre connexion Internet et les paramètres CORS.";
      } else if (error.message.includes('network')) {
        errorMessage = "Problème de réseau. Veuillez vérifier votre connexion.";
      } else if (error.message.includes('User already registered')) {
        errorMessage = "Cet email est déjà enregistré";
      } else if (error.message.includes('Unable to connect to authentication service')) {
        errorMessage = "Impossible de se connecter au service d'authentification. Veuillez vérifier la configuration.";
      } else if (error.status === 500) {
        errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
      }

      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Inscription</CardTitle>
      </CardHeader>
      <CardContent>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';

interface Copropriete {
  id: string;
  nom: string;
  actif: boolean;
}

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [coproFilter, setCoproFilter] = useState('all');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'Proprietaire' as UserRole,
    copro: '',
    actif: true
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_informations')
        .select('*');

      if (error) throw error;
      return data;
    }
  });

  // Fetch copropriétés
  const { data: coproprietes, isLoading: coprosLoading, error: coprosError } = useQuery<Copropriete[], Error>({
    queryKey: ['coproprietes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coproprietes')
        .select('*')
        .eq('actif', true)
        .order('nom', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesCopro = coproFilter === 'all' || user.copro === coproFilter;

    return matchesSearch && matchesRole && matchesCopro;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Then create the user information record
      const { error: dbError } = await supabase
        .from('user_informations')
        .insert({
          id: authData.user.id,
          username: newUser.email,
          role: newUser.role,
          copro: newUser.copro,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          actif: newUser.actif
        });

      if (dbError) throw dbError;

      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${newUser.email} a été créé avec succès.`,
      });

      setIsAddUserDialogOpen(false);
      setNewUser({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'Proprietaire',
        copro: '',
        actif: true
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'utilisateur.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('user_informations')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations de l'utilisateur ont été mises à jour avec succès.",
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de l'utilisateur.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // First delete from auth.users (using admin API)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Then delete from user_informations
      const { error: dbError } = await supabase
        .from('user_informations')
        .delete()
        .eq('id', userId);

      if (dbError) throw dbError;

      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression de l'utilisateur.",
        variant: "destructive",
      });
    }
  };

  if (usersLoading || coprosLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (usersError || coprosError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Erreur de chargement des données</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['users', 'coproprietes'] })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Panneau d'Administration</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Ajouter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary">Nouvel Utilisateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                    className="rounded-md border-border focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    className="rounded-md border-border focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="first_name" className="text-sm font-medium text-foreground">Prénom</Label>
                  <Input
                    id="first_name"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    className="rounded-md border-border focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-sm font-medium text-foreground">Nom</Label>
                  <Input
                    id="last_name"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    className="rounded-md border-border focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-sm font-medium text-foreground">Rôle</Label>
                  <Select
                    onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}
                    value={newUser.role}
                    required
                  >
                    <SelectTrigger className="rounded-md border-border bg-background text-foreground focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      <SelectItem value="Proprietaire">Propriétaire</SelectItem>
                      <SelectItem value="Conseil_Syndical">Conseil Syndical</SelectItem>
                      <SelectItem value="Syndicat_Copropriete">Syndicat de Copropriété</SelectItem>
                      <SelectItem value="ASL">ASL</SelectItem>
                      <SelectItem value="Superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="copro" className="text-sm font-medium text-foreground">Copropriété</Label>
                  <Select
                    onValueChange={(value) => setNewUser({...newUser, copro: value})}
                    value={newUser.copro}
                    required
                  >
                    <SelectTrigger className="rounded-md border-border bg-background text-foreground focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Sélectionner une copropriété" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {coproprietes && coproprietes.length > 0 ? (
                        coproprietes.map((copro) => (
                          <SelectItem key={copro.id} value={copro.nom}>
                            {copro.nom}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Aucune copropriété disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 text-sm">
                    <Link to="/coproprietes" className="text-primary hover:underline flex items-center">
                      <Building className="h-3 w-3 mr-1" />
                      Gérer les copropriétés
                    </Link>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="actif"
                    checked={newUser.actif}
                    onChange={(e) => setNewUser({...newUser, actif: e.target.checked})}
                    className="rounded border-border focus:ring-primary"
                  />
                  <Label htmlFor="actif" className="text-sm font-medium text-foreground">Actif</Label>
                </div>
                <Button type="submit" className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300">
                  Créer Utilisateur
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Link to="/coproprietes">
            <Button variant="outline" className="rounded-full px-4 py-2 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <Building className="h-4 w-4 mr-2" />
              Gérer les copropriétés
            </Button>
          </Link>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Gestion des Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 rounded-md border-border focus:ring-primary focus:border-primary"
            />
            <Select onValueChange={(value: UserRole | 'all') => setRoleFilter(value)} value={roleFilter}>
              <SelectTrigger className="rounded-md border-border bg-background text-foreground">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="Proprietaire">Propriétaire</SelectItem>
                <SelectItem value="Conseil_Syndical">Conseil Syndical</SelectItem>
                <SelectItem value="Syndicat_Copropriete">Syndicat de Copropriété</SelectItem>
                <SelectItem value="ASL">ASL</SelectItem>
                <SelectItem value="Superadmin">Superadmin</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setCoproFilter(value)} value={coproFilter}>
              <SelectTrigger className="rounded-md border-border bg-background text-foreground">
                <SelectValue placeholder="Filtrer par copropriété" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="all">Toutes les copropriétés</SelectItem>
                {coproprietes && coproprietes.map((copro) => (
                  <SelectItem key={copro.id} value={copro.nom}>{copro.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg shadow-lg border border-border">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow>
                  <TableHead className="text-primary-foreground rounded-tl-lg">Nom</TableHead>
                  <TableHead className="text-primary-foreground">Email</TableHead>
                  <TableHead className="text-primary-foreground">Rôle</TableHead>
                  <TableHead className="text-primary-foreground">Copropriété</TableHead>
                  <TableHead className="text-primary-foreground">Statut</TableHead>
                  <TableHead className="text-primary-foreground rounded-tr-lg">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Badge
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          variant={
                            user.role === 'Superadmin' ? 'default' :
                            user.role === 'ASL' ? 'secondary' :
                            user.role === 'En attente' ? 'outline' : 'default'
                          }
                        >
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.copro || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          variant={user.actif ? 'default' : 'destructive'}
                        >
                          {user.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleUpdateUser(user.id, { actif: !user.actif })}
                          >
                            {user.actif ? 'Désactiver' : 'Activer'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
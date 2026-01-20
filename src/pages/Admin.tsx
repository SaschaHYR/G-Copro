import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Building, ListChecks } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [coproprietes, setCoproprietes] = useState<{ id: string; nom: string }[]>([]);
  const [loadingCoproprietes, setLoadingCoproprietes] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use RPC to bypass RLS for Superadmin
      const { data, error } = await supabase
        .rpc('get_all_users_for_admin')
        .select('*')
        .order('username', { ascending: true });

      if (error) {
        console.error('Error fetching users with RPC:', error);
        // Fallback to regular query if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_informations')
          .select('*')
          .order('username', { ascending: true });

        if (fallbackError) throw fallbackError;
        setUsers(fallbackData || []);
      } else {
        setUsers(data || []);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCoproprietes = async () => {
    try {
      setLoadingCoproprietes(true);
      const { data, error } = await supabase
        .from('coproprietes')
        .select('id, nom')
        .order('nom', { ascending: true });

      if (error) throw error;
      setCoproprietes(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les copropriétés",
        variant: "destructive",
      });
    } finally {
      setLoadingCoproprietes(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCoproprietes();
  }, []);

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('user_informations')
        .update({
          role: editingUser.role,
          actif: editingUser.actif,
          copro: editingUser.copro
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });

      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'utilisateur",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Panneau d'administration</h1>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          <Link to="/coproprietes" className="w-full md:w-auto">
            <Button variant="outline" className="rounded-full w-full md:w-auto">
              <Building className="mr-2 h-4 w-4" />
              <span className="text-sm">Gérer les copropriétés</span>
            </Button>
          </Link>
          <Link to="/categories" className="w-full md:w-auto">
            <Button variant="outline" className="rounded-full w-full md:w-auto">
              <ListChecks className="mr-2 h-4 w-4" />
              <span className="text-sm">Gérer les catégories</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card className="rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold md:text-2xl">Gestion des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
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
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm md:text-base">Email</TableHead>
                    <TableHead className="text-sm md:text-base">Rôle</TableHead>
                    <TableHead className="text-sm md:text-base">Copropriété</TableHead>
                    <TableHead className="text-sm md:text-base">Statut</TableHead>
                    <TableHead className="text-sm md:text-base">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-sm md:text-base">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'Superadmin' ? 'default' :
                          user.role === 'ASL' ? 'secondary' :
                          user.role === 'En attente' ? 'outline' : 'default'
                        }>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm md:text-base">{user.copro || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={user.actif ? 'default' : 'destructive'}>
                          {user.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          className="text-sm"
                        >
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg md:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary md:text-2xl">Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur ci-dessous.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="role" className="text-sm font-medium text-foreground">Rôle</Label>
                <Select
                  onValueChange={(value: UserRole) => setEditingUser({...editingUser, role: value})}
                  value={editingUser.role}
                >
                  <SelectTrigger className="rounded-md border-border bg-background text-foreground">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="Proprietaire">Propriétaire</SelectItem>
                    <SelectItem value="Conseil_Syndical">Conseil Syndical</SelectItem>
                    <SelectItem value="Syndicat_Copropriete">Syndicat de Copropriété</SelectItem>
                    <SelectItem value="ASL">ASL</SelectItem>
                    <SelectItem value="Superadmin">Superadmin</SelectItem>
                    <SelectItem value="En attente">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="copro" className="text-sm font-medium text-foreground">Copropriété</Label>
                <Select
                  onValueChange={(value) => setEditingUser({...editingUser, copro: value === "none" ? null : value})}
                  value={editingUser.copro || 'none'}
                  disabled={loadingCoproprietes}
                >
                  <SelectTrigger className="rounded-md border-border bg-background text-foreground">
                    <SelectValue placeholder={loadingCoproprietes ? "Chargement..." : "Sélectionner une copropriété"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="none">Aucune</SelectItem>
                    {coproprietes.map((copro) => (
                      <SelectItem key={copro.id} value={copro.nom}>
                        {copro.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="actif"
                  checked={editingUser.actif}
                  onCheckedChange={(checked: boolean) => setEditingUser({...editingUser, actif: checked})}
                />
                <Label htmlFor="actif" className="text-sm font-medium text-foreground">
                  Compte actif
                </Label>
              </div>
              <Button
                onClick={handleUpdateUser}
                className="w-full rounded-full py-2 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 md:text-lg"
              >
                Enregistrer les modifications
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
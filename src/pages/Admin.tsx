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
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_informations')
        .select('*')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
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

  useEffect(() => {
    fetchUsers();
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
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Panneau d'administration</h1>
        <Link to="/coproprietes">
          <Button variant="outline" className="rounded-full">
            <Building className="mr-2 h-4 w-4" />
            Gérer les copropriétés
          </Button>
        </Link>
      </div>

      <Card className="rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Gestion des utilisateurs</CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Copropriété</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={
                        user.role === 'Superadmin' ? 'default' :
                        user.role === 'ASL' ? 'secondary' :
                        user.role === 'En attente' ? 'outline' : 'default'
                      }>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.copro || 'N/A'}</TableCell>
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
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Modifier l'utilisateur</DialogTitle>
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
                <Input
                  id="copro"
                  value={editingUser.copro || ''}
                  onChange={(e) => setEditingUser({...editingUser, copro: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
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
                className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
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
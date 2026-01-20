import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Home, Edit, Trash2, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

interface Copropriete {
  id: string;
  nom: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  description?: string;
  actif: boolean;
  syndic_nom?: string;
  syndic_responsable_nom?: string;
  syndic_responsable_prenom?: string;
  syndic_email?: string;
  syndic_telephone?: string;
}

const Coproprietes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCopropriete, setNewCopropriete] = useState<Omit<Copropriete, 'id'>>({
    nom: '',
    adresse: '',
    ville: '',
    code_postal: '',
    description: '',
    actif: true,
    syndic_nom: '',
    syndic_responsable_nom: '',
    syndic_responsable_prenom: '',
    syndic_email: '',
    syndic_telephone: ''
  });
  const [editingCopropriete, setEditingCopropriete] = useState<Copropriete | null>(null);

  const fetchCoproprietes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coproprietes')
        .select('*')
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoproprietes();
  }, []);

  const canManageCoproprietes = user?.role === 'Superadmin' || user?.role === 'ASL';
  const isSuperadmin = user?.role === 'Superadmin';

  const handleAddCopropriete = async () => {
    if (!canManageCoproprietes) {
      toast({
        title: "Accès non autorisé",
        description: "Vous n'avez pas la permission d'ajouter des copropriétés.",
        variant: "destructive",
      });
      return;
    }
    if (!newCopropriete.nom.trim()) {
      toast({
        title: "Champ requis",
        description: "Le nom de la copropriété ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('coproprietes')
        .insert([newCopropriete]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Copropriété ajoutée avec succès",
      });

      setIsAddDialogOpen(false);
      setNewCopropriete({
        nom: '', adresse: '', ville: '', code_postal: '', description: '', actif: true,
        syndic_nom: '', syndic_responsable_nom: '', syndic_responsable_prenom: '', syndic_email: '', syndic_telephone: ''
      });
      fetchCoproprietes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter la copropriété",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCopropriete = async () => {
    if (!canManageCoproprietes || !editingCopropriete) {
      toast({
        title: "Accès non autorisé",
        description: "Vous n'avez pas la permission de modifier des copropriétés.",
        variant: "destructive",
      });
      return;
    }
    if (!editingCopropriete.nom.trim()) {
      toast({
        title: "Champ requis",
        description: "Le nom de la copropriété ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('coproprietes')
        .update({
          nom: editingCopropriete.nom,
          adresse: editingCopropriete.adresse,
          ville: editingCopropriete.ville,
          code_postal: editingCopropriete.code_postal,
          description: editingCopropriete.description,
          actif: editingCopropriete.actif,
          syndic_nom: editingCopropriete.syndic_nom,
          syndic_responsable_nom: editingCopropriete.syndic_responsable_nom,
          syndic_responsable_prenom: editingCopropriete.syndic_responsable_prenom,
          syndic_email: editingCopropriete.syndic_email,
          syndic_telephone: editingCopropriete.syndic_telephone,
        })
        .eq('id', editingCopropriete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Copropriété mise à jour avec succès",
      });

      setIsEditDialogOpen(false);
      setEditingCopropriete(null);
      fetchCoproprietes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la copropriété",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCopropriete = async (coproprieteId: string) => {
    if (!canManageCoproprietes) {
      toast({
        title: "Accès non autorisé",
        description: "Vous n'avez pas la permission de supprimer des copropriétés.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette copropriété ? Cette action est irréversible et supprimera tous les tickets associés.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('coproprietes')
        .delete()
        .eq('id', coproprieteId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Copropriété supprimée avec succès",
      });
      fetchCoproprietes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la copropriété",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Gestion des copropriétés</h1>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          <Link to="/" className="w-full md:w-auto">
            <Button variant="outline" className="rounded-full w-full md:w-auto">
              <Home className="mr-2 h-4 w-4" />
              <span className="text-sm">Accueil</span>
            </Button>
          </Link>
          {isSuperadmin && (
            <Link to="/admin" className="w-full md:w-auto">
              <Button variant="outline" className="rounded-full w-full md:w-auto">
                <Home className="mr-2 h-4 w-4" />
                <span className="text-sm">Retour à l'Admin</span>
              </Button>
            </Link>
          )}
          {canManageCoproprietes && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto md:px-6 md:py-3 md:text-lg">
                  <PlusCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-sm md:text-base">Ajouter une copropriété</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-lg md:max-w-[600px] lg:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-primary md:text-2xl">Nouvelle Copropriété</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nom" className="text-sm font-medium text-foreground">Nom</Label>
                    <Input
                      id="nom"
                      value={newCopropriete.nom}
                      onChange={(e) => setNewCopropriete({...newCopropriete, nom: e.target.value})}
                      required
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adresse" className="text-sm font-medium text-foreground">Adresse</Label>
                    <Input
                      id="adresse"
                      value={newCopropriete.adresse}
                      onChange={(e) => setNewCopropriete({...newCopropriete, adresse: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ville" className="text-sm font-medium text-foreground">Ville</Label>
                    <Input
                      id="ville"
                      value={newCopropriete.ville}
                      onChange={(e) => setNewCopropriete({...newCopropriete, ville: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code_postal" className="text-sm font-medium text-foreground">Code Postal</Label>
                    <Input
                      id="code_postal"
                      value={newCopropriete.code_postal}
                      onChange={(e) => setNewCopropriete({...newCopropriete, code_postal: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                    <Textarea
                      id="description"
                      value={newCopropriete.description}
                      onChange={(e) => setNewCopropriete({...newCopropriete, description: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="syndic_nom" className="text-sm font-medium text-foreground">Nom du Syndic</Label>
                    <Input
                      id="syndic_nom"
                      value={newCopropriete.syndic_nom}
                      onChange={(e) => setNewCopropriete({...newCopropriete, syndic_nom: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="syndic_responsable_nom" className="text-sm font-medium text-foreground">Nom du Responsable Syndic</Label>
                    <Input
                      id="syndic_responsable_nom"
                      value={newCopropriete.syndic_responsable_nom}
                      onChange={(e) => setNewCopropriete({...newCopropriete, syndic_responsable_nom: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="syndic_responsable_prenom" className="text-sm font-medium text-foreground">Prénom du Responsable Syndic</Label>
                    <Input
                      id="syndic_responsable_prenom"
                      value={newCopropriete.syndic_responsable_prenom}
                      onChange={(e) => setNewCopropriete({...newCopropriete, syndic_responsable_prenom: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="syndic_email" className="text-sm font-medium text-foreground">Email du Syndic</Label>
                    <Input
                      id="syndic_email"
                      type="email"
                      value={newCopropriete.syndic_email}
                      onChange={(e) => setNewCopropriete({...newCopropriete, syndic_email: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="syndic_telephone" className="text-sm font-medium text-foreground">Téléphone du Syndic</Label>
                    <Input
                      id="syndic_telephone"
                      value={newCopropriete.syndic_telephone}
                      onChange={(e) => setNewCopropriete({...newCopropriete, syndic_telephone: e.target.value})}
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="actif"
                      checked={newCopropriete.actif}
                      onCheckedChange={(checked: boolean) => setNewCopropriete({...newCopropriete, actif: checked})}
                    />
                    <Label htmlFor="actif" className="text-sm font-medium text-foreground">
                      Active
                    </Label>
                  </div>
                  <Button
                    onClick={handleAddCopropriete}
                    className="w-full rounded-full py-2 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 md:text-lg"
                  >
                    Ajouter Copropriété
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card className="rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold md:text-2xl">Liste des copropriétés</CardTitle>
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
                    <TableHead className="text-sm md:text-base">Nom</TableHead>
                    <TableHead className="text-sm md:text-base">Description</TableHead>
                    <TableHead className="text-sm md:text-base">Syndic</TableHead>
                    <TableHead className="text-sm md:text-base">Adresse</TableHead>
                    <TableHead className="text-sm md:text-base">Ville</TableHead>
                    <TableHead className="text-sm md:text-base">Code Postal</TableHead>
                    <TableHead className="text-sm md:text-base">Statut</TableHead>
                    {canManageCoproprietes && <TableHead className="text-right text-sm md:text-base">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coproprietes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManageCoproprietes ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        Aucune copropriété trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coproprietes.map((copropriete) => (
                      <TableRow key={copropriete.id}>
                        <TableCell className="font-medium text-sm md:text-base">{copropriete.nom}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm md:text-base">{copropriete.description || 'N/A'}</TableCell>
                        <TableCell>
                          {copropriete.syndic_nom ? (
                            <div>
                              <div className="font-medium text-sm md:text-base">{copropriete.syndic_nom}</div>
                              {copropriete.syndic_responsable_prenom && copropriete.syndic_responsable_nom && (
                                <div className="text-sm text-muted-foreground">
                                  {copropriete.syndic_responsable_prenom} {copropriete.syndic_responsable_nom}
                                </div>
                              )}
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm md:text-base">{copropriete.adresse || 'N/A'}</TableCell>
                        <TableCell className="text-sm md:text-base">{copropriete.ville || 'N/A'}</TableCell>
                        <TableCell className="text-sm md:text-base">{copropriete.code_postal || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={copropriete.actif ? 'default' : 'destructive'}>
                            {copropriete.actif ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        {canManageCoproprietes && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCopropriete(copropriete);
                                  setIsEditDialogOpen(true);
                                }}
                                className="text-sm"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCopropriete(copropriete.id)}
                                className="text-sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg md:max-w-[600px] lg:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary md:text-2xl">Modifier la Copropriété</DialogTitle>
          </DialogHeader>
          {editingCopropriete && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_nom" className="text-sm font-medium text-foreground">Nom</Label>
                <Input
                  id="edit_nom"
                  value={editingCopropriete.nom}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, nom: e.target.value})}
                  required
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_adresse" className="text-sm font-medium text-foreground">Adresse</Label>
                <Input
                  id="edit_adresse"
                  value={editingCopropriete.adresse || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, adresse: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_ville" className="text-sm font-medium text-foreground">Ville</Label>
                <Input
                  id="edit_ville"
                  value={editingCopropriete.ville || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, ville: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_code_postal" className="text-sm font-medium text-foreground">Code Postal</Label>
                <Input
                  id="edit_code_postal"
                  value={editingCopropriete.code_postal || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, code_postal: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_description" className="text-sm font-medium text-foreground">Description</Label>
                <Textarea
                  id="edit_description"
                  value={editingCopropriete.description || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, description: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_syndic_nom" className="text-sm font-medium text-foreground">Nom du Syndic</Label>
                <Input
                  id="edit_syndic_nom"
                  value={editingCopropriete.syndic_nom || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, syndic_nom: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_syndic_responsable_nom" className="text-sm font-medium text-foreground">Nom du Responsable Syndic</Label>
                <Input
                  id="edit_syndic_responsable_nom"
                  value={editingCopropriete.syndic_responsable_nom || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, syndic_responsable_nom: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_syndic_responsable_prenom" className="text-sm font-medium text-foreground">Prénom du Responsable Syndic</Label>
                <Input
                  id="edit_syndic_responsable_prenom"
                  value={editingCopropriete.syndic_responsable_prenom || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, syndic_responsable_prenom: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_syndic_email" className="text-sm font-medium text-foreground">Email du Syndic</Label>
                <Input
                  id="edit_syndic_email"
                  type="email"
                  value={editingCopropriete.syndic_email || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, syndic_email: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="edit_syndic_telephone" className="text-sm font-medium text-foreground">Téléphone du Syndic</Label>
                <Input
                  id="edit_syndic_telephone"
                  value={editingCopropriete.syndic_telephone || ''}
                  onChange={(e) => setEditingCopropriete({...editingCopropriete, syndic_telephone: e.target.value})}
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_actif"
                  checked={editingCopropriete.actif}
                  onCheckedChange={(checked: boolean) => setEditingCopropriete({...editingCopropriete, actif: checked})}
                />
                <Label htmlFor="edit_actif" className="text-sm font-medium text-foreground">
                  Active
                </Label>
              </div>
              <Button
                onClick={handleUpdateCopropriete}
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

export default Coproprietes;
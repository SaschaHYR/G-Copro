"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Home, PlusCircle, Edit, Trash2, ListChecks, Building } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import CoproprieteForm from '@/components/CoproprieteForm';
import CoproprieteTable from '@/components/CoproprieteTable';

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

interface Categorie {
  id: string;
  name: string;
  created_at: string;
}

const Gestion = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
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
  const [newCategory, setNewCategory] = useState('');
  const [editingCopropriete, setEditingCopropriete] = useState<Copropriete | null>(null);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [activeTab, setActiveTab] = useState<'coproprietes' | 'categories'>('coproprietes');

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

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les catégories",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCoproprietes();
    fetchCategories();
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

  const handleAddCategory = async () => {
    if (!canManageCoproprietes) {
      toast({
        title: "Accès non autorisé",
        description: "Vous n'avez pas la permission d'ajouter des catégories.",
        variant: "destructive",
      });
      return;
    }
    if (!newCategory.trim()) {
      toast({
        title: "Champ requis",
        description: "Le nom de la catégorie ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategory }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Catégorie ajoutée avec succès",
      });

      setIsAddCategoryDialogOpen(false);
      setNewCategory('');
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter la catégorie",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!canManageCoproprietes || !editingCategory) {
      toast({
        title: "Accès non autorisé",
        description: "Vous n'avez pas la permission de modifier des catégories.",
        variant: "destructive",
      });
      return;
    }
    if (!editingCategory.name.trim()) {
      toast({
        title: "Champ requis",
        description: "Le nom de la catégorie ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editingCategory.name })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Catégorie mise à jour avec succès",
      });

      setIsEditCategoryDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la catégorie",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!canManageCoproprietes) {
      toast({
        title: "Accès non autorisé",
        description: "Vous n'avez pas la permission de supprimer des catégories.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Catégorie supprimée avec succès",
      });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (editingCopropriete) {
      setEditingCopropriete({ ...editingCopropriete, [field]: value });
    } else {
      setNewCopropriete({ ...newCopropriete, [field]: value });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Gestion</h1>
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
                <span className="text-sm">Panneau d'administration</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs for switching between coproprietes and categories */}
      <div className="flex space-x-2 mb-4">
        <Button
          variant={activeTab === 'coproprietes' ? 'default' : 'outline'}
          onClick={() => setActiveTab('coproprietes')}
          className="rounded-full px-4 py-2"
        >
          <Building className="mr-2 h-4 w-4" />
          <span>Copropriétés</span>
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          onClick={() => setActiveTab('categories')}
          className="rounded-full px-4 py-2"
        >
          <ListChecks className="mr-2 h-4 w-4" />
          <span>Catégories</span>
        </Button>
      </div>

      {/* Copropriétés Tab */}
      {activeTab === 'coproprietes' && (
        <>
          <div className="flex justify-end mb-4">
            {canManageCoproprietes && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="text-sm">Ajouter une copropriété</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-lg md:max-w-[600px] lg:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary md:text-2xl">Nouvelle Copropriété</DialogTitle>
                  </DialogHeader>
                  <CoproprieteForm
                    copropriete={newCopropriete}
                    onChange={handleFieldChange}
                    onSubmit={handleAddCopropriete}
                    submitText="Ajouter Copropriété"
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card className="rounded-lg shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold md:text-2xl">Liste des copropriétés</CardTitle>
            </CardHeader>
            <CardContent>
              <CoproprieteTable
                coproprietes={coproprietes}
                onEdit={(copro) => {
                  setEditingCopropriete(copro);
                  setIsEditDialogOpen(true);
                }}
                onDelete={handleDeleteCopropriete}
                canManage={canManageCoproprietes}
                loading={loading}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Catégories Tab */}
      {activeTab === 'categories' && (
        <Card className="rounded-lg shadow-lg">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold md:text-2xl">Gestion des catégories</CardTitle>
            {canManageCoproprietes && (
              <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span className="text-sm">Ajouter une catégorie</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary">Nouvelle Catégorie</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">Nom de la catégorie</Label>
                      <Input
                        id="category-name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Entrez le nom de la catégorie"
                      />
                    </div>
                    <Button
                      onClick={handleAddCategory}
                      className="w-full rounded-full"
                    >
                      Ajouter Catégorie
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune catégorie trouvée. Cliquez sur "Ajouter une catégorie" pour en créer une nouvelle.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        {new Date(category.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category);
                            setIsEditCategoryDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg md:max-w-[600px] lg:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary md:text-2xl">Modifier la Copropriété</DialogTitle>
          </DialogHeader>
          {editingCopropriete && (
            <CoproprieteForm
              copropriete={editingCopropriete}
              onChange={handleFieldChange}
              onSubmit={handleUpdateCopropriete}
              submitText="Enregistrer les modifications"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Modifier la Catégorie</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Nom de la catégorie</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Entrez le nom de la catégorie"
                />
              </div>
              <Button
                onClick={handleUpdateCategory}
                className="w-full rounded-full"
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

export default Gestion;
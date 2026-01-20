"use client";

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
import { Link } from 'react-router-dom';
import { PlusCircle, Home, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Category {
  id: string;
  name: string;
  created_at: string;
}

const Categories = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const canManageCategories = user?.role === 'Superadmin' || user?.role === 'ASL';
  const isSuperadmin = user?.role === 'Superadmin';

  const handleAddCategory = async () => {
    if (!canManageCategories) {
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

      setIsAddDialogOpen(false);
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
    if (!canManageCategories || !editingCategory) {
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

      setIsEditDialogOpen(false);
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
    if (!canManageCategories) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Gestion des catégories</h1>
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
          {canManageCategories && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto md:px-6 md:py-3 md:text-lg">
                  <PlusCircle className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-sm md:text-base">Ajouter une catégorie</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-lg md:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-primary md:text-2xl">Nouvelle Catégorie</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Nom</Label>
                    <Input
                      id="name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      required
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <Button
                    onClick={handleAddCategory}
                    className="w-full rounded-full py-2 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 md:text-lg"
                  >
                    Ajouter Catégorie
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card className="rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold md:text-2xl">Liste des catégories</CardTitle>
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
                    <TableHead className="text-sm md:text-base">Date de création</TableHead>
                    {canManageCategories && <TableHead className="text-right text-sm md:text-base">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManageCategories ? 3 : 2} className="text-center py-8 text-muted-foreground">
                        Aucune catégorie trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium text-sm md:text-base">{category.name}</TableCell>
                        <TableCell className="text-sm md:text-base">{new Date(category.created_at).toLocaleDateString()}</TableCell>
                        {canManageCategories && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setIsEditDialogOpen(true);
                                }}
                                className="text-sm"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
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
        <DialogContent className="sm:max-w-[425px] rounded-lg md:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary md:text-2xl">Modifier la Catégorie</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name" className="text-sm font-medium text-foreground">Nom</Label>
                <Input
                  id="edit_name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  required
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <Button
                onClick={handleUpdateCategory}
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

export default Categories;
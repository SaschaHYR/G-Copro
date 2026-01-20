"use client";

import React, { useState, useEffect } from 'react';
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
}

const Categories = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
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
  const isSuperadmin = user?.role === 'Superadmin'; // New check for Superadmin

  const handleAddCategory = async () => {
    if (!canManageCategories) {
      toast({
        title: "Accès non autorisé",
        description: "Vous n'avez pas la permission d'ajouter des catégories.",
        variant: "destructive",
      });
      return;
    }
    if (!newCategoryName.trim()) {
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
        .insert([{ name: newCategoryName.trim() }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Catégorie ajoutée avec succès",
      });

      setIsAddDialogOpen(false);
      setNewCategoryName('');
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
        .update({ name: editingCategory.name.trim() })
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

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
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
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Gestion des Catégories</h1>
        <div className="flex space-x-2">
          <Link to="/">
            <Button variant="outline" className="rounded-full">
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          </Link>
          {isSuperadmin && ( // Only show "Retour à l'Admin" for Superadmin
            <Link to="/admin">
              <Button variant="outline" className="rounded-full">
                <Home className="mr-2 h-4 w-4" />
                Retour à l'Admin
              </Button>
            </Link>
          )}
          {canManageCategories && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Ajouter une catégorie
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-primary">Nouvelle Catégorie</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newCategoryName" className="text-sm font-medium text-foreground">Nom de la catégorie</Label>
                    <Input
                      id="newCategoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      className="rounded-md border-border focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <Button
                    onClick={handleAddCategory}
                    className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
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
          <CardTitle className="text-2xl font-bold">Liste des catégories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  {canManageCategories && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageCategories ? 2 : 1} className="text-center py-4 text-muted-foreground">
                      Aucune catégorie trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
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
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Modifier la Catégorie</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCategoryName" className="text-sm font-medium text-foreground">Nom de la catégorie</Label>
                <Input
                  id="editCategoryName"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  required
                  className="rounded-md border-border focus:ring-primary focus:border-primary"
                />
              </div>
              <Button
                onClick={handleUpdateCategory}
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

export default Categories;
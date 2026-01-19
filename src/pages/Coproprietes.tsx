"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Copropriete {
  id: string;
  nom: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  description?: string;
  actif: boolean;
}

const Coproprietes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCopropriete, setNewCopropriete] = useState({
    nom: '',
    adresse: '',
    ville: '',
    code_postal: '',
    description: '',
    actif: true
  });

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

  const handleAddCopropriete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('coproprietes')
        .insert([newCopropriete])
        .select();

      if (error) throw error;

      toast({
        title: "Copropriété ajoutée",
        description: `La copropriété ${newCopropriete.nom} a été ajoutée avec succès.`,
      });

      setIsAddDialogOpen(false);
      setNewCopropriete({
        nom: '',
        adresse: '',
        ville: '',
        code_postal: '',
        description: '',
        actif: true
      });
      fetchCoproprietes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de la copropriété.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCopropriete = async (id: string, updates: Partial<Copropriete>) => {
    try {
      const { error } = await supabase
        .from('coproprietes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Copropriété mise à jour",
        description: "Les informations de la copropriété ont été mises à jour avec succès.",
      });

      fetchCoproprietes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de la copropriété.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCopropriete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coproprietes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Copropriété supprimée",
        description: "La copropriété a été supprimée avec succès.",
      });

      fetchCoproprietes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression de la copropriété.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCoproprietes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
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

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Gestion des Copropriétés</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              Ajouter une copropriété
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">Nouvelle Copropriété</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCopropriete} className="space-y-4">
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="actif"
                  checked={newCopropriete.actif}
                  onCheckedChange={(checked) => setNewCopropriete({...newCopropriete, actif: checked as boolean})}
                />
                <Label htmlFor="actif" className="text-sm font-medium text-foreground">Active</Label>
              </div>
              <Button type="submit" className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300">
                Ajouter Copropriété
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Liste des Copropriétés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg shadow-lg border border-border">
            <Table>
              <TableHeader className="bg-secondary">
                <TableRow>
                  <TableHead className="text-primary-foreground rounded-tl-lg">Nom</TableHead>
                  <TableHead className="text-primary-foreground">Adresse</TableHead>
                  <TableHead className="text-primary-foreground">Ville</TableHead>
                  <TableHead className="text-primary-foreground">Code Postal</TableHead>
                  <TableHead className="text-primary-foreground">Statut</TableHead>
                  <TableHead className="text-primary-foreground rounded-tr-lg">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coproprietes.length > 0 ? (
                  coproprietes.map((copropriete) => (
                    <TableRow key={copropriete.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{copropriete.nom}</TableCell>
                      <TableCell>{copropriete.adresse || 'N/A'}</TableCell>
                      <TableCell>{copropriete.ville || 'N/A'}</TableCell>
                      <TableCell>{copropriete.code_postal || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          copropriete.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {copropriete.actif ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleUpdateCopropriete(copropriete.id, { actif: !copropriete.actif })}
                          >
                            {copropriete.actif ? 'Désactiver' : 'Activer'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleDeleteCopropriete(copropriete.id)}
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
                      Aucune copropriété trouvée.
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

export default Coproprietes;
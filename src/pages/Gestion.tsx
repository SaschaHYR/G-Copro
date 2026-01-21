"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { Home, PlusCircle, ListChecks, Building } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import CoproprieteForm from '@/components/CoproprieteForm';
import CoproprieteTable from '@/components/CoproprieteTable';
import { useNavigate } from 'react-router-dom';

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

const Gestion = () => {
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
  const [activeTab, setActiveTab] = useState<'coproprietes' | 'categories'>('coproprietes');
  const navigate = useNavigate();

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
            <Link to="/categories" className="text-sm text-primary hover:text-primary/80">
              Voir la gestion complète des catégories →
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Pour gérer les catégories, veuillez accéder à la page dédiée en cliquant sur le lien ci-dessus.
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate('/categories')}
            >
              <ListChecks className="mr-2 h-4 w-4" />
              <span>Aller à la gestion des catégories</span>
            </Button>
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
    </div>
  );
};

export default Gestion;
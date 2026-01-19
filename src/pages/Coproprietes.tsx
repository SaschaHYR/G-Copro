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
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCopropriete, setNewCopropriete] = useState({
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

  const handleAddCopropriete = async () => {
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
      fetchCoproprietes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter la copropriété",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">Gestion des copropriétés</h1>
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="actif"
                  checked={newCopropriete.actif}
                  onCheckedChange={(checked) => setNewCopropriete({...newCopropriete, actif: checked as boolean})}
                />
                <Label htmlFor="actif" className="text-sm font-medium text-foreground">
                  Active
                </Label>
              </div>
              <Button
                onClick={handleAddCopropriete}
                className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
              >
                Ajouter Copropriété
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Liste des copropriétés</CardTitle>
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
                  <TableHead>Nom</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Code Postal</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coproprietes.map((copropriete) => (
                  <TableRow key={copropriete.id}>
                    <TableCell>{copropriete.nom}</TableCell>
                    <TableCell>{copropriete.adresse || 'N/A'}</TableCell>
                    <TableCell>{copropriete.ville || 'N/A'}</TableCell>
                    <TableCell>{copropriete.code_postal || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={copropriete.actif ? 'default' : 'destructive'}>
                        {copropriete.actif ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Coproprietes;
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useTicketFilters } from '@/contexts/TicketFilterContext';
import { Button } from './ui/button';
import { User, Building, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './ui/use-toast';

interface Copropriete {
  id: string;
  nom: string;
}

const Sidebar = () => {
  const { statusFilter, setStatusFilter, coproFilter, setCoproFilter, periodFilter, setPeriodFilter } = useTicketFilters();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([]);
  const [loadingCoproprietes, setLoadingCoproprietes] = useState(true);

  useEffect(() => {
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
          description: error.message || "Impossible de charger les copropriétés pour le filtre.",
          variant: "destructive",
        });
      } finally {
        setLoadingCoproprietes(false);
      }
    };

    fetchCoproprietes();
  }, [toast]);

  const canManage = user?.role === 'Superadmin' || user?.role === 'ASL';

  return (
    <Card className="w-64 h-full p-4 bg-sidebar-background border-r border-sidebar-border rounded-tr-lg rounded-br-lg shadow-md flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-sidebar-foreground">Filtres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1">
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">Statut</label>
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="rounded-md border-sidebar-border bg-background text-foreground">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="ouvert">Ouvert</SelectItem>
              <SelectItem value="en cours">En cours</SelectItem>
              <SelectItem value="transmis">Transmis</SelectItem>
              <SelectItem value="cloture">Clôturé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">Copropriété</label>
          <Select onValueChange={setCoproFilter} value={coproFilter} disabled={loadingCoproprietes}>
            <SelectTrigger className="rounded-md border-sidebar-border bg-background text-foreground">
              <SelectValue placeholder={loadingCoproprietes ? "Chargement..." : "Copropriété"} />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem value="all">Toutes</SelectItem>
              {coproprietes.map((copro) => (
                <SelectItem key={copro.id} value={copro.id}>
                  {copro.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-sidebar-foreground mb-2">Période</label>
          <Select onValueChange={setPeriodFilter} value={periodFilter}>
            <SelectTrigger className="rounded-md border-sidebar-border bg-background text-foreground">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start rounded-full"
          onClick={() => navigate('/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          Mon Profil
        </Button>
        {canManage && (
          <>
            <Button
              variant="outline"
              className="w-full justify-start rounded-full"
              onClick={() => navigate('/coproprietes')}
            >
              <Building className="mr-2 h-4 w-4" />
              Gérer les copropriétés
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-full"
              onClick={() => navigate('/categories')}
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Gérer les catégories
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default Sidebar;
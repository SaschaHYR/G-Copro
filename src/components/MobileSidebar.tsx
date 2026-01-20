"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, User, Building, ListChecks, Filter, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTicketFilters } from '@/contexts/TicketFilterContext';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface Copropriete {
  id: string;
  nom: string;
  description: string | null; // Added description
}

const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const [coproprietes, setCoproprietes] = useState<Copropriete[]>([]);
  const [loadingCoproprietes, setLoadingCoproprietes] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    statusFilter, setStatusFilter,
    coproFilter, setCoproFilter,
    periodFilter, setPeriodFilter
  } = useTicketFilters();

  const canManage = user?.role === 'Superadmin' || user?.role === 'ASL';

  useEffect(() => {
    const fetchCoproprietes = async () => {
      try {
        setLoadingCoproprietes(true);
        const { data, error } = await supabase
          .from('coproprietes')
          .select('id, nom, description') // Fetch description
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-4">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary">Menu</h2>
          </div>

          <div className="space-y-2 mb-8">
            <Button
              variant="outline"
              className="w-full justify-start rounded-full"
              onClick={() => {
                navigate('/');
                setOpen(false);
              }}
            >
              <Home className="mr-2 h-4 w-4" />
              <span className="truncate">Accueil</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start rounded-full"
              onClick={() => {
                navigate('/profile');
                setOpen(false);
              }}
            >
              <User className="mr-2 h-4 w-4" />
              <span className="truncate">Mon Profil</span>
            </Button>

            {canManage && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-full"
                  onClick={() => {
                    navigate('/coproprietes');
                    setOpen(false);
                  }}
                >
                  <Building className="mr-2 h-4 w-4" />
                  <span className="truncate">Gérer les copropriétés</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-full"
                  onClick={() => {
                    navigate('/categories');
                    setOpen(false);
                  }}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  <span className="truncate">Gérer les catégories</span>
                </Button>
                {user?.role === 'Superadmin' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-full"
                    onClick={() => {
                      navigate('/admin');
                      setOpen(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span className="truncate">Panneau d'administration</span>
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="border-t pt-4 mb-4">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </h3>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Statut</label>
              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="rounded-md border-border bg-background text-foreground">
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
              <label className="block text-sm font-medium text-foreground mb-2">Copropriété</label>
              <Select onValueChange={setCoproFilter} value={coproFilter} disabled={loadingCoproprietes}>
                <SelectTrigger className="rounded-md border-border bg-background text-foreground">
                  <SelectValue placeholder={loadingCoproprietes ? "Chargement..." : "Copropriété"} />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">Toutes</SelectItem>
                  {coproprietes.map((copro) => (
                    <SelectItem key={copro.id} value={copro.id}>
                      {copro.nom} {copro.description ? `(${copro.description})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Période</label>
              <Select onValueChange={setPeriodFilter} value={periodFilter}>
                <SelectTrigger className="rounded-md border-border bg-background text-foreground">
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useTicketFilters } from '@/contexts/TicketFilterContext';

const Sidebar = () => {
  const { statusFilter, setStatusFilter, coproFilter, setCoproFilter, periodFilter, setPeriodFilter } = useTicketFilters();

  return (
    <Card className="w-64 h-full p-4 bg-sidebar-background border-r border-sidebar-border rounded-tr-lg rounded-br-lg shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-sidebar-foreground">Filtres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <Select onValueChange={setCoproFilter} value={coproFilter}>
            <SelectTrigger className="rounded-md border-sidebar-border bg-background text-foreground">
              <SelectValue placeholder="Copropriété" />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="A">Bâtiment A</SelectItem>
              <SelectItem value="B">Bâtiment B</SelectItem>
              <SelectItem value="C">Bâtiment C</SelectItem>
              <SelectItem value="D">Bâtiment D</SelectItem>
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
    </Card>
  );
};

export default Sidebar;
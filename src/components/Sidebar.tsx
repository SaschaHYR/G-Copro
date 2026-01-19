"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from './ui/use-toast';

const Sidebar = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [coproFilter, setCoproFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const { toast } = useToast();

  const handleNewTicket = () => {
    toast({
      title: "Nouveau Ticket",
      description: "Créer un nouveau ticket",
    });
  };

  return (
    <Card className="w-64 h-full">
      <CardHeader>
        <CardTitle>Filtres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ouvert">Ouvert</SelectItem>
              <SelectItem value="en cours">En cours</SelectItem>
              <SelectItem value="cloture">Clôturé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Copropriété</label>
          <Select onValueChange={setCoproFilter} value={coproFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Copropriété" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Bâtiment A</SelectItem>
              <SelectItem value="B">Bâtiment B</SelectItem>
              <SelectItem value="C">Bâtiment C</SelectItem>
              <SelectItem value="D">Bâtiment D</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
          <Select onValueChange={setPeriodFilter} value={periodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNewTicket} className="w-full">
          Nouveau Ticket
        </Button>
      </CardContent>
    </Card>
  );
};

export default Sidebar;
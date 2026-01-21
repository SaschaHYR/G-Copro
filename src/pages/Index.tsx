"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../components/NotificationContext';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const Index: React.FC = () => {
  const { ticketsWithNewActions } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query params
  const queryParams = new URLSearchParams(location.search);
  const [filter, setFilter] = useState<string>(queryParams.get('filter') || 'all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Update filter from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    if (filterParam) {
      setFilter(filterParam);
    }
  }, [location.search]);

  const handleNewTicket = () => {
    navigate('/new-ticket');
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    navigate('/');
  };

  const applyFilters = () => {
    // Build query params based on current filters
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);

    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-foreground">Mes Tickets</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewTicket}
              className="rounded-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Ticket
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-3 py-1"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="ouvert">Ouvert</SelectItem>
                      <SelectItem value="en cours">En cours</SelectItem>
                      <SelectItem value="transmis">Transmis</SelectItem>
                      <SelectItem value="fermé">Fermé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorité</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="basse">Basse</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="technique">Technique</SelectItem>
                      <SelectItem value="administratif">Administratif</SelectItem>
                      <SelectItem value="financier">Financier</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="rounded-full px-3 py-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  size="sm"
                  onClick={applyFilters}
                  className="rounded-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
                >
                  Appliquer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="grid grid-cols-4 max-w-md">
            <TabsTrigger value="all" onClick={() => setFilter('all')}>Tous</TabsTrigger>
            <TabsTrigger value="mine" onClick={() => setFilter('mine')}>Mes tickets</TabsTrigger>
            <TabsTrigger value="new-actions" onClick={() => setFilter('new-actions')}>
              Nouvelles actions
              {ticketsWithNewActions.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0" variant="destructive">
                  {ticketsWithNewActions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="closed" onClick={() => setFilter('closed')}>Fermés</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* TicketList component would be implemented separately */}
        <div className="space-y-4">
          {/* This would be replaced with actual TicketList component */}
          <p className="text-muted-foreground">Ticket list would appear here</p>
        </div>
      </main>
    </div>
  );
};

export default Index;
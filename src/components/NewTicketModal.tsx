"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, UserRole } from '@/types';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

const NewTicketModal = () => {
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('');
  const [copro, setCopro] = useState('');
  const [priorite, setPriorite] = useState('');
  const [piecesJointes, setPiecesJointes] = useState<File[]>([]);
  const [destinataire, setDestinataire] = useState<UserRole | ''>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Initialize useQueryClient

  const generateUniqueTicketId = () => {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random alphanumeric chars
    return `TICKET-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer un ticket.",
        variant: "destructive",
      });
      return;
    }

    const newTicket: Omit<Ticket, 'id' | 'date_create' | 'date_update' | 'cloture_date' | 'cloture_par'> = {
      ticket_id_unique: generateUniqueTicketId(),
      titre,
      description,
      categorie,
      copro,
      createur_id: user.id,
      destinataire_role: destinataire as UserRole,
      status: 'ouvert',
      priorite,
      pieces_jointes: piecesJointes.map(file => file.name), // Store file names for now
    };

    const { error } = await supabase.from('tickets').insert([newTicket]);

    if (error) {
      toast({
        title: "Erreur de création de ticket",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ticket créé avec succès",
        description: `Nouveau ticket: ${titre} (${newTicket.ticket_id_unique})`,
      });
      setOpen(false);
      // Invalidate the 'tickets' query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">Nouveau Ticket</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Nouveau Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre" className="text-sm font-medium text-foreground">Titre</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
              className="rounded-md border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="rounded-md border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="categorie" className="text-sm font-medium text-foreground">Catégorie</Label>
            <Select onValueChange={setCategorie} value={categorie} required>
              <SelectTrigger className="rounded-md border-border bg-background text-foreground focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="Chauffage">Chauffage</SelectItem>
                <SelectItem value="Eau">Eau</SelectItem>
                <SelectItem value="Ascenseur">Ascenseur</SelectItem>
                <SelectItem value="Communs">Communs</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="copro" className="text-sm font-medium text-foreground">Copropriété</Label>
            <Select onValueChange={setCopro} value={copro} required>
              <SelectTrigger className="rounded-md border-border bg-background text-foreground focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Sélectionner une copropriété" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="A">Bâtiment A</SelectItem>
                <SelectItem value="B">Bâtiment B</SelectItem>
                <SelectItem value="C">Bâtiment C</SelectItem>
                <SelectItem value="D">Bâtiment D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priorite" className="text-sm font-medium text-foreground">Priorité</Label>
            <Select onValueChange={setPriorite} value={priorite} required>
              <SelectTrigger className="rounded-md border-border bg-background text-foreground focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Sélectionner une priorité" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="Faible">Faible</SelectItem>
                <SelectItem value="Moyenne">Moyenne</SelectItem>
                <SelectItem value="Haute">Haute</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="destinataire" className="text-sm font-medium text-foreground">Destinataire</Label>
            <Select onValueChange={(value: UserRole) => setDestinataire(value)} value={destinataire} required>
              <SelectTrigger className="rounded-md border-border bg-background text-foreground focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Sélectionner un destinataire" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {user?.role === 'Proprietaire' && (
                  <SelectItem value="Conseil_Syndical">Conseil Syndical</SelectItem>
                )}
                {user?.role === 'Conseil_Syndical' && (
                  <SelectItem value="Syndicat_Copropriete">Syndicat de Copropriété</SelectItem>
                )}
                {user?.role === 'Syndicat_Copropriete' && (
                  <SelectItem value="ASL">ASL</SelectItem>
                )}
                {(user?.role === 'ASL' || user?.role === 'Superadmin') && (
                  <>
                    <SelectItem value="Proprietaire">Propriétaire</SelectItem>
                    <SelectItem value="Conseil_Syndical">Conseil Syndical</SelectItem>
                    <SelectItem value="Syndicat_Copropriete">Syndicat de Copropriété</SelectItem>
                    <SelectItem value="ASL">ASL</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="piecesJointes" className="text-sm font-medium text-foreground">Pièces jointes</Label>
            <Input
              id="piecesJointes"
              type="file"
              multiple
              onChange={(e) => setPiecesJointes(Array.from(e.target.files || []))}
              className="rounded-md border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <Button type="submit" className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300">
            Créer Ticket
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketModal;
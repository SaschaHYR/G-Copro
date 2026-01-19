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

const NewTicketModal = () => {
  const [open, setOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('');
  const [copro, setCopro] = useState('');
  const [piecesJointes, setPiecesJointes] = useState<File[]>([]);
  const [destinataire, setDestinataire] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Ticket créé",
      description: `Nouveau ticket: ${titre}`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nouveau Ticket</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="categorie">Catégorie</Label>
            <Select onValueChange={setCategorie} value={categorie} required>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="copro">Copropriété</Label>
            <Select onValueChange={setCopro} value={copro} required>
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
            <Label htmlFor="destinataire">Destinataire</Label>
            <Select onValueChange={setDestinataire} value={destinataire} required>
              <SelectTrigger>
                <SelectValue placeholder="Destinataire" />
              </SelectTrigger>
              <SelectContent>
                {user?.role === 'Proprietaire' && (
                  <SelectItem value="Conseil_Syndical">Conseil Syndical</SelectItem>
                )}
                {user?.role === 'Conseil_Syndical' && (
                  <SelectItem value="Syndicat_Copropriete">Syndicat de Copropriété</SelectItem>
                )}
                {user?.role === 'Syndicat_Copropriete' && (
                  <SelectItem value="ASL">ASL</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="piecesJointes">Pièces jointes</Label>
            <Input
              id="piecesJointes"
              type="file"
              multiple
              onChange={(e) => setPiecesJointes(Array.from(e.target.files || []))}
            />
          </div>
          <Button type="submit" className="w-full">
            Créer Ticket
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketModal;
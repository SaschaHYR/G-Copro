"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { UserRole } from '@/types';

interface TransferModalProps {
  ticketId: string;
  currentDestinataireRole: UserRole;
  onTransferSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ ticketId, onTransferSuccess }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [destinataire, setDestinataire] = useState<UserRole | ''>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getAvailableDestinataires = (role: UserRole) => {
    switch (role) {
      case 'Proprietaire':
        return ['Conseil_Syndical'];
      case 'Conseil_Syndical':
        return ['Syndicat_Copropriete'];
      case 'Syndicat_Copropriete':
        return ['ASL'];
      case 'ASL':
      case 'Superadmin':
        return ['Proprietaire', 'Conseil_Syndical', 'Syndicat_Copropriete', 'ASL'];
      default:
        return [];
    }
  };

  const availableDestinataires = user ? getAvailableDestinataires(user.role) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !destinataire) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté et sélectionner un destinataire.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      // Update ticket's destinataire_role, status, and date_update
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({
          destinataire_role: destinataire,
          status: 'transmis',
          date_update: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (ticketUpdateError) throw ticketUpdateError;

      // Insert transfer comment
      const { error: commentError } = await supabase.from('commentaires').insert({
        ticket_id: ticketId,
        auteur: user.id,
        message: `Ticket transmis à ${destinataire}. ${message}`,
        type: 'transfert',
      });

      if (commentError) throw commentError;

      toast({
        title: `Ticket ${ticketId} transmis`,
        description: `Le ticket a été transmis à ${destinataire}.`,
      });
      setOpen(false);
      setMessage('');
      setDestinataire('');
      onTransferSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur lors de la transmission du ticket",
        description: error.message || "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full px-3 py-1 text-sm md:px-4 md:py-2">
          Transmettre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-lg md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary md:text-2xl">Transmettre le Ticket {ticketId}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="destinataire" className="text-sm font-medium text-foreground">Destinataire</Label>
            <Select onValueChange={(value: UserRole) => setDestinataire(value)} value={destinataire} required disabled={loading}>
              <SelectTrigger className="rounded-md border-border bg-background text-foreground focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Sélectionner un destinataire" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {availableDestinataires.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-foreground">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={loading}
              className="rounded-md border-border focus:ring-primary focus:border-primary min-h-[100px]"
            />
          </div>
          <Button type="submit" className="w-full rounded-full py-2 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 md:text-lg" disabled={loading}>
            {loading ? 'Transmission en cours...' : 'Transmettre'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;
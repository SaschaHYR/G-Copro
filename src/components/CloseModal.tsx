"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';

interface CloseModalProps {
  ticketId: string;
  ticketStatus: string;
  onCloseSuccess: () => void;
}

const CloseModal: React.FC<CloseModalProps> = ({ ticketId, ticketStatus, onCloseSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isClosed = ticketStatus === 'cloture';
  // Removed unused actionType variable
  const ActionType = isClosed ? 'Réouvrir' : 'Clôturer';

  const handleClose = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const newStatus = isClosed ? 'ouvert' : 'cloture';

      const { error } = await supabase
        .from('tickets')
        .update({
          status: newStatus,
          cloture_par: isClosed ? null : user.id,
          cloture_date: isClosed ? null : new Date().toISOString(),
          date_update: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: `Ticket ${isClosed ? 'réouvert' : 'clôturé'}`,
        description: `Le ticket a été ${isClosed ? 'réouvert' : 'clôturé'} avec succès.`,
      });

      setOpen(false);
      onCloseSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du ticket.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          {ActionType}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {ActionType} le Ticket {ticketId}
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground mb-4">
          {isClosed
            ? 'Êtes-vous sûr de vouloir réouvrir ce ticket ?'
            : 'Êtes-vous sûr de vouloir clôturer ce ticket ?'}
        </p>
        <Button
          onClick={handleClose}
          className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
          disabled={loading}
        >
          {loading ? 'Traitement en cours...' : ActionType}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CloseModal;
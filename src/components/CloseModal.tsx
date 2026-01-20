"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';

interface CloseModalProps {
  ticketId: string;
  ticketStatus: 'ouvert' | 'en cours' | 'transmis' | 'cloture';
  onCloseSuccess: () => void; // Callback to refresh ticket list
}

const CloseModal: React.FC<CloseModalProps> = ({ ticketId, ticketStatus, onCloseSuccess }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(''); // Message for closing, not stored as a comment in current schema
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isClosed = ticketStatus === 'cloture';
  const actionType = isClosed ? 'réouvrir' : 'clôturer';
  const ActionType = isClosed ? 'Réouvrir' : 'Clôturer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour " + (isClosed ? "réouvrir" : "clôturer") + " un ticket.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      const updateData = isClosed
        ? {
            status: 'ouvert',
            date_update: new Date().toISOString(),
          }
        : {
            status: 'cloture',
            cloture_par: user.id,
            cloture_date: new Date().toISOString(),
            date_update: new Date().toISOString(),
          };

      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (ticketUpdateError) throw ticketUpdateError;

      toast({
        title: `Ticket ${ticketId} ${isClosed ? 'réouvert' : 'clôturé'}`,
        description: `Le ticket a été ${isClosed ? 'réouvert' : 'clôturé'} avec succès.`,
      });
      setOpen(false);
      setMessage('');
      onCloseSuccess(); // Refresh the ticket list
    } catch (error: any) {
      toast({
        title: `Erreur lors de la ${isClosed ? 'réouverture' : 'clôture'} du ticket`,
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
        <Button variant="outline" size="sm" className="rounded-full">
          {ActionType}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">{ActionType} le Ticket {ticketId}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-foreground">Message {isClosed ? 'de réouverture' : 'de clôture'} (optionnel)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              className="rounded-md border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <Button type="submit" className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300" disabled={loading}>
            {loading ? `${ActionType} en cours...` : ActionType}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CloseModal;
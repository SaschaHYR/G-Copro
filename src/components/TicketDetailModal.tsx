"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { Ticket } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface TicketDetailModalProps {
  ticket: Ticket;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket }) => {
  const [open, setOpen] = useState(false);
  const [creatorName, setCreatorName] = useState('Chargement...');
  const [closerName, setCloserName] = useState('N/A');
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserNames = async () => {
      if (ticket.createur_id) {
        const { data: creatorData, error: creatorError } = await supabase
          .from('user_informations') // Fetch from new table
          .select('first_name, last_name')
          .eq('id', ticket.createur_id)
          .single();
        if (creatorData) {
          setCreatorName(`${creatorData.first_name || ''} ${creatorData.last_name || ''}`.trim());
        } else if (creatorError) {
          console.error("Error fetching creator name:", creatorError);
          setCreatorName('Inconnu');
        }
      }

      if (ticket.cloture_par) {
        const { data: closerData, error: closerError } = await supabase
          .from('user_informations') // Fetch from new table
          .select('first_name, last_name')
          .eq('id', ticket.cloture_par)
          .single();
        if (closerData) {
          setCloserName(`${closerData.first_name || ''} ${closerData.last_name || ''}`.trim());
        } else if (closerError) {
          console.error("Error fetching closer name:", closerError);
          setCloserName('Inconnu');
        }
      }
    };

    if (open) {
      fetchUserNames();
    }
  }, [open, ticket.createur_id, ticket.cloture_par]);

  const handleClose = () => {
    toast({
      title: `Ticket ${ticket.ticket_id_unique}`,
      description: `Statut: ${ticket.status}`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          Voir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Détails du Ticket {ticket.ticket_id_unique}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="rounded-lg shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-foreground">{ticket.titre}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Créé par</p>
                  <p className="font-medium text-foreground">{creatorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Copropriété</p>
                  <p className="font-medium text-foreground">{ticket.copro}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Catégorie</p>
                  <p className="font-medium text-foreground">{ticket.categorie}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <Badge
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    variant={
                      ticket.status === 'ouvert'
                        ? 'default'
                        : ticket.status === 'en cours'
                        ? 'secondary'
                        : ticket.status === 'transmis'
                        ? 'outline'
                        : 'destructive'
                    }
                  >
                    {ticket.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priorité</p>
                  <p className="font-medium text-foreground">{ticket.priorite}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destinataire</p>
                  <p className="font-medium text-foreground">{ticket.destinataire_role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de création</p>
                  <p className="font-medium text-foreground">{new Date(ticket.date_create).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de dernière action</p>
                  <p className="font-medium text-foreground">{ticket.date_update ? new Date(ticket.date_update).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Clôturé par</p>
                  <p className="font-medium text-foreground">{closerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de clôture</p>
                  <p className="font-medium text-foreground">{ticket.cloture_date ? new Date(ticket.cloture_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-foreground">{ticket.description}</p>
              </div>
              {ticket.pieces_jointes && ticket.pieces_jointes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-gray-500 mb-2">Pièces jointes</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.pieces_jointes.map((piece, index) => (
                      <Button key={index} variant="outline" size="sm" className="rounded-full">
                        {piece}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Button onClick={handleClose} className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailModal;
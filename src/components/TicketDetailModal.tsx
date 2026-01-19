"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';

interface Ticket {
  id: string;
  ticket_id_unique: string;
  titre: string;
  description: string;
  categorie: string;
  copro: string;
  createur: string;
  status: string;
  date_create: string;
  date_update: string;
  cloture_date: string;
  pieces_jointes: string[];
}

interface TicketDetailModalProps {
  ticket: Ticket;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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
        <Button variant="outline" size="sm">
          Voir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Détails du Ticket {ticket.ticket_id_unique}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{ticket.titre}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Créé par</p>
                  <p>{ticket.createur}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Copropriété</p>
                  <p>{ticket.copro}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Catégorie</p>
                  <p>{ticket.categorie}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <Badge variant={ticket.status === 'ouvert' ? 'default' : ticket.status === 'en cours' ? 'secondary' : 'destructive'}>
                    {ticket.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de création</p>
                  <p>{ticket.date_create}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de dernière action</p>
                  <p>{ticket.date_update}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de clôture</p>
                  <p>{ticket.cloture_date || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Description</p>
                <p>{ticket.description}</p>
              </div>
              {ticket.pieces_jointes && ticket.pieces_jointes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Pièces jointes</p>
                  <div className="flex space-x-2">
                    {ticket.pieces_jointes.map((piece, index) => (
                      <Button key={index} variant="outline" size="sm">
                        {piece}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Button onClick={handleClose} className="w-full">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailModal;
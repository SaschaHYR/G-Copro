"use client";

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from './ui/use-toast';

interface Ticket {
  id: string;
  ticket_id_unique: string;
  titre: string;
  copro: string;
  createur: string;
  status: string;
  date_create: string;
  date_update: string;
  cloture_date: string;
}

const TicketDataTable = () => {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      ticket_id_unique: 'TICKET-001',
      titre: 'Problème de chauffage',
      copro: 'A',
      createur: 'Jean Dupont',
      status: 'ouvert',
      date_create: '2023-10-01',
      date_update: '2023-10-01',
      cloture_date: '',
    },
    {
      id: '2',
      ticket_id_unique: 'TICKET-002',
      titre: 'Fuite d\'eau',
      copro: 'B',
      createur: 'Marie Martin',
      status: 'en cours',
      date_create: '2023-10-02',
      date_update: '2023-10-03',
      cloture_date: '',
    },
  ]);

  const { toast } = useToast();

  const handleView = (ticket: Ticket) => {
    toast({
      title: `Ticket ${ticket.ticket_id_unique}`,
      description: `Titre: ${ticket.titre}`,
    });
  };

  const handleReply = (ticket: Ticket) => {
    toast({
      title: `Répondre au ticket ${ticket.ticket_id_unique}`,
      description: `Répondre au ticket: ${ticket.titre}`,
    });
  };

  const handleClose = (ticket: Ticket) => {
    toast({
      title: `Clôturer le ticket ${ticket.ticket_id_unique}`,
      description: `Clôturer le ticket: ${ticket.titre}`,
    });
  };

  const handleTransfer = (ticket: Ticket) => {
    toast({
      title: `Transmettre le ticket ${ticket.ticket_id_unique}`,
      description: `Transmettre le ticket: ${ticket.titre}`,
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Copro</TableHead>
            <TableHead>Créé par</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date création</TableHead>
            <TableHead>Date de dernière action</TableHead>
            <TableHead>Date clôture</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>{ticket.ticket_id_unique}</TableCell>
              <TableCell>{ticket.titre}</TableCell>
              <TableCell>{ticket.copro}</TableCell>
              <TableCell>{ticket.createur}</TableCell>
              <TableCell>
                <Badge variant={ticket.status === 'ouvert' ? 'default' : ticket.status === 'en cours' ? 'secondary' : 'destructive'}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>{ticket.date_create}</TableCell>
              <TableCell>{ticket.date_update}</TableCell>
              <TableCell>{ticket.cloture_date || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(ticket)}>
                    Voir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleReply(ticket)}>
                    Répondre
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleClose(ticket)}>
                    Clôturer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleTransfer(ticket)}>
                    Transmettre
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TicketDataTable;
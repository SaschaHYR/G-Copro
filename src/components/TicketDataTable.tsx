"use client";

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import TicketDetailModal from './TicketDetailModal';
import ReplyModal from './ReplyModal';
import CloseModal from './CloseModal';
import TransferModal from './TransferModal';

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

const TicketDataTable = () => {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      ticket_id_unique: 'TICKET-001',
      titre: 'Problème de chauffage',
      description: 'Le chauffage ne fonctionne pas dans l\'appartement 101.',
      categorie: 'Chauffage',
      copro: 'A',
      createur: 'Jean Dupont',
      status: 'ouvert',
      date_create: '2023-10-01',
      date_update: '2023-10-01',
      cloture_date: '',
      pieces_jointes: ['photo1.jpg', 'photo2.jpg'],
    },
    {
      id: '2',
      ticket_id_unique: 'TICKET-002',
      titre: 'Fuite d\'eau',
      description: 'Il y a une fuite d\'eau dans la salle de bain.',
      categorie: 'Eau',
      copro: 'B',
      createur: 'Marie Martin',
      status: 'en cours',
      date_create: '2023-10-02',
      date_update: '2023-10-03',
      cloture_date: '',
      pieces_jointes: ['photo1.jpg'],
    },
  ]);

  const { toast } = useToast();

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
                  <TicketDetailModal ticket={ticket} />
                  <ReplyModal ticketId={ticket.ticket_id_unique} />
                  <CloseModal ticketId={ticket.ticket_id_unique} />
                  <TransferModal ticketId={ticket.ticket_id_unique} />
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
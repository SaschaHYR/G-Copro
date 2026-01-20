"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import TicketDetailModal from './TicketDetailModal';
import ReplyModal from './ReplyModal';
import CloseModal from './CloseModal';
import TransferModal from './TransferModal';
import { useTickets } from '@/hooks/use-tickets';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

const TicketDataTable = () => {
  const { tickets, isLoading, error, invalidateTickets } = useTickets();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur de chargement des tickets",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-destructive">Erreur de chargement des tickets</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-lg border border-border">
      <Table>
        <TableHeader className="bg-primary">
          <TableRow>
            <TableHead className="text-primary-foreground rounded-tl-lg text-sm md:text-base">ID</TableHead>
            <TableHead className="text-primary-foreground text-sm md:text-base">Titre</TableHead>
            <TableHead className="text-primary-foreground text-sm md:text-base">Copro</TableHead>
            <TableHead className="text-primary-foreground text-sm md:text-base">Créé par</TableHead>
            <TableHead className="text-primary-foreground text-sm md:text-base">Statut</TableHead>
            <TableHead className="text-primary-foreground text-sm md:text-base">Priorité</TableHead>
            <TableHead className="text-primary-foreground text-sm md:text-base">Date création</TableHead>
            <TableHead className="text-primary-foreground text-sm md:text-base">Date de dernière action</TableHead>
            <TableHead className="text-primary-foreground rounded-tr-lg text-sm md:text-base">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Aucun ticket trouvé.
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium text-sm md:text-base">{ticket.ticket_id_unique}</TableCell>
                <TableCell className="text-sm md:text-base">{ticket.titre}</TableCell>
                <TableCell className="text-sm md:text-base">{ticket.copro}</TableCell>
                <TableCell className="text-sm md:text-base">{ticket.createur?.first_name} {ticket.createur?.last_name}</TableCell>
                <TableCell>
                  <Badge
                    className="rounded-full px-2 py-1 text-xs font-semibold md:px-3 md:py-1"
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
                </TableCell>
                <TableCell className="text-sm md:text-base">{ticket.priorite}</TableCell>
                <TableCell className="text-sm md:text-base">{new Date(ticket.date_create).toLocaleDateString()}</TableCell>
                <TableCell className="text-sm md:text-base">{ticket.date_update ? new Date(ticket.date_update).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex space-x-1 md:space-x-2">
                    <TicketDetailModal ticket={ticket} />
                    <ReplyModal ticketId={ticket.id} onReplySuccess={invalidateTickets} />
                    <CloseModal
                      ticketId={ticket.id}
                      ticketStatus={ticket.status}
                      onCloseSuccess={invalidateTickets}
                    />
                    <TransferModal ticketId={ticket.id} currentDestinataireRole={ticket.destinataire_role} onTransferSuccess={invalidateTickets} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TicketDataTable;
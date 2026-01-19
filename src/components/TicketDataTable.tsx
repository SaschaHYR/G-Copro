"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import TicketDetailModal from './TicketDetailModal';
import ReplyModal from './ReplyModal';
import CloseModal from './CloseModal';
import TransferModal from './TransferModal';
import { useTickets } from '@/hooks/use-tickets'; // Import the new hook

const TicketDataTable = () => {
  const { tickets, isLoading, error, invalidateTickets } = useTickets();
  const { toast } = useToast();

  if (error) {
    toast({
      title: "Erreur de chargement des tickets",
      description: error.message,
      variant: "destructive",
    });
  }

  if (isLoading) {
    return <div className="text-center py-8">Chargement des tickets...</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-lg border border-border">
      <Table>
        <TableHeader className="bg-secondary">
          <TableRow>
            <TableHead className="text-primary-foreground rounded-tl-lg">ID</TableHead>
            <TableHead className="text-primary-foreground">Titre</TableHead>
            <TableHead className="text-primary-foreground">Copro</TableHead>
            <TableHead className="text-primary-foreground">Créé par</TableHead>
            <TableHead className="text-primary-foreground">Statut</TableHead>
            <TableHead className="text-primary-foreground">Priorité</TableHead>
            <TableHead className="text-primary-foreground">Date création</TableHead>
            <TableHead className="text-primary-foreground">Date de dernière action</TableHead>
            <TableHead className="text-primary-foreground rounded-tr-lg">Actions</TableHead>
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
                <TableCell className="font-medium">{ticket.ticket_id_unique}</TableCell>
                <TableCell>{ticket.titre}</TableCell>
                <TableCell>{ticket.copro}</TableCell>
                <TableCell>{ticket.createur?.first_name} {ticket.createur?.last_name}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>{ticket.priorite}</TableCell>
                <TableCell>{new Date(ticket.date_create).toLocaleDateString()}</TableCell>
                <TableCell>{ticket.date_update ? new Date(ticket.date_update).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <TicketDetailModal ticket={ticket} />
                    <ReplyModal ticketId={ticket.id} onReplySuccess={invalidateTickets} />
                    <CloseModal ticketId={ticket.id} onCloseSuccess={invalidateTickets} />
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
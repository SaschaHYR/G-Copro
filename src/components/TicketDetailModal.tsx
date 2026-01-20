"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { Ticket, Commentaire } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TicketDetailModalProps {
  ticket: Ticket;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Commentaire[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, { first_name: string; last_name: string }>>({});
  const { toast } = useToast();

  // Directly use the joined user data from the ticket prop
  const creatorName = ticket.createur ? `${ticket.createur.first_name || ''} ${ticket.createur.last_name || ''}`.trim() : 'Inconnu';
  const closerName = ticket.cloture_par_user ? `${ticket.cloture_par_user.first_name || ''} ${ticket.cloture_par_user.last_name || ''}`.trim() : 'N/A';

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('commentaires')
        .select('*, auteur:user_informations!auteur(first_name, last_name)')
        .eq('ticket_id', ticket.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur de chargement des commentaires",
        description: error.message || "Impossible de charger les échanges pour ce ticket",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [open, ticket.id]);

  const handleClose = () => {
    toast({
      title: `Ticket ${ticket.ticket_id_unique}`,
      description: `Statut: ${ticket.status}`,
    });
    setOpen(false);
  };

  const getUserDisplayName = (userId: string) => {
    // Check if we have the user data from comments
    const commentUser = comments.find(c => c.auteur === userId)?.auteur;
    if (commentUser) {
      return `${commentUser.first_name || ''} ${commentUser.last_name || ''}`.trim() || 'Utilisateur';
    }

    // Fallback to ticket creator or closer if available
    if (ticket.createur_id === userId && ticket.createur) {
      return creatorName;
    }
    if (ticket.cloture_par === userId && ticket.cloture_par_user) {
      return closerName;
    }

    return 'Utilisateur';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          Voir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Détails du Ticket {ticket.ticket_id_unique}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
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

          {/* Comments/Exchanges Section */}
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Échanges</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingComments ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun échange pour ce ticket.</p>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="/placeholder.svg" alt="Avatar" />
                        <AvatarFallback className="text-sm font-bold bg-primary text-primary-foreground">
                          {getUserDisplayName(comment.auteur).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-foreground">{getUserDisplayName(comment.auteur)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comment.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                          <Badge variant={comment.type === 'reponse' ? 'default' : 'secondary'} className="text-xs">
                            {comment.type === 'reponse' ? 'Réponse' : 'Transfert'}
                          </Badge>
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-foreground">{comment.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
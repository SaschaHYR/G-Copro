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
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
import { useNotifications } from './NotificationContext';

interface TicketDetailModalProps {
  ticket: Ticket;
}

interface UserDisplayInfo {
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  username: string | null; // Ajout du username
}

interface CommentWithAuthor extends Commentaire {
  authorInfo?: UserDisplayInfo;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [userCache, setUserCache] = useState<Record<string, UserDisplayInfo>>({});
  const { toast } = useToast();
  const { markTicketAsRead } = useNotifications();

  // Directly use the joined user data from the ticket prop
  const creatorName = ticket.createur ? `${ticket.createur.first_name || ''} ${ticket.createur.last_name || ''}`.trim() : 'Inconnu';
  const closerName = ticket.cloture_par_user ? `${ticket.cloture_par_user.first_name || ''} ${ticket.cloture_par_user.last_name || ''}`.trim() : 'N/A';

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('commentaires')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('date', { ascending: true });

      if (error) throw error;

      // Fetch all unique author IDs
      const authorIds = [...new Set(data.map(comment => comment.auteur))].filter(Boolean) as string[]; // Filter out null/undefined

      // Fetch all author data in one batch, including username
      const { data: authorsData, error: authorsError } = await supabase
        .from('user_informations')
        .select('id, first_name, last_name, role, username') // Sélectionne le username
        .in('id', authorIds);

      if (authorsError) throw authorsError;

      // Create a map of author data
      const authorMap = authorsData.reduce((acc, author) => {
        acc[author.id] = author;
        return acc;
      }, {} as Record<string, UserDisplayInfo>);

      // Debug: Log the author map
      console.log("[TicketDetailModal] Author Map:", authorMap);

      // Update user cache
      setUserCache(prev => ({ ...prev, ...authorMap }));

      // Combine comments with author data
      const commentsWithAuthors = data.map(comment => ({
        ...comment,
        authorInfo: authorMap[comment.auteur] || null
      }));

      // Debug: Log comments with author info
      console.log("[TicketDetailModal] Comments with Author Info:", commentsWithAuthors);

      setComments(commentsWithAuthors);
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
      // Mark ticket as read when opened
      markTicketAsRead(ticket.id);
    }
  }, [open, ticket.id, markTicketAsRead]);

  const handleClose = () => {
    toast({
      title: `Ticket ${ticket.ticket_id_unique}`,
      description: `Statut: ${ticket.status}`,
    });
    setOpen(false);
  };

  const getUserDisplayName = (userId: string, authorInfo?: UserDisplayInfo | null): string => {
    // First try to use the author info we fetched with the comments
    if (authorInfo) {
      const fullName = `${authorInfo.first_name || ''} ${authorInfo.last_name || ''}`.trim();
      if (fullName) return fullName;
      if (authorInfo.username) return authorInfo.username; // Fallback to username
    }

    // Fallback to ticket creator or closer if available
    if (ticket.createur_id === userId && ticket.createur) {
      return creatorName;
    }
    if (ticket.cloture_par === userId && ticket.cloture_par_user) {
      return closerName;
    }

    // Fallback to cached user data (should be populated by fetchComments)
    const cachedUser = userCache[userId];
    if (cachedUser) {
      const fullName = `${cachedUser.first_name || ''} ${cachedUser.last_name || ''}`.trim();
      if (fullName) return fullName;
      if (cachedUser.username) return cachedUser.username; // Fallback to username
    }

    // Final fallback: display the user ID if no name or username is found
    return userId || 'Utilisateur inconnu';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full px-2 py-1 text-xs md:px-3 md:py-1 md:text-sm">
          Voir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] rounded-lg max-h-[90vh] md:max-w-[900px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary md:text-xl">Détails du Ticket {ticket.ticket_id_unique}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-150px)] pr-4">
          <div className="space-y-4">
            <Card className="rounded-lg shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold text-foreground md:text-lg truncate">
                    {ticket.titre}
                  </CardTitle>
                  <Badge
                    className="rounded-full px-2 py-1 text-xs font-semibold"
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
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground">Créé par</p>
                    <p className="font-medium text-foreground truncate">{creatorName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Copropriété</p>
                    <p className="font-medium text-foreground truncate">{ticket.copro}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Catégorie</p>
                    <p className="font-medium text-foreground truncate">{ticket.categorie}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Priorité</p>
                    <p className="font-medium text-foreground">{ticket.priorite}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Destinataire</p>
                    <p className="font-medium text-foreground truncate">{ticket.destinataire_role}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date de création</p>
                    <p className="font-medium text-foreground">{new Date(ticket.date_create).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date de dernière action</p>
                    <p className="font-medium text-foreground">{ticket.date_update ? new Date(ticket.date_update).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clôturé par</p>
                    <p className="font-medium text-foreground truncate">{closerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date de clôture</p>
                    <p className="font-medium text-foreground">{ticket.cloture_date ? new Date(ticket.cloture_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="text-foreground">{ticket.description}</p>
                </div>
                {ticket.pieces_jointes && ticket.pieces_jointes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-muted-foreground mb-1">Pièces jointes</p>
                    <div className="flex flex-wrap gap-1">
                      {ticket.pieces_jointes.map((piece, index) => (
                        <Button key={index} variant="outline" size="sm" className="rounded-full text-xs px-2 py-1 h-6">
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
                <CardTitle className="text-base font-semibold md:text-lg">Échanges</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingComments ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-2 p-2 border rounded-lg">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-1/3" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-3 text-sm">Aucun échange pour ce ticket.</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        displayName={getUserDisplayName(comment.auteur, comment.authorInfo)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <Button onClick={handleClose} className="w-full rounded-full py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 md:text-base">
          Fermer
        </Button>
      </DialogContent>
    </Dialog>
  );
};

interface CommentItemProps {
  comment: CommentWithAuthor;
  displayName: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, displayName }) => {
  return (
    <div className="flex items-start space-x-2">
      <Avatar className="w-8 h-8">
        <AvatarImage src="/placeholder.svg" alt="Avatar" />
        <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
          {displayName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center space-x-1 mb-1">
          <p className="font-medium text-foreground text-sm">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(comment.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
          </p>
          <Badge variant={comment.type === 'reponse' ? 'default' : 'secondary'} className="text-xs px-1 py-0 h-5">
            {comment.type === 'reponse' ? 'Réponse' : 'Transfert'}
          </Badge>
        </div>
        <div className="bg-muted p-2 rounded-lg text-sm">
          <p className="text-foreground">{comment.message}</p>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
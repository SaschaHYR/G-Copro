"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { Input } from './ui/input';

interface ReplyModalProps {
  ticketId: string;
  onReplySuccess: () => void; // Callback to refresh ticket list
}

const ReplyModal: React.FC<ReplyModalProps> = ({ ticketId, onReplySuccess }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour répondre à un ticket.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      // Upload photos to Supabase storage
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        const uploadPromises = photos.map(async (photo) => {
          const fileName = `ticket_${ticketId}_${Date.now()}_${photo.name}`;
          const { data, error } = await supabase
            .storage
            .from('ticket_attachments')
            .upload(fileName, photo);

          if (error) throw error;
          return supabase.storage.from('ticket_attachments').getPublicUrl(data.path).data.publicUrl;
        });

        photoUrls = await Promise.all(uploadPromises);
      }

      // Insert comment with photo URLs if any
      const commentMessage = photoUrls.length > 0
        ? `${message}\n\nPhotos jointes: ${photoUrls.join(', ')}`
        : message;

      // Insert comment
      const { error: commentError } = await supabase.from('commentaires').insert({
        ticket_id: ticketId,
        auteur: user.id,
        message: commentMessage,
        type: 'reponse',
      });

      if (commentError) throw commentError;

      // Update ticket's date_update
      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({ date_update: new Date().toISOString() })
        .eq('id', ticketId);

      if (ticketUpdateError) throw ticketUpdateError;

      toast({
        title: `Réponse au ticket ${ticketId}`,
        description: "Votre réponse a été envoyée avec succès.",
      });
      setOpen(false);
      setMessage('');
      setPhotos([]);
      onReplySuccess(); // Refresh the ticket list
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'envoi de la réponse",
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
          Répondre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Répondre au Ticket {ticketId}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-foreground">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={loading}
              className="rounded-md border-border focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="photos" className="text-sm font-medium text-foreground">Photos (optionnel)</Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
              disabled={loading}
              className="rounded-md border-border focus:ring-primary focus:border-primary"
            />
            {photos.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {photos.length} photo(s) sélectionnée(s)
              </p>
            )}
          </div>
          <Button type="submit" className="w-full rounded-full py-2 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300" disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReplyModal;
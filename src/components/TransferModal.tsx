"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';

interface TransferModalProps {
  ticketId: string;
}

const TransferModal: React.FC<TransferModalProps> = ({ ticketId }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [destinataire, setDestinataire] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: `Ticket ${ticketId} transmis`,
      description: `Message: ${message}, Destinataire: ${destinataire}`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Transmettre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transmettre le Ticket {ticketId}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="destinataire">Destinataire</Label>
            <Select onValueChange={setDestinataire} value={destinataire} required>
              <SelectTrigger>
                <SelectValue placeholder="Destinataire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Conseil_Syndical">Conseil Syndical</SelectItem>
                <SelectItem value="Syndicat_Copropriete">Syndicat de Copropriété</SelectItem>
                <SelectItem value="ASL">ASL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Transmettre
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;
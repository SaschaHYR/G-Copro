"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface CoproprieteFormProps {
  copropriete: {
    nom: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    description?: string;
    actif: boolean;
    syndic_nom?: string;
    syndic_responsable_nom?: string;
    syndic_responsable_prenom?: string;
    syndic_email?: string;
    syndic_telephone?: string;
  };
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  submitText: string;
  isLoading?: boolean;
}

const CoproprieteForm: React.FC<CoproprieteFormProps> = ({
  copropriete,
  onChange,
  onSubmit,
  submitText,
  isLoading = false
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nom" className="text-sm font-medium text-foreground">Nom</Label>
        <Input
          id="nom"
          value={copropriete.nom}
          onChange={(e) => onChange('nom', e.target.value)}
          required
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="adresse" className="text-sm font-medium text-foreground">Adresse</Label>
        <Input
          id="adresse"
          value={copropriete.adresse}
          onChange={(e) => onChange('adresse', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="ville" className="text-sm font-medium text-foreground">Ville</Label>
        <Input
          id="ville"
          value={copropriete.ville}
          onChange={(e) => onChange('ville', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="code_postal" className="text-sm font-medium text-foreground">Code Postal</Label>
        <Input
          id="code_postal"
          value={copropriete.code_postal}
          onChange={(e) => onChange('code_postal', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
        <Textarea
          id="description"
          value={copropriete.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="syndic_nom" className="text-sm font-medium text-foreground">Nom du Syndic</Label>
        <Input
          id="syndic_nom"
          value={copropriete.syndic_nom}
          onChange={(e) => onChange('syndic_nom', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="syndic_responsable_nom" className="text-sm font-medium text-foreground">Nom du Responsable Syndic</Label>
        <Input
          id="syndic_responsable_nom"
          value={copropriete.syndic_responsable_nom}
          onChange={(e) => onChange('syndic_responsable_nom', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="syndic_responsable_prenom" className="text-sm font-medium text-foreground">Prénom du Responsable Syndic</Label>
        <Input
          id="syndic_responsable_prenom"
          value={copropriete.syndic_responsable_prenom}
          onChange={(e) => onChange('syndic_responsable_prenom', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="syndic_email" className="text-sm font-medium text-foreground">Email du Syndic</Label>
        <Input
          id="syndic_email"
          type="email"
          value={copropriete.syndic_email}
          onChange={(e) => onChange('syndic_email', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <Label htmlFor="syndic_telephone" className="text-sm font-medium text-foreground">Téléphone du Syndic</Label>
        <Input
          id="syndic_telephone"
          value={copropriete.syndic_telephone}
          onChange={(e) => onChange('syndic_telephone', e.target.value)}
          className="rounded-md border-border focus:ring-primary focus:border-primary"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="actif"
          checked={copropriete.actif}
          onCheckedChange={(checked: boolean) => onChange('actif', checked)}
        />
        <Label htmlFor="actif" className="text-sm font-medium text-foreground">
          Active
        </Label>
      </div>
      <Button
        onClick={onSubmit}
        className="w-full rounded-full py-2 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 md:text-lg"
        disabled={isLoading}
      >
        {isLoading ? 'Traitement en cours...' : submitText}
      </Button>
    </div>
  );
};

export default CoproprieteForm;
"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface Copropriete {
  id: string;
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
}

interface CoproprieteTableProps {
  coproprietes: Copropriete[];
  onEdit: (copropriete: Copropriete) => void;
  onDelete: (coproprieteId: string) => void;
  canManage: boolean;
  loading: boolean;
}

const CoproprieteTable: React.FC<CoproprieteTableProps> = ({
  coproprietes,
  onEdit,
  onDelete,
  canManage,
  loading
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="h-12 w-12 rounded bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-sm md:text-base">Nom</TableHead>
            <TableHead className="text-sm md:text-base">Description</TableHead>
            <TableHead className="text-sm md:text-base">Syndic</TableHead>
            <TableHead className="text-sm md:text-base">Adresse</TableHead>
            <TableHead className="text-sm md:text-base">Ville</TableHead>
            <TableHead className="text-sm md:text-base">Code Postal</TableHead>
            <TableHead className="text-sm md:text-base">Statut</TableHead>
            {canManage && <TableHead className="text-right text-sm md:text-base">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {coproprietes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canManage ? 8 : 7} className="text-center py-8 text-muted-foreground">
                Aucune copropriété trouvée.
              </TableCell>
            </TableRow>
          ) : (
            coproprietes.map((copropriete) => (
              <TableRow key={copropriete.id}>
                <TableCell className="font-medium text-sm md:text-base">{copropriete.nom}</TableCell>
                <TableCell className="max-w-xs truncate text-sm md:text-base">{copropriete.description || 'N/A'}</TableCell>
                <TableCell>
                  {copropriete.syndic_nom ? (
                    <div>
                      <div className="font-medium text-sm md:text-base">{copropriete.syndic_nom}</div>
                      {copropriete.syndic_responsable_prenom && copropriete.syndic_responsable_nom && (
                        <div className="text-sm text-muted-foreground">
                          {copropriete.syndic_responsable_prenom} {copropriete.syndic_responsable_nom}
                        </div>
                      )}
                    </div>
                  ) : 'N/A'}
                </TableCell>
                <TableCell className="text-sm md:text-base">{copropriete.adresse || 'N/A'}</TableCell>
                <TableCell className="text-sm md:text-base">{copropriete.ville || 'N/A'}</TableCell>
                <TableCell className="text-sm md:text-base">{copropriete.code_postal || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={copropriete.actif ? 'default' : 'destructive'}>
                    {copropriete.actif ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(copropriete)}
                        className="text-sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(copropriete.id)}
                        className="text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CoproprieteTable;
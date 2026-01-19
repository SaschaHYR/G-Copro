export type UserRole = 'Superadmin' | 'ASL' | 'Syndicat_Copropriete' | 'Conseil_Syndical' | 'Proprietaire' | 'En attente';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  copro: string;
  first_name: string;
  last_name: string;
  actif: boolean;
}

export interface Ticket {
  id: string;
  ticket_id_unique: string;
  titre: string;
  description: string;
  categorie: string;
  copro: string;
  createur_id: string;
  destinataire_role: UserRole;
  status: 'ouvert' | 'en cours' | 'transmis' | 'cloture';
  priorite: string;
  date_create: string;
  date_update: string;
  cloture_par: string;
  cloture_date: string;
  pieces_jointes: string[];
  // Add the joined user data
  createur?: Pick<User, 'first_name' | 'last_name'>;
  cloture_par_user?: Pick<User, 'first_name' | 'last_name'>;
}

export interface Commentaire {
  id: string;
  ticket_id: string;
  auteur: string;
  message: string;
  date: string;
  type: 'reponse' | 'transfert';
}
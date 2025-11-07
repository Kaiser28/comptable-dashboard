/**
 * Représente un cabinet tel qu’enregistré dans la table `cabinets` de Supabase.
 */
export type Cabinet = {
  /** Identifiant unique généré par Supabase (UUID). */
  id: string;
  /** Nom commercial ou raison sociale du cabinet. */
  nom: string;
  /** Adresse e-mail principale du cabinet. */
  email: string;
  /** Numéro de téléphone du cabinet (peut être absent). */
  telephone: string | null;
  /** Adresse postale complète du cabinet (peut être absente). */
  adresse: string | null;
  /** Date de création de l’enregistrement (format ISO 8601). */
  created_at: string;
  /** Date de dernière mise à jour de l’enregistrement (format ISO 8601). */
  updated_at: string;
};

/**
 * Représente un client rattaché à un cabinet dans la table `clients` de Supabase.
 */
export type Client = {
  /** Identifiant unique du client (UUID). */
  id: string;
  /** Identifiant du cabinet associé au client. */
  cabinet_id: string;
  /** Nom commercial ou raison sociale de l’entreprise cliente. */
  nom_entreprise: string;
  /** Forme juridique de l’entreprise (peut être absente). */
  forme_juridique: string | null;
  /** Montant du capital social déclaré (peut être absent). */
  capital_social: number | null;
  /** Adresse e-mail de contact du client (peut être absente). */
  email: string | null;
  /** Numéro de téléphone du client (peut être absent). */
  telephone: string | null;
  /** Adresse postale du client (peut être absente). */
  adresse: string | null;
  /** Numéro SIRET de l’entreprise (peut être absent). */
  siret: string | null;
  /** Statut actuel du client dans le parcours (ex: actif, en attente). */
  statut: string;
  /** Token unique pour accéder au formulaire de collecte d’informations. */
  formulaire_token: string;
  /** Indique si le formulaire a été complété par le client. */
  formulaire_complete: boolean;
  /** Date de création de l’enregistrement (format ISO 8601). */
  created_at: string;
  /** Date de dernière mise à jour de l’enregistrement (format ISO 8601). */
  updated_at: string;
};

/**
 * Représente un associé lié à un client dans la table `associes` de Supabase.
 */
export type Associe = {
  /** Identifiant unique de l’associé (UUID). */
  id: string;
  /** Identifiant du client auquel l’associé est rattaché. */
  client_id: string;
  /** Civilité de l’associé (ex. M., Mme). */
  civilite: string;
  /** Nom de famille de l’associé. */
  nom: string;
  /** Prénom de l’associé. */
  prenom: string;
  /** Date de naissance de l’associé (format ISO 8601). */
  date_naissance: string;
  /** Lieu de naissance de l’associé. */
  lieu_naissance: string;
  /** Nationalité de l’associé. */
  nationalite: string;
  /** Adresse postale complète de l’associé. */
  adresse: string;
  /** Adresse e-mail de contact de l’associé (peut être absente). */
  email: string | null;
  /** Numéro de téléphone de l’associé (peut être absent). */
  telephone: string | null;
  /** Nombre d’actions détenues par l’associé (peut être absent). */
  nombre_actions: number | null;
  /** Montant de l’apport réalisé par l’associé (peut être absent). */
  montant_apport: number | null;
  /** Type d’apport réalisé (numéraire, nature, etc.). */
  type_apport: string | null;
  /** Indique si l’associé est président (true/false, peut être absent). */
  president: boolean | null;
  /** Indique si l’associé est directeur général (true/false, peut être absent). */
  directeur_general: boolean | null;
  /** Date de création de l’enregistrement (format ISO 8601). */
  created_at: string;
  /** Date de dernière mise à jour de l’enregistrement (format ISO 8601). */
  updated_at: string;
};

/**
 * Représente une pièce jointe stockée dans la table `pieces_jointes` de Supabase.
 */
export type PieceJointe = {
  /** Identifiant unique de la pièce jointe (UUID). */
  id: string;
  /** Identifiant du client auquel la pièce jointe est associée. */
  client_id: string;
  /** Nom original du fichier. */
  nom_fichier: string;
  /** Type MIME du fichier. */
  type_fichier: string;
  /** Taille du fichier en octets. */
  taille_fichier: number;
  /** URL signée ou publique permettant d’accéder au fichier. */
  url_fichier: string;
  /** Date de dépôt de la pièce jointe (format ISO 8601). */
  uploaded_at: string;
};


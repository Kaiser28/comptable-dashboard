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


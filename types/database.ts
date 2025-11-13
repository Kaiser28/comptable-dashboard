/**
 * Représente un cabinet tel qu'enregistré dans la table `cabinets` de Supabase.
 */
export type Cabinet = {
  /** Identifiant unique généré par Supabase (UUID). */
  id?: string;
  /** Nom commercial ou raison sociale du cabinet. */
  nom: string;
  /** Adresse e-mail principale du cabinet. */
  email: string;
  /** Numéro de téléphone du cabinet (peut être absent). */
  telephone?: string;
  /** Adresse postale complète du cabinet (peut être absente). */
  adresse?: string;
  /** Date de création de l'enregistrement (format ISO 8601). */
  created_at: string;
  /** Date de dernière mise à jour de l'enregistrement (format ISO 8601). */
  updated_at: string;
};

/**
 * Représente un client rattaché à un cabinet dans la table `clients` de Supabase.
 */
export type Client = {
  /** Identifiant unique du client (UUID). */
  id?: string;
  /** Identifiant du cabinet associé au client. */
  cabinet_id?: string;
  /** Nom commercial ou raison sociale de l'entreprise cliente. */
  nom_entreprise: string;
  /** Forme juridique de l'entreprise (peut être absente). */
  forme_juridique: string;
  /** Montant du capital social déclaré (peut être absent). */
  capital_social: number;
  /** Adresse e-mail de contact du client (peut être absente). */
  email?: string;
  /** Numéro de téléphone du client (peut être absente). */
  telephone?: string;
  /** Adresse postale du client (peut être absente). */
  adresse?: string;
  /** Numéro SIRET de l'entreprise (peut être absente). */
  siret?: string;
  /** Statut actuel du client dans le parcours (ex: actif, en attente). */
  statut?: string;
  /** Token unique pour accéder au formulaire de collecte d'informations. */
  formulaire_token?: string;
  /** Indique si le formulaire a été complété par le client. */
  formulaire_complete?: boolean;
  /** Date de création de l'enregistrement (format ISO 8601). */
  created_at: string;
  /** Date de dernière mise à jour de l'enregistrement (format ISO 8601). */
  updated_at: string;
  /** Durée de la société en années. */
  duree_societe: number;
  /** Date de clôture de l'exercice (format libre, ex: "31/12"). */
  date_cloture?: string;
  /** Objet social de l'entreprise. */
  objet_social: string;
  /** Nombre d'actions. */
  nb_actions: number;
  /** Montant libéré du capital. */
  montant_libere: number;
  /** Date de début d'activité (format ISO 8601). */
  date_debut_activite?: string;
  /** Code APE/NAF. */
  code_ape?: string;
  /** Indique si l'activité est réglementée. */
  activite_reglementee?: boolean;
  /** Détails sur l'activité réglementée. */
  activite_reglementee_details?: string;
  /** Type de siège. */
  type_siege?: string;
  /** Adresse du siège social (JSON). */
  adresse_siege?: any;
  /** Nom de l'expert-comptable. */
  expert_comptable_nom?: string;
  /** Email de l'expert-comptable. */
  expert_comptable_email?: string;
  /** Banque de dépôt du capital. */
  banque_depot_capital?: string;
  /** Indique si le compte professionnel est ouvert. */
  compte_pro_ouvert?: boolean;
  /** Type de dossier. */
  type_dossier?: 'création' | 'reprise' | 'existant';
  /** Nom du cabinet cédant (peut être absent). */
  cabinet_cedant_nom?: string | null;
  /** Adresse du cabinet cédant (peut être absente). */
  cabinet_cedant_adresse?: string | null;
  /** Date de reprise (format ISO YYYY-MM-DD, peut être absente). */
  date_reprise?: string | null;
  /** Objectif de la mission (peut être absent). */
  mission_objectif?: string | null;
  /** Honoraires de la mission (peut être absent). */
  mission_honoraires?: string | null;
  /** Périodicité de la mission (peut être absente). */
  mission_periodicite?: string | null;
};

/**
 * Représente un associé lié à un client dans la table `associes` de Supabase.
 */
export type Associe = {
  /** Identifiant unique de l'associé (UUID). */
  id?: string;
  /** Identifiant du client auquel l'associé est rattaché. */
  client_id?: string;
  /** Civilité de l'associé (ex. M., Mme). */
  civilite: string;
  /** Nom de famille de l'associé. */
  nom: string;
  /** Prénom de l'associé. */
  prenom: string;
  /** Date de naissance de l'associé (format ISO 8601). */
  date_naissance: string;
  /** Lieu de naissance de l'associé. */
  lieu_naissance: string;
  /** Nationalité de l'associé. */
  nationalite: string;
  /** Adresse postale complète de l'associé (JSON). */
  adresse?: any;
  /** Adresse e-mail de contact de l'associé (peut être absente). */
  email?: string;
  /** Numéro de téléphone de l'associé (peut être absent). */
  telephone?: string;
  /** Nombre d'actions détenues par l'associé (peut être absent). */
  nombre_actions?: number;
  /** Montant de l'apport réalisé par l'associé (peut être absent). */
  montant_apport?: number;
  /** Type d'apport réalisé (numéraire, nature, etc.). */
  type_apport?: string;
  /** Indique si l'associé est président (true/false, peut être absent). */
  president?: boolean;
  /** Indique si l'associé est directeur général (true/false, peut être absent). */
  directeur_general?: boolean;
  /** Date de création de l'enregistrement (format ISO 8601). */
  created_at: string;
  /** Date de dernière mise à jour de l'enregistrement (format ISO 8601). */
  updated_at: string;
  /** Profession de l'associé. */
  profession?: string;
  /** Numéro de CNI. */
  numero_cni?: string;
  /** Situation matrimoniale. */
  situation_matrimoniale?: string;
  /** Pourcentage du capital détenu. */
  pourcentage_capital?: number;
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
  /** URL signée ou publique permettant d'accéder au fichier. */
  url_fichier: string;
  /** Date de dépôt de la pièce jointe (format ISO 8601). */
  uploaded_at: string;
};

/**
 * Représente un expert-comptable rattaché à un cabinet dans la table `experts_comptables` de Supabase.
 */
export type ExpertComptable = {
  /** Identifiant unique de l'expert-comptable (UUID). */
  id: string;
  /** Identifiant du cabinet auquel l'expert-comptable est rattaché. */
  cabinet_id: string;
  /** Identifiant de l'utilisateur Supabase Auth associé. */
  user_id: string;
  /** Adresse e-mail de l'expert-comptable. */
  email: string;
  /** Nom de famille de l'expert-comptable (peut être absent). */
  nom: string | null;
  /** Prénom de l'expert-comptable (peut être absent). */
  prenom: string | null;
  /** Numéro de téléphone de l'expert-comptable (peut être absent). */
  telephone: string | null;
  /** Rôle de l'expert-comptable dans le système ('admin' ou 'expert'). */
  role: "admin" | "expert";
  /** Indique si l'expert-comptable est actif dans le système. */
  actif: boolean;
  /** Date de création de l'enregistrement (format ISO 8601). */
  created_at: string;
  /** Date de dernière mise à jour de l'enregistrement (format ISO 8601). */
  updated_at: string;
};

/**
 * Schémas de validation Zod pour toutes les routes API
 * Assure la validation stricte des données avant traitement
 */

import { z } from 'zod';

// ============================================================================
// SCHÉMAS CLIENTS
// ============================================================================

export const clientCreateSchema = z.object({
  nom_entreprise: z.string().min(1).max(255),
  forme_juridique: z.string().min(1),
  capital_social: z.number().min(0),
  nb_actions: z.number().int().min(1),
  email: z.string().email().optional().nullable(),
  telephone: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  objet_social: z.string().min(1),
  duree_societe: z.number().int().min(1).max(99),
  montant_libere: z.number().min(0),
  date_cloture: z.string().optional().nullable(),
  date_debut_activite: z.string().optional().nullable(),
  code_ape: z.string().optional().nullable(),
  activite_reglementee: z.boolean().optional(),
  activite_reglementee_details: z.string().optional().nullable(),
  type_siege: z.string().optional().nullable(),
  expert_comptable_nom: z.string().optional().nullable(),
  expert_comptable_email: z.string().email().optional().nullable(),
  banque_depot_capital: z.string().optional().nullable(),
  compte_pro_ouvert: z.boolean().optional(),
  type_dossier: z.enum(['création', 'reprise', 'existant']).optional(),
  cabinet_cedant_nom: z.string().optional().nullable(),
  cabinet_cedant_adresse: z.string().optional().nullable(),
  date_reprise: z.string().optional().nullable(),
  mission_objectif: z.string().optional().nullable(),
  mission_honoraires: z.string().optional().nullable(),
  mission_periodicite: z.string().optional().nullable(),
  president_nom: z.string().optional().nullable(),
  president_prenom: z.string().optional().nullable(),
  president_civilite: z.string().optional().nullable(),
});

export const clientUpdateSchema = clientCreateSchema.partial();

// ============================================================================
// SCHÉMAS ASSOCIÉS
// ============================================================================

export const associeCreateSchema = z.object({
  civilite: z.enum(['M.', 'Mme']).optional().nullable(),
  nom: z.string().min(1).max(255),
  prenom: z.string().min(1).max(255),
  date_naissance: z.string().optional().nullable(),
  lieu_naissance: z.string().optional().nullable(),
  Nationalite: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telephone: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  nombre_actions: z.number().int().min(1),
  type_apport: z.enum(['numeraire', 'nature']).default('numeraire'),
  president: z.boolean().default(false),
});

export const associeUpdateSchema = associeCreateSchema.partial().extend({
  nombre_actions: z.number().int().min(1).optional(),
});

// ============================================================================
// SCHÉMAS ACTES JURIDIQUES
// ============================================================================

const baseActeSchema = z.object({
  client_id: z.string().uuid(),
  type: z.enum([
    'augmentation_capital',
    'reduction_capital',
    'ag_ordinaire',
    'cession_actions',
    'ordre_mouvement_titres',
  ]),
  date_acte: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  statut: z.enum(['brouillon', 'finalise', 'archive']).default('brouillon'),
  quorum: z.number().int().min(0).max(100).optional(),
});

// Augmentation capital
export const augmentationCapitalSchema = baseActeSchema.extend({
  type: z.literal('augmentation_capital'),
  ancien_capital: z.number().min(0),
  montant_augmentation: z.number().min(0),
  nouveau_capital: z.number().min(0),
  modalite: z.enum(['numeraire', 'nature', 'reserves']),
  nombre_nouvelles_actions: z.number().int().min(1).optional(),
  apport_nature: z.boolean().optional(),
  apport_nature_description: z.string().optional().nullable(),
  apport_nature_montant_total: z.number().optional().nullable(),
  apport_nature_pourcentage_capital: z.number().optional().nullable(),
  apport_nature_modalite: z.string().optional().nullable(),
  commissaire_apports_requis: z.boolean().optional(),
  commissaire_apports_nom: z.string().optional().nullable(),
  commissaire_apports_adresse: z.string().optional().nullable(),
  commissaire_obligatoire: z.boolean().optional(),
  commissaire_nom: z.string().optional().nullable(),
  bien_superieur_30k: z.boolean().optional(),
  votes_pour: z.number().int().min(0).optional(),
  votes_contre: z.number().int().min(0).optional(),
});

// Réduction capital
export const reductionCapitalSchema = baseActeSchema.extend({
  type: z.literal('reduction_capital'),
  ancien_capital: z.number().min(0),
  capital_actuel: z.number().min(0),
  montant_reduction: z.number().min(0),
  nouveau_capital_apres_reduction: z.number().min(1), // Minimum 1€ légal
  modalite_reduction: z.enum(['rachat_annulation', 'reduction_valeur_nominale', 'coup_accordeon']),
  motif_reduction: z.string().optional().nullable(),
  reduction_motivee_pertes: z.boolean().default(false),
  nombre_actions: z.number().int().min(1).optional(),
  nombre_actions_rachetees: z.number().int().min(0).optional(),
  prix_rachat_par_action: z.number().min(0).optional(),
  ancienne_valeur_nominale: z.number().min(0).optional(),
  nouvelle_valeur_nominale: z.number().min(0).optional(),
  valeur_nominale_actuelle: z.number().min(0).optional(),
  coup_accordeon_augmentation_montant: z.number().min(0).optional(),
  coup_accordeon_nouveau_capital_final: z.number().min(0).optional(),
  votes_pour: z.number().int().min(0).optional(),
  votes_contre: z.number().int().min(0).optional(),
});

// AG Ordinaire
export const agOrdinaireSchema = baseActeSchema.extend({
  type: z.literal('ag_ordinaire'),
  date_ag: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercice_clos: z.string().min(1),
  resultat_exercice: z.number(),
  affectation_resultat: z.enum(['dividendes', 'reserves', 'report']),
  montant_dividendes: z.number().min(0).optional(),
  montant_reserves: z.number().min(0).optional(),
  montant_report: z.number().min(0).optional(),
  quitus_president: z.boolean().default(false),
  votes_pour_comptes: z.number().int().min(0).optional(),
  votes_contre_comptes: z.number().int().min(0).optional(),
  votes_abstention_comptes: z.number().int().min(0).optional(),
});

// Union de tous les types d'actes
export const acteJuridiqueSchema = z.discriminatedUnion('type', [
  augmentationCapitalSchema,
  reductionCapitalSchema,
  agOrdinaireSchema,
]);

// ============================================================================
// SCHÉMAS GÉNÉRATION DOCUMENTS
// ============================================================================

export const generateDocumentSchema = z.object({
  acteId: z.string().uuid().optional(),
  acte_id: z.string().uuid().optional(),
}).refine(
  (data) => data.acteId || data.acte_id,
  { message: 'acteId ou acte_id requis' }
);

// ============================================================================
// HELPERS DE VALIDATION
// ============================================================================

/**
 * Valide les données avec un schéma Zod
 * Retourne les données validées ou lance une erreur
 */
export function validateWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Valide les données avec safeParse (ne lance pas d'erreur)
 * Retourne un objet { success: boolean, data?: T, error?: ZodError }
 */
export function safeValidateWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}


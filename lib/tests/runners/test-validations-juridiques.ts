/**
 * Runner pour tester les validations juridiques
 * 
 * Ce fichier contient les tests de validation des règles juridiques
 * pour différents types d'actes.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface ValidationTest {
  name: string;
  description: string;
  test: () => Promise<'success' | 'error'>;
}

/**
 * Teste que le capital final ne peut pas être inférieur à 1€
 */
export async function testCapitalFinalMinimum(
  clientId: string,
  cabinetId: string
): Promise<'success' | 'error'> {
  const { error } = await supabase
    .from('actes_juridiques')
    .insert({
      client_id: clientId,
      cabinet_id: cabinetId,
      type: 'reduction_capital',
      ancien_capital: 10,
      montant_reduction: 10,
      nouveau_capital_apres_reduction: 0, // INVALIDE - doit être >= 1
      modalite_reduction: 'rachat_annulation',
      date_acte: new Date().toISOString().split('T')[0],
      statut: 'brouillon'
    });

  // On VEUT une erreur (validation qui bloque)
  return error ? 'success' : 'error';
}

/**
 * Teste que le montant de réduction ne peut pas dépasser le capital actuel
 */
export async function testMontantReductionMax(
  clientId: string,
  cabinetId: string
): Promise<'success' | 'error'> {
  const { error } = await supabase
    .from('actes_juridiques')
    .insert({
      client_id: clientId,
      cabinet_id: cabinetId,
      type: 'reduction_capital',
      ancien_capital: 10000,
      montant_reduction: 15000, // INVALIDE - dépasse le capital
      nouveau_capital_apres_reduction: -5000,
      modalite_reduction: 'rachat_annulation',
      date_acte: new Date().toISOString().split('T')[0],
      statut: 'brouillon'
    });

  // On VEUT une erreur (validation qui bloque)
  return error ? 'success' : 'error';
}

/**
 * Liste tous les tests de validation disponibles
 */
export function getValidationTests(
  clientId: string,
  cabinetId: string
): ValidationTest[] {
  return [
    {
      name: 'Capital final ≥ 1€',
      description: 'Vérifie que le capital ne peut pas descendre en dessous de 1€',
      test: () => testCapitalFinalMinimum(clientId, cabinetId)
    },
    {
      name: 'Montant réduction ≤ Capital actuel',
      description: 'Vérifie que le montant de réduction ne peut pas dépasser le capital',
      test: () => testMontantReductionMax(clientId, cabinetId)
    }
  ];
}


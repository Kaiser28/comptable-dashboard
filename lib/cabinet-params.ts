/**
 * Helper pour récupérer les paramètres du cabinet (ACPM mono-tenant)
 * Les paramètres sont stockés dans la table parametres
 */

import { createClient } from '@/lib/supabase/server';
import type { Cabinet } from '@/types/database';

/**
 * Récupère les informations du cabinet depuis parametres
 * @returns Informations du cabinet ou valeurs par défaut ACPM
 */
export async function getCabinetInfo(): Promise<Cabinet> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('parametres')
      .select('valeur')
      .eq('cle', 'cabinet_info')
      .maybeSingle();

    if (error) {
      console.error('[CABINET PARAMS] Erreur récupération:', error);
    }

    if (!data || !data.valeur) {
      console.warn('[CABINET PARAMS] Paramètres cabinet non configurés, utilisation valeurs ACPM');
      // Retourner valeurs par défaut ACPM
      return {
        nom: 'ACPM Expertise Comptable',
        email: 'contact@acpm-expertise.com',
        telephone: '',
        adresse: 'MÉRÉ, Yvelines (78)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Fusionner avec les valeurs par défaut pour garantir tous les champs obligatoires
    return {
      nom: 'ACPM Expertise Comptable',
      email: 'contact@acpm-expertise.com',
      telephone: '',
      adresse: 'MÉRÉ, Yvelines (78)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data.valeur,
    } as Cabinet;
  } catch (error) {
    console.error('[CABINET PARAMS] Exception:', error);
    // Retourner valeurs par défaut en cas d'erreur
    return {
      nom: 'ACPM Expertise Comptable',
      email: 'contact@acpm-expertise.com',
      telephone: '',
      adresse: 'MÉRÉ, Yvelines (78)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

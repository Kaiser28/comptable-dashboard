/**
 * Runner pour tester la création d'actes juridiques
 * 
 * Ce fichier contient les fonctions utilitaires pour tester
 * la création de différents types d'actes.
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

export interface ActeTestConfig {
  type: string;
  label: string;
  data: Record<string, any>;
}

export async function testCreateActe(
  config: ActeTestConfig,
  clientId: string,
  cabinetId: string
): Promise<{ success: boolean; acteId?: string; error?: string }> {
  try {
    const { data: acte, error } = await supabase
      .from('actes_juridiques')
      .insert({
        ...config.data,
        client_id: clientId,
        cabinet_id: cabinetId
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, acteId: acte.id };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}


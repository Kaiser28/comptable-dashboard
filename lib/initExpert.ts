/**
 * Fichier désactivé pour ACPM mono-tenant
 * L'initialisation des experts n'est plus nécessaire
 * Les utilisateurs sont gérés directement dans la table users
 */

/**
 * @deprecated Cette fonction n'est plus utilisée dans ACPM mono-tenant
 */
export async function initExpertComptable(
  userId: string,
  cabinetId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  console.warn('[DEPRECATED] initExpertComptable est désactivé pour ACPM mono-tenant');
  return { success: true };
}

/**
 * @deprecated Cette fonction n'est plus utilisée dans ACPM mono-tenant
 */
export async function getCabinetIdByUserId(
  userId: string
): Promise<string | null> {
  console.warn('[DEPRECATED] getCabinetIdByUserId est désactivé pour ACPM mono-tenant');
  return null;
}

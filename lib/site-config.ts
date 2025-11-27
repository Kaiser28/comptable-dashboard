/**
 * Configuration des URLs de base selon l'environnement
 * 
 * Détecte automatiquement quelle URL utiliser :
 * - Production : NEXT_PUBLIC_SITE_URL
 * - Preview/Development : NEXT_PUBLIC_SITE_URL_TEST
 * 
 * La détection se fait sur l'existence de la variable d'environnement.
 */

/**
 * Récupère l'URL de base du site selon l'environnement
 * 
 * @returns L'URL de base du site (sans slash final)
 * @throws Error si aucune URL n'est trouvée
 */
export function getSiteUrl(): string {
  // En production, NEXT_PUBLIC_SITE_URL est définie
  const productionUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // En preview/development, NEXT_PUBLIC_SITE_URL_TEST est définie
  const testUrl = process.env.NEXT_PUBLIC_SITE_URL_TEST;

  // Priorité : production si disponible, sinon test
  if (productionUrl && productionUrl.trim() !== '') {
    const url = productionUrl.trim().replace(/\/$/, ''); // Retirer le slash final
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SITE CONFIG] Utilisation de l\'URL PRODUCTION:', url);
    }
    return url;
  }

  if (testUrl && testUrl.trim() !== '') {
    const url = testUrl.trim().replace(/\/$/, ''); // Retirer le slash final
    console.log('[SITE CONFIG] Utilisation de l\'URL TEST/PREVIEW:', url);
    return url;
  }

  // Aucune URL trouvée
  const error = new Error(
    '[SITE CONFIG] Aucune URL de base trouvée. ' +
    'Vérifiez que NEXT_PUBLIC_SITE_URL ou NEXT_PUBLIC_SITE_URL_TEST est définie.'
  );
  console.error(error.message);
  throw error;
}

/**
 * Alias de getSiteUrl() pour rétrocompatibilité
 * 
 * @returns L'URL de base du site (sans slash final)
 * @throws Error si aucune URL n'est trouvée
 */
export function getBaseUrl(): string {
  return getSiteUrl();
}


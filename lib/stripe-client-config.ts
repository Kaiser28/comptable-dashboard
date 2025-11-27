/**
 * Configuration Stripe côté client (navigateur uniquement)
 * 
 * Détecte automatiquement quelle clé publique Stripe utiliser :
 * - Production : NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live)
 * - Preview/Development : NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_test (pk_test)
 * 
 * La détection se fait sur l'existence de la variable d'environnement,
 * pas sur process.env.NODE_ENV ou VERCEL_ENV (non disponibles côté client).
 */

/**
 * Récupère la clé publique Stripe selon l'environnement
 * 
 * @returns La clé publique Stripe (pk_live ou pk_test)
 * @throws Error si aucune clé n'est trouvée
 */
export function getStripePublishableKey(): string {
  // En production, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY est définie
  const productionKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  // En preview/development, seule NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_test est définie
  const testKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_test;

  // Priorité : production si disponible, sinon test
  if (productionKey && productionKey.trim() !== '') {
    console.log('[STRIPE CLIENT] Utilisation de la clé PRODUCTION (pk_live)');
    return productionKey;
  }

  if (testKey && testKey.trim() !== '') {
    console.log('[STRIPE CLIENT] Utilisation de la clé TEST (pk_test)');
    return testKey;
  }

  // Aucune clé trouvée
  const error = new Error(
    '[STRIPE CLIENT] Aucune clé publique Stripe trouvée. ' +
    'Vérifiez que NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ou NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_test est définie.'
  );
  console.error(error.message);
  throw error;
}


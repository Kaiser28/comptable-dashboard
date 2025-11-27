/**
 * Configuration Stripe selon l'environnement
 * 
 * En Production : utilise les clés sans suffixe (STRIPE_SECRET_KEY, etc.)
 * En Preview/Development : utilise les clés avec suffixe _test (STRIPE_SECRET_KEY_test, etc.)
 */

/**
 * Détermine si on est en environnement de production
 */
function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/**
 * Récupère la valeur d'une variable d'environnement selon l'environnement
 * 
 * @param key - Nom de la variable d'environnement (sans suffixe)
 * @param isPublic - Si true, cherche NEXT_PUBLIC_ prefix pour les clés client
 * @returns La valeur de la variable d'environnement
 * @throws Error si la variable est manquante
 */
function getEnvKey(key: string, isPublic: boolean = false): string {
  const prefix = isPublic ? 'NEXT_PUBLIC_' : '';
  const suffix = isProduction() ? '' : '_test';
  const envKey = `${prefix}${key}${suffix}`;
  
  const value = process.env[envKey];
  
  if (!value) {
    const envName = isProduction() ? 'production' : 'preview/development';
    throw new Error(
      `[STRIPE CONFIG] Variable d'environnement manquante: ${envKey} (environnement: ${envName})`
    );
  }
  
  return value;
}

/**
 * Configuration Stripe avec les bonnes clés selon l'environnement
 */
export interface StripeConfig {
  /** Clé secrète Stripe (serveur uniquement) */
  stripeSecretKey: string;
  /** Secret du webhook Stripe */
  stripeWebhookSecret: string;
  /** Clé publique Stripe (client) */
  stripePublishableKey: string;
  /** ID du prix Stripe */
  stripePriceId: string;
}

/**
 * Récupère la configuration Stripe selon l'environnement
 * 
 * @returns Configuration Stripe avec les bonnes clés
 * @throws Error si une clé est manquante
 */
export function getStripeConfig(): StripeConfig {
  const isProd = isProduction();
  const envName = isProd ? 'production' : 'preview/development';
  
  console.log(`[STRIPE CONFIG] Chargement configuration pour environnement: ${envName}`);
  
  try {
    const config: StripeConfig = {
      stripeSecretKey: getEnvKey('STRIPE_SECRET_KEY', false),
      stripeWebhookSecret: getEnvKey('STRIPE_WEBHOOK_SECRET', false),
      stripePublishableKey: getEnvKey('STRIPE_PUBLISHABLE_KEY', true),
      stripePriceId: getEnvKey('STRIPE_PRICE_ID', false),
    };
    
    console.log(`[STRIPE CONFIG] Configuration chargée avec succès (${envName})`);
    return config;
    
  } catch (error: any) {
    console.error('[STRIPE CONFIG] Erreur lors du chargement de la configuration:', error.message);
    throw error;
  }
}

/**
 * Récupère la clé secrète Stripe selon l'environnement
 * @throws Error si la clé est manquante
 */
export function getStripeSecretKey(): string {
  return getStripeConfig().stripeSecretKey;
}

/**
 * Récupère le secret du webhook Stripe selon l'environnement
 * @throws Error si la clé est manquante
 */
export function getStripeWebhookSecret(): string {
  return getStripeConfig().stripeWebhookSecret;
}

/**
 * Récupère la clé publique Stripe selon l'environnement
 * @throws Error si la clé est manquante
 */
export function getStripePublishableKey(): string {
  return getStripeConfig().stripePublishableKey;
}

/**
 * Récupère l'ID du prix Stripe selon l'environnement
 * @throws Error si la clé est manquante
 */
export function getStripePriceId(): string {
  return getStripeConfig().stripePriceId;
}


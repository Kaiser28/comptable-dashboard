import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import { getStripePublishableKey } from './stripe-client-config';

// Instance Stripe serveur (API routes uniquement)
// NOTE: Cette instance ne devrait plus être utilisée directement dans les routes API
// Utiliser lib/stripe-config.ts à la place pour la gestion automatique des clés selon l'environnement
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

// Instance Stripe client (composants React)
// Utilise automatiquement la bonne clé selon l'environnement (production ou test)
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    try {
      const publishableKey = getStripePublishableKey();
      stripePromise = loadStripe(publishableKey);
    } catch (error: any) {
      console.error('[STRIPE CLIENT] Erreur lors du chargement de Stripe:', error.message);
      throw error;
    }
  }
  return stripePromise;
};


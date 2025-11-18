/**
 * Validation des variables d'environnement au démarrage
 * Assure que toutes les variables requises sont présentes et valides
 */

import { z } from 'zod';

const envSchema = z.object({
  // Variables publiques (accessibles côté client)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Variables serveur uniquement (NE JAMAIS exposer côté client)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Variables optionnelles pour le bot d'audit
  EXPERT_EMAIL: z.string().email().optional(),
  EXPERT_PASSWORD: z.string().min(1).optional(),
  BOT_SECRET_TOKEN: z.string().min(32).optional(),
});

// Valider et parser les variables d'environnement
export const env = envSchema.parse(process.env);

// Export des variables pour utilisation dans l'application
export const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  EXPERT_EMAIL,
  EXPERT_PASSWORD,
  BOT_SECRET_TOKEN,
} = env;


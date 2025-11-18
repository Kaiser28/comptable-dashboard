/**
 * Middleware de rate limiting pour les routes API
 * Protège contre les abus et attaques par déni de service
 */

import { rateLimit } from './ratelimit';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiter global (1 minute d'intervalle, 500 tokens max)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

/**
 * Vérifie le rate limit pour une requête
 * @param req Requête (Request ou NextRequest)
 * @param limit Nombre max de requêtes par minute (défaut: 20)
 * @returns null si OK, NextResponse avec erreur 429 si limit dépassé
 */
export async function withRateLimit(
  req: Request | NextRequest,
  limit: number = 20
): Promise<NextResponse | null> {
  // Vérifier si c'est le bot d'audit (bypass rate limit)
  const botToken = req.headers.get('X-Bot-Token');
  if (botToken && botToken === process.env.BOT_SECRET_TOKEN) {
    return null; // Pas de rate limit pour le bot
  }

  // Extraire l'IP de la requête (compatible Request et NextRequest)
  const ip = ('ip' in req && req.ip)
    ? req.ip
    : req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'anonymous';

  try {
    await limiter.check(limit, ip);
    return null; // Pas de rate limit, continuer
  } catch {
    // Rate limit dépassé
    return NextResponse.json(
      { 
        error: 'Trop de requêtes. Réessayez dans 1 minute.',
        retryAfter: 60 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }
}

/**
 * Rate limits spécifiques par type de route
 */
export const RATE_LIMITS = {
  DOCUMENT_GENERATION: 10, // 10 req/min pour génération documents
  ACTE_CREATION: 20, // 20 req/min pour création actes
  ASSOCIE_OPERATIONS: 30, // 30 req/min pour opérations associés
  CLIENT_OPERATIONS: 20, // 20 req/min pour opérations clients
  DEFAULT: 20, // 20 req/min par défaut
} as const;


/**
 * Middleware de rate limiting pour les routes API
 * Protège contre les abus et attaques par déni de service
 */

import { rateLimit } from './ratelimit';
import { NextRequest, NextResponse } from 'next/server';
import { Response } from 'next/server';

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
export async function checkRateLimit(
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

  // Extraire le pathname pour isoler les limites par route
  let pathname = 'unknown';
  try {
    if ('nextUrl' in req && req.nextUrl) {
      pathname = req.nextUrl.pathname;
    } else if ('url' in req) {
      const url = new URL(req.url);
      pathname = url.pathname;
    }
  } catch {
    // Ignorer les erreurs de parsing URL
  }

  // Clé de rate limiting : IP + route pour isoler les limites par route
  const rateLimitKey = `${ip}:${pathname}`;

  try {
    await limiter.check(limit, rateLimitKey);
    return null; // Pas de rate limit, continuer
  } catch (error) {
    // Rate limit dépassé
    console.log(`[RATE LIMIT] 429 pour ${rateLimitKey} (limite: ${limit}/min)`);
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
 * Wrapper pour appliquer le rate limiting à une route Next.js
 * Crée un nouveau rate limiter avec les options spécifiées
 * @param handler Fonction handler de la route
 * @param options Options de rate limiting
 */
export function withRateLimit<T extends any[]>(
  handler: (request: Request, ...args: T) => Promise<Response>,
  options: { limit: number; window: number }
) {
  const limiter = rateLimit({
    interval: options.window * 1000, // Convertir secondes en ms
    uniqueTokenPerInterval: 500,
  });

  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      // Récupérer l'IP depuis les headers
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
      
      // Générer un token unique par IP + route
      const url = new URL(request.url);
      const token = `${ip}:${url.pathname}`;
      
      console.log(`[RATE LIMIT CHECK] Token: ${token}, Limite: ${options.limit}/${options.window}s`);
      
      // Vérifier le rate limit
      await limiter.check(options.limit, token);
      
      // Si pas bloqué, exécuter le handler
      return await handler(request, ...args);
    } catch (error) {
      // Rate limit dépassé
      if (error instanceof Error && error.message === 'Rate limit exceeded') {
        return new Response(
          JSON.stringify({
            error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Autre erreur (propager)
      throw error;
    }
  };
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


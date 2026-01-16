/**
 * Rate limiting avec Upstash Redis pour Next.js 14
 * Référence : https://upstash.com/docs/oss/sdks/ts/ratelimit
 * 
 * Système professionnel de rate limiting suivant les recommandations OWASP
 * pour protéger les API routes contre les abus et attaques par déni de service.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// ============================================================================
// VÉRIFICATION VARIABLES D'ENVIRONNEMENT
// ============================================================================

// Note: Les variables Upstash sont optionnelles au build time
// La vérification se fait au runtime lors du premier appel aux limiters
const UPSTASH_ENABLED = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

if (!UPSTASH_ENABLED) {
  console.warn(
    "⚠️ Variables Upstash manquantes : Le rate limiting est DÉSACTIVÉ. " +
    "Ajoutez UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN pour l'activer."
  );
}

// ============================================================================
// INSTANCE REDIS (LAZY INITIALIZATION)
// ============================================================================

/**
 * Instance Redis Upstash (initialisée de manière lazy au runtime uniquement)
 * Utilise Redis.fromEnv() qui lit automatiquement :
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */
let redisInstance: Redis | null = null;

/**
 * Obtient l'instance Redis (créée au premier appel, au runtime uniquement)
 * Si Upstash n'est pas configuré, retourne null
 */
function getRedis(): Redis | null {
  if (!UPSTASH_ENABLED) {
    return null;
  }
  if (!redisInstance) {
    redisInstance = Redis.fromEnv();
  }
  return redisInstance;
}

// ============================================================================
// RATE LIMITERS (LAZY INITIALIZATION)
// ============================================================================

/**
 * Rate limiter STRICT - Pour mutations sensibles
 * - 20 requêtes par fenêtre de 1 minute
 * - Utilisé pour : création/modification d'associés, génération documents
 * - Algorithme : slidingWindow (plus précis, évite les pics)
 * - Créé de manière lazy au premier appel
 * - Retourne null si Upstash n'est pas configuré
 */
let strictLimiterInstance: Ratelimit | null = null;
function getStrictLimiter(): Ratelimit | null {
  if (!UPSTASH_ENABLED) return null;
  if (!strictLimiterInstance) {
    const redis = getRedis();
    if (!redis) return null;
    strictLimiterInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/strict",
    });
  }
  return strictLimiterInstance;
}

/**
 * Rate limiter MODERATE - Pour lectures authentifiées
 * - 100 requêtes par fenêtre de 1 minute
 * - Utilisé pour : consultation clients, listes
 * - Algorithme : slidingWindow (cohérence avec strict)
 * - Créé de manière lazy au premier appel
 * - Retourne null si Upstash n'est pas configuré
 */
let moderateLimiterInstance: Ratelimit | null = null;
function getModerateLimiter(): Ratelimit | null {
  if (!UPSTASH_ENABLED) return null;
  if (!moderateLimiterInstance) {
    const redis = getRedis();
    if (!redis) return null;
    moderateLimiterInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/moderate",
    });
  }
  return moderateLimiterInstance;
}

/**
 * Rate limiter GENEROUS - Pour endpoints publics
 * - 300 requêtes par fenêtre de 1 minute
 * - Utilisé pour : formulaires clients, pages publiques
 * - Algorithme : fixedWindow (plus rapide, acceptable pour contenu public)
 * - Créé de manière lazy au premier appel
 * - Retourne null si Upstash n'est pas configuré
 */
let generousLimiterInstance: Ratelimit | null = null;
function getGenerousLimiter(): Ratelimit | null {
  if (!UPSTASH_ENABLED) return null;
  if (!generousLimiterInstance) {
    const redis = getRedis();
    if (!redis) return null;
    generousLimiterInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(300, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/generous",
    });
  }
  return generousLimiterInstance;
}

// Exports pour compatibilité (lazy getters via Proxy - initialisation au runtime uniquement)
// Les Proxy délèguent tous les appels aux getters, évitant l'initialisation au build time
const createLazyLimiter = (getter: () => Ratelimit): Ratelimit => {
  return new Proxy({} as Ratelimit, {
    get(_target, prop) {
      const limiter = getter();
      const value = (limiter as any)[prop];
      return typeof value === 'function' ? value.bind(limiter) : value;
    },
  });
};

export const strictLimiter = createLazyLimiter(getStrictLimiter);
export const moderateLimiter = createLazyLimiter(getModerateLimiter);
export const generousLimiter = createLazyLimiter(getGenerousLimiter);

// ============================================================================
// HELPER : EXTRACTION CLÉ DE RATE LIMITING
// ============================================================================

/**
 * Extrait une clé unique pour le rate limiting basée sur l'IP et le pathname
 * Format : `${ip}:${pathname}`
 * 
 * @param request Requête HTTP (Request ou NextRequest)
 * @returns Clé unique pour le rate limiting (ex: "192.168.1.1:/api/clients/123/associes")
 * 
 * @example
 * const key = getRateLimitKey(request);
 * // "192.168.1.1:/api/clients/123/associes"
 */
export function getRateLimitKey(request: Request): string {
  // Extraire l'IP depuis les headers (compatible Vercel et autres proxies)
  let ip: string = "anonymous";
  
  try {
    // Vercel utilise x-forwarded-for (première IP de la chaîne)
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      ip = forwardedFor.split(",")[0]?.trim() || "anonymous";
    } else {
      // Fallback sur x-real-ip (nginx, autres proxies)
      const realIp = request.headers.get("x-real-ip");
      if (realIp) {
        ip = realIp.trim();
      }
    }
  } catch (error) {
    console.warn("[RATE LIMIT] Erreur extraction IP, utilisation 'anonymous':", error);
  }

  // Extraire le pathname depuis l'URL
  let pathname: string = "unknown";
  try {
    const url = new URL(request.url);
    pathname = url.pathname;
  } catch (error) {
    console.warn("[RATE LIMIT] Erreur parsing URL, utilisation 'unknown':", error);
  }

  return `${ip}:${pathname}`;
}

// ============================================================================
// WRAPPER : APPLICATION RATE LIMITING À UNE ROUTE
// ============================================================================

/**
 * Type pour les options du wrapper rate limiting
 */
type RateLimitOptions = {
  limiter: "strict" | "moderate" | "generous";
};

/**
 * Type pour le handler de route Next.js
 */
type RouteHandler<T extends any[]> = (
  request: Request,
  ...args: T
) => Promise<NextResponse>;

/**
 * Wrapper pour appliquer le rate limiting à une route Next.js 14 App Router
 * 
 * Fonctionnement :
 * 1. Extrait la clé (IP + pathname)
 * 2. Vérifie le rate limit avec le limiter spécifié
 * 3. Si bloqué : retourne 429 avec headers X-RateLimit-*
 * 4. Si autorisé : exécute le handler et ajoute les headers à la réponse
 * 
 * @param handler Fonction handler de la route Next.js
 * @param options Options de rate limiting (type de limiter à utiliser)
 * @returns Handler wrappé avec rate limiting appliqué
 * 
 * @example
 * export const POST = withRateLimit(
 *   async (request: Request, { params }: { params: { id: string } }) => {
 *     // ... logique métier
 *     return NextResponse.json({ success: true });
 *   },
 *   { limiter: "strict" }
 * );
 */
export function withRateLimit<T extends any[]>(
  handler: RouteHandler<T>,
  options: RateLimitOptions
): RouteHandler<T> {
  return async (request: Request, ...args: T): Promise<NextResponse> => {
    // Si Upstash n'est pas configuré, exécuter le handler sans rate limiting
    if (!UPSTASH_ENABLED) {
      console.warn("[RATE LIMIT] Upstash non configuré, rate limiting désactivé");
      return handler(request, ...args);
    }

    // Sélectionner le limiter approprié (lazy initialization au runtime)
    const limiter =
      options.limiter === "strict"
        ? getStrictLimiter()
        : options.limiter === "moderate"
        ? getModerateLimiter()
        : getGenerousLimiter();

    // Si le limiter n'a pas pu être créé, exécuter sans rate limiting
    if (!limiter) {
      console.warn("[RATE LIMIT] Limiter non disponible, rate limiting désactivé");
      return handler(request, ...args);
    }

    try {
      // Extraire la clé de rate limiting
      const key = getRateLimitKey(request);
      
      // Extraire IP et pathname pour les logs
      const ip = key.split(":")[0] || "unknown";
      const pathname = key.split(":").slice(1).join(":") || "unknown";

      // Vérifier le rate limit
      const result = await limiter.limit(key);

      // Log pour debugging
      const status = result.success ? "AUTORISÉ" : "BLOQUÉ";
      console.log(
        `[RATE LIMIT] ${ip} → ${pathname} : ${status} (${result.remaining}/${result.limit} restantes)`
      );

      // Préparer les headers X-RateLimit-*
      const rateLimitHeaders = {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      };

      // Si bloqué, retourner erreur 429
      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: `Trop de requêtes. Réessayez dans ${retryAfter} seconde(s).`,
            retryAfter,
          },
          {
            status: 429,
            headers: {
              ...rateLimitHeaders,
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }

      // Si autorisé, exécuter le handler
      const response = await handler(request, ...args);

      // Ajouter les headers X-RateLimit-* à la réponse
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      // Gestion d'erreur : si le rate limiting échoue, autoriser la requête
      // (fail-open pour éviter de bloquer l'application en cas de problème Redis)
      console.error("[RATE LIMIT] Erreur lors de la vérification:", error);
      console.warn("[RATE LIMIT] Mode fail-open : requête autorisée malgré l'erreur");

      // Exécuter le handler même en cas d'erreur
      return handler(request, ...args);
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Tous les exports sont déjà déclarés avec 'export' dans leurs déclarations
 * 
 * Exports disponibles :
 * - strictLimiter : Rate limiter strict (20 req/min)
 * - moderateLimiter : Rate limiter modéré (100 req/min)
 * - generousLimiter : Rate limiter généreux (300 req/min)
 * - withRateLimit : Wrapper pour appliquer le rate limiting
 * - getRateLimitKey : Helper pour extraire la clé de rate limiting
 * 
 * @example
 * import { strictLimiter, withRateLimit } from '@/lib/ratelimit-upstash';
 * 
 * export const POST = withRateLimit(
 *   async (request) => { ... },
 *   { limiter: 'strict' }
 * );
 */


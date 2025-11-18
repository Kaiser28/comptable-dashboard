/**
 * Rate limiting pour protéger les API routes contre les abus
 * Utilise LRU cache pour un rate limiting local (sans Redis)
 */

import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  interval: number; // Durée en ms (ex: 60000 = 1 minute)
  uniqueTokenPerInterval: number; // Nombre max de tokens uniques à tracker
};

/**
 * Crée un rate limiter avec cache LRU
 */
export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000, // TTL en ms
  });

  return {
    /**
     * Vérifie si le token peut faire une requête
     * @param limit Nombre max de requêtes autorisées
     * @param token Identifiant unique (IP, user ID, etc.)
     * @throws Error si rate limit dépassé
     */
    check: (limit: number, token: string): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number) || 0;
        
        if (tokenCount >= limit) {
          reject(new Error('Rate limit exceeded'));
        } else {
          tokenCache.set(token, tokenCount + 1);
          resolve();
        }
      });
    },
    
    /**
     * Réinitialise le compteur pour un token
     */
    reset: (token: string): void => {
      tokenCache.delete(token);
    },
  };
}


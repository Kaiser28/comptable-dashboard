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

  // Map pour gérer les verrous par token (évite les race conditions)
  const locks = new Map<string, Promise<void>>();

  return {
    /**
     * Vérifie si le token peut faire une requête
     * @param limit Nombre max de requêtes autorisées
     * @param token Identifiant unique (IP, user ID, etc.)
     * @throws Error si rate limit dépassé
     */
    check: async (limit: number, token: string): Promise<void> => {
      // Attendre que toutes les requêtes précédentes pour ce token soient terminées
      await locks.get(token);
      
      // Créer une nouvelle promesse pour cette requête
      let resolveLock: () => void;
      const lockPromise = new Promise<void>((resolve) => {
        resolveLock = resolve;
      });
      locks.set(token, lockPromise);

      try {
        // Opération atomique : lire, vérifier, incrémenter
        const currentCount = (tokenCache.get(token) as number) || 0;
        const newCount = currentCount + 1;
        
        if (currentCount >= limit) {
          console.log(`[RATE LIMIT] Bloqué: ${token} (${currentCount}/${limit})`);
          throw new Error('Rate limit exceeded');
        } else {
          tokenCache.set(token, newCount);
          console.log(`[RATE LIMIT] Autorisé: ${token} (${newCount}/${limit})`);
        }
      } finally {
        // Libérer le verrou
        resolveLock!();
        // Nettoyer si c'est la dernière requête
        if (locks.get(token) === lockPromise) {
          locks.delete(token);
        }
      }
    },
    
    /**
     * Réinitialise le compteur pour un token
     */
    reset: (token: string): void => {
      tokenCache.delete(token);
    },
  };
}


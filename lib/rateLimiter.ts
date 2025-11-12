/**
 * Rate limiter pour l'API Pappers
 * Limite le nombre de recherches SIRET par jour par utilisateur
 */

const STORAGE_PREFIX = "pappers_searches_";

/**
 * Vérifie si l'utilisateur peut effectuer une recherche (rate limit)
 * @param userId - ID de l'utilisateur (depuis Supabase auth)
 * @param limit - Nombre maximum de recherches par jour (défaut: 10)
 * @returns true si la limite n'est pas atteinte, false sinon
 */
export function checkRateLimit(userId: string, limit: number = 10): boolean {
  if (typeof window === "undefined") {
    // Côté serveur, pas de localStorage
    return true;
  }

  const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
  const storageKey = `${STORAGE_PREFIX}${userId}_${today}`;

  try {
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      // Première recherche du jour
      localStorage.setItem(storageKey, "1");
      return true;
    }

    const count = parseInt(stored, 10);
    
    if (isNaN(count) || count < 0) {
      // Données corrompues, réinitialiser
      localStorage.setItem(storageKey, "1");
      return true;
    }

    if (count >= limit) {
      // Limite atteinte
      return false;
    }

    // Incrémenter le compteur
    localStorage.setItem(storageKey, String(count + 1));
    return true;
  } catch (error) {
    // En cas d'erreur (localStorage désactivé, quota dépassé, etc.), autoriser quand même
    console.error("Erreur rate limiter:", error);
    return true;
  }
}

/**
 * Récupère le nombre de recherches effectuées aujourd'hui
 * @param userId - ID de l'utilisateur
 * @returns Nombre de recherches effectuées aujourd'hui (0 si aucune)
 */
export function getRateLimitCount(userId: string): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const today = new Date().toISOString().split("T")[0];
  const storageKey = `${STORAGE_PREFIX}${userId}_${today}`;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return 0;
    }

    const count = parseInt(stored, 10);
    return isNaN(count) ? 0 : count;
  } catch (error) {
    console.error("Erreur récupération compteur:", error);
    return 0;
  }
}

/**
 * Réinitialise le compteur pour un utilisateur (utile pour les tests)
 * @param userId - ID de l'utilisateur
 */
export function resetRateLimit(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const storageKey = `${STORAGE_PREFIX}${userId}_${today}`;

  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Erreur réinitialisation rate limit:", error);
  }
}


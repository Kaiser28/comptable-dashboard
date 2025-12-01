/**
 * Sanitization des entrées utilisateur
 * Protège contre les attaques XSS et injection SQL
 */

import validator from 'validator';

console.log('[SANITIZE] Utilisation de validator.js (compatible Vercel)');

/**
 * Nettoie une chaîne de caractères :
 * - Échappe les caractères spéciaux HTML
 * - Trim les espaces
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  
  // Trim d'abord
  const trimmed = input.trim();
  
  // Échapper les caractères HTML avec validator.escape
  return validator.escape(trimmed);
}

/**
 * Nettoie un objet récursivement
 * Applique sanitizeString à toutes les propriétés string
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as any;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Objet imbriqué
      sanitized[key as keyof T] = sanitizeObject(value) as any;
    } else if (Array.isArray(value)) {
      // Tableau : sanitize chaque élément si c'est une string ou un objet
      sanitized[key as keyof T] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item);
        }
        return item;
      }) as any;
    } else {
      // Nombre, boolean, null, etc. → inchangé
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

/**
 * Nettoie un tableau de strings
 */
export function sanitizeStringArray(arr: (string | null | undefined)[]): string[] {
  return arr.map(sanitizeString).filter(Boolean);
}

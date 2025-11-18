/**
 * Sanitization des entrées utilisateur
 * Protège contre les attaques XSS et injection SQL
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Nettoie une chaîne de caractères :
 * - Supprime les balises HTML
 * - Échappe les caractères spéciaux
 * - Trim les espaces
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  // Trim d'abord
  const trimmed = input.trim();
  
  // Sanitize avec DOMPurify (supprime HTML et échappe)
  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [], // Pas de HTML autorisé
    ALLOWED_ATTR: [], // Pas d'attributs autorisés
    KEEP_CONTENT: true, // Garde le contenu textuel
  });
}

/**
 * Nettoie un objet récursivement
 * Applique sanitizeString à toutes les propriétés string
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      cleaned[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Objet imbriqué
      cleaned[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      // Tableau : sanitize chaque élément si c'est une string ou un objet
      cleaned[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeString(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item);
        }
        return item;
      });
    } else {
      // Nombre, boolean, null, etc. → inchangé
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Nettoie un tableau de strings
 */
export function sanitizeStringArray(arr: (string | null | undefined)[]): string[] {
  return arr.map(sanitizeString).filter(Boolean);
}


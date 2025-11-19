/**
 * Validation robuste des fichiers uploadés
 * Utilise file-type pour détecter le vrai MIME type (pas juste l'extension)
 * Protège contre les malwares/virus en validant AVANT stockage
 */

import { fileTypeFromBuffer } from 'file-type';

/**
 * MIME types autorisés pour les pièces jointes
 */
const ALLOWED_MIME_TYPES = [
  'application/pdf', // PDF
  'image/png',       // PNG
  'image/jpeg',      // JPEG/JPG
] as const;

/**
 * Résultat de la validation d'un fichier
 */
export interface FileValidationResult {
  /** Indique si le fichier est valide */
  isValid: boolean;
  /** Message d'erreur si le fichier est invalide */
  error?: string;
  /** MIME type détecté par file-type (peut différer de file.type) */
  detectedType?: string;
}

/**
 * Valide un fichier uploadé AVANT stockage dans Supabase
 * 
 * @param file - Fichier du navigateur (File object)
 * @param maxSizeMB - Taille maximale en MB (défaut: 10)
 * @returns Résultat de la validation avec isValid, error optionnel, et detectedType
 * 
 * @example
 * const result = await validateUploadedFile(file, 10);
 * if (!result.isValid) {
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 */
export async function validateUploadedFile(
  file: File,
  maxSizeMB: number = 10
): Promise<FileValidationResult> {
  try {
    // 1. Validation de la taille
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `Le fichier dépasse la taille maximale de ${maxSizeMB} Mo. Taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)} Mo`,
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: 'Le fichier est vide',
      };
    }

    // 2. Conversion en Buffer pour analyse avec file-type
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Détection du vrai MIME type avec file-type (analyse du contenu, pas de l'extension)
    const type = await fileTypeFromBuffer(buffer);

    // 4. Vérification que le fichier est reconnu
    if (!type) {
      return {
        isValid: false,
        error: 'Type de fichier non reconnu. Formats acceptés: PDF, PNG, JPEG',
      };
    }

    // 5. Vérification que le MIME type détecté est autorisé
    if (!ALLOWED_MIME_TYPES.includes(type.mime as typeof ALLOWED_MIME_TYPES[number])) {
      return {
        isValid: false,
        error: `Type de fichier non autorisé: ${type.mime}. Formats acceptés: PDF, PNG, JPEG`,
        detectedType: type.mime,
      };
    }

    // 6. Validation réussie
    return {
      isValid: true,
      detectedType: type.mime,
    };
  } catch (error) {
    // Gestion des erreurs inattendues (lecture du fichier, etc.)
    console.error('[FILE VALIDATION] Erreur lors de la validation:', error);
    return {
      isValid: false,
      error: error instanceof Error 
        ? `Erreur lors de la validation: ${error.message}`
        : 'Erreur inattendue lors de la validation du fichier',
    };
  }
}


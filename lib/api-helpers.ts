/**
 * Helpers pour les routes API
 * Simplifie l'intégration de validation, sanitization, rate limiting et audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeObject } from './sanitize';
import { withRateLimit, RATE_LIMITS } from './withRateLimit';
import { logCreate, logUpdate, logDelete } from './audit';

/**
 * Wrapper pour route API avec sécurité complète
 * Version adaptée pour Request (compatible avec routes existantes)
 * 
 * @example
 * export async function POST(req: Request) {
 *   return await secureApiRoute(req, {
 *     schema: associeCreateSchema,
 *     rateLimit: RATE_LIMITS.ASSOCIE_OPERATIONS,
 *     handler: async (validatedData) => {
 *       // Votre logique ici avec validatedData déjà validé et sanitizé
 *       return NextResponse.json({ success: true });
 *     },
 *   });
 * }
 */
export async function secureApiRoute<T extends z.ZodTypeAny>(
  req: Request | NextRequest,
  options: {
    schema: T;
    rateLimit?: number;
    handler: (data: z.infer<T>) => Promise<NextResponse>;
  }
): Promise<NextResponse> {
  try {
    // Convertir Request en NextRequest si nécessaire
    const nextReq = req instanceof NextRequest ? req : new NextRequest(req);

    // 1. Rate limiting
    const rateLimitResponse = await withRateLimit(
      nextReq,
      options.rateLimit ?? RATE_LIMITS.DEFAULT
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Parse body
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Corps de la requête invalide' },
        { status: 400 }
      );
    }
    
    if (!body) {
      return NextResponse.json(
        { error: 'Corps de la requête invalide' },
        { status: 400 }
      );
    }

    // 3. Validation Zod avec type guard
    const validation = options.schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 4. Sanitization (TypeScript sait que validation.data existe ici)
    const sanitized = sanitizeObject(validation.data);

    // 5. Appel du handler avec données validées et sanitizées
    return await options.handler(sanitized);
  } catch (error: any) {
    console.error('[API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper pour logger les actions d'audit
 */
export const auditHelpers = {
  create: logCreate,
  update: logUpdate,
  delete: logDelete,
};


/**
 * Système de logs d'audit
 * Enregistre toutes les actions critiques pour traçabilité et sécurité
 */

import { createClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'acte_created'
  | 'acte_updated'
  | 'acte_deleted'
  | 'acte_generated'
  | 'associe_created'
  | 'associe_updated'
  | 'associe_deleted'
  | 'document_generated'
  | 'user_login'
  | 'user_logout'
  | 'unauthorized_access'
  | 'rate_limit_exceeded';

export type ResourceType =
  | 'client'
  | 'acte'
  | 'associe'
  | 'document'
  | 'user'
  | 'system';

interface LogAuditParams {
  action: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  metadata?: Record<string, any>;
  req?: Request; // Optionnel, utilise Request directement
}

/**
 * Enregistre une action dans les logs d'audit
 * @param params Paramètres de l'action à logger
 */
export async function logAudit({
  action,
  resourceType,
  resourceId,
  metadata = {},
  req,
}: LogAuditParams): Promise<void> {
  try {
    const supabase = createClient();

    // Récupérer l'utilisateur authentifié
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Logger quand même pour les actions non authentifiées (tentatives d'accès)
      console.warn(`[AUDIT] Action ${action} sans utilisateur authentifié`);
      return;
    }

    // Extraire l'IP et user agent depuis les headers
    let ipAddress = 'unknown';
    let userAgent = 'unknown';
    
    if (req) {
      try {
        const forwardedFor = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
        userAgent = req.headers.get('user-agent') || 'unknown';
      } catch (error) {
        console.warn('[AUDIT] Erreur extraction IP/User-Agent:', error);
        ipAddress = 'unknown';
        userAgent = 'unknown';
      }
    }

    // Insérer le log d'audit (ACPM mono-tenant : pas de cabinet_id)
    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      metadata: metadata || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error('[AUDIT] Erreur insertion log:', error);
      // Ne pas bloquer l'opération si le log échoue
    } else {
      console.log(`[AUDIT] ${action} logged for user ${user.id}`);
    }
  } catch (error) {
    console.error('[AUDIT] Exception lors du logging:', error);
    // Ne pas bloquer l'opération si le log échoue
  }
}

/**
 * Helper pour logger les créations
 */
export async function logCreate(
  resourceType: ResourceType,
  resourceId: string,
  metadata: Record<string, any>,
  req?: Request
): Promise<void> {
  await logAudit({
    action: `${resourceType}_created` as AuditAction,
    resourceType,
    resourceId,
    metadata,
    req,
  });
}

/**
 * Helper pour logger les mises à jour
 */
export async function logUpdate(
  resourceType: ResourceType,
  resourceId: string,
  metadata: Record<string, any>,
  req?: Request
): Promise<void> {
  await logAudit({
    action: `${resourceType}_updated` as AuditAction,
    resourceType,
    resourceId,
    metadata,
    req,
  });
}

/**
 * Helper pour logger les suppressions
 */
export async function logDelete(
  resourceType: ResourceType,
  resourceId: string,
  metadata: Record<string, any>,
  req?: Request
): Promise<void> {
  await logAudit({
    action: `${resourceType}_deleted` as AuditAction,
    resourceType,
    resourceId,
    metadata,
    req,
  });
}


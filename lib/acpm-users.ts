/**
 * Helpers pour la gestion des utilisateurs et des rôles ACPM
 */

import { ACPM_CONFIG, hasPermission, isAdmin } from './acpm-config';
import { supabaseClient } from './supabase';

export interface AcpmUser {
  id: string;
  email: string;
  role: 'admin' | 'collaborateur';
  nom: string;
  prenom: string;
  telephone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Récupérer l'utilisateur courant depuis Supabase Auth + table users
 */
export async function getCurrentUser(): Promise<AcpmUser | null> {
  try {
    // 1. Récupérer l'utilisateur authentifié
    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !authData.user) {
      return null;
    }

    // 2. Récupérer les infos depuis la table users
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', authData.user.email)
      .single();

    if (userError || !userData) {
      console.error('Erreur récupération user:', userError);
      return null;
    }

    return userData as AcpmUser;
  } catch (error) {
    console.error('Erreur getCurrentUser:', error);
    return null;
  }
}

/**
 * Vérifier si l'utilisateur courant a une permission
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  return hasPermission(user.role, permission);
}

/**
 * Vérifier si l'utilisateur courant est admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  return isAdmin(user.role);
}

/**
 * Récupérer tous les utilisateurs ACPM (admin only)
 */
export async function getAllUsers(): Promise<AcpmUser[]> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .order('role', { ascending: false }) // Admin d'abord
      .order('email', { ascending: true });

    if (error) {
      console.error('Erreur getAllUsers:', error);
      return [];
    }

    return data as AcpmUser[];
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    return [];
  }
}

/**
 * Mettre à jour un utilisateur (admin only)
 */
export async function updateUser(
  userId: string,
  updates: Partial<Pick<AcpmUser, 'nom' | 'prenom' | 'telephone' | 'role' | 'is_active'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier permission
    if (!(await checkIsAdmin())) {
      return { success: false, error: 'Permission refusée' };
    }

    const { error } = await supabaseClient
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Erreur updateUser:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur updateUser:', error);
    return { success: false, error: 'Erreur inattendue' };
  }
}

/**
 * Changer le mot de passe d'un utilisateur (admin only)
 * Note: Utilise Supabase Auth pour mettre à jour le mot de passe
 */
export async function updateUserPassword(
  userEmail: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier permission
    if (!(await checkIsAdmin())) {
      return { success: false, error: 'Permission refusée' };
    }

    // Note: Cette méthode nécessite le service_role_key côté serveur
    // Pour l'instant, on retourne un message indiquant que c'est à faire via Supabase Dashboard
    return { 
      success: false, 
      error: 'Changement de mot de passe à effectuer via le Dashboard Supabase ou email de reset' 
    };
  } catch (error) {
    console.error('Erreur updateUserPassword:', error);
    return { success: false, error: 'Erreur inattendue' };
  }
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Erreur sendPasswordResetEmail:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur sendPasswordResetEmail:', error);
    return { success: false, error: 'Erreur inattendue' };
  }
}

/**
 * Logger une action (audit log)
 */
export async function logAction(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || {},
      ip_address: null, // À implémenter côté serveur si besoin
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Erreur logAction:', error);
  }
}

/**
 * Récupérer les logs d'activité récents
 */
export async function getRecentLogs(limit: number = 50): Promise<any[]> {
  try {
    const { data, error } = await supabaseClient
      .from('audit_logs')
      .select(`
        *,
        users:user_id (
          email,
          nom,
          prenom
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur getRecentLogs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur getRecentLogs:', error);
    return [];
  }
}

/**
 * Formater le nom complet d'un utilisateur
 */
export function formatUserName(user: Pick<AcpmUser, 'prenom' | 'nom'>): string {
  return `${user.prenom} ${user.nom}`.trim();
}

/**
 * Obtenir le badge de couleur pour un rôle
 */
export function getRoleBadgeColor(role: 'admin' | 'collaborateur'): string {
  return role === 'admin' 
    ? ACPM_CONFIG.branding.colors.primary 
    : ACPM_CONFIG.branding.colors.secondary;
}

/**
 * Obtenir le label du rôle
 */
export function getRoleLabel(role: 'admin' | 'collaborateur'): string {
  return ACPM_CONFIG.roles[role].label;
}

/**
 * Initialisation automatique d'un expert-comptable admin lors de la création d'un cabinet
 */

import { supabaseClient } from "@/lib/supabase";
import type { ExpertComptable } from "@/types/database";

/**
 * Initialise un expert-comptable admin pour un cabinet
 * Vérifie d'abord si l'expert existe déjà pour éviter les doublons
 * @param userId - ID de l'utilisateur Supabase Auth
 * @param cabinetId - ID du cabinet (généralement égal à userId)
 * @param email - Email de l'expert-comptable
 * @returns Objet avec success (boolean) et error (string optionnel)
 */
export async function initExpertComptable(
  userId: string,
  cabinetId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier si l'expert existe déjà (pour éviter les doublons)
    const { data: existingExpert, error: checkError } = await supabaseClient
      .from("experts_comptables")
      .select("id, email, role, actif")
      .eq("user_id", userId)
      .eq("cabinet_id", cabinetId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = "no rows returned" (normal si l'expert n'existe pas)
      console.error("Erreur lors de la vérification de l'expert:", checkError);
      return {
        success: false,
        error: `Erreur lors de la vérification: ${checkError.message}`,
      };
    }

    // Si l'expert existe déjà, retourner succès sans créer de doublon
    if (existingExpert) {
      return { success: true };
    }

    // Créer l'expert-comptable admin
    const expertId = crypto.randomUUID();
    const expertPayload: Partial<ExpertComptable> = {
      id: expertId,
      cabinet_id: cabinetId,
      user_id: userId,
      email: email,
      nom: null,
      prenom: null,
      telephone: null,
      role: "admin",
      actif: true,
    };

    const { error: insertError } = await supabaseClient
      .from("experts_comptables")
      .insert(expertPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Erreur lors de la création de l'expert:", insertError);
      
      // Gérer les erreurs de contrainte UNIQUE
      if (insertError.code === "23505") {
        // Doublon détecté (peut arriver en cas de race condition)
        return { success: true };
      }

      return {
        success: false,
        error: `Erreur lors de la création: ${insertError.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inattendue est survenue lors de l'initialisation de l'expert-comptable";

    console.error("Erreur initExpertComptable:", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Récupère le cabinet_id depuis la table cabinets en utilisant le user_id
 * Dans la structure actuelle, cabinet.id = userId, donc on vérifie juste l'existence
 * @param userId - ID de l'utilisateur Supabase Auth
 * @returns ID du cabinet (userId) ou null si le cabinet n'existe pas
 */
export async function getCabinetIdByUserId(
  userId: string
): Promise<string | null> {
  try {
    const { data: cabinet, error } = await supabaseClient
      .from("cabinets")
      .select("id")
      .eq("id", userId) // Dans le code actuel, cabinet.id = userId
      .maybeSingle();

    if (error) {
      // PGRST116 = "no rows returned" (normal si le cabinet n'existe pas)
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Erreur lors de la récupération du cabinet:", error);
      return null;
    }

    // Si le cabinet existe, retourner son id (qui est égal à userId)
    return cabinet?.id || null;
  } catch (error) {
    console.error("Erreur getCabinetIdByUserId:", error);
    return null;
  }
}


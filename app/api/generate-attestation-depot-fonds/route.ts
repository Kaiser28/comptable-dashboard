import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

import type { ClientData, AssocieData } from "@/lib/types/database";
import { generateAttestationDepotFonds } from "@/lib/generateAttestationDepotFonds";

/**
 * Route POST /api/generate-attestation-depot-fonds
 * Génère l'Attestation de Dépôt des Fonds Word pour un client donné.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer l'ID du client depuis le body
    const body = await request.json().catch((): null => null);
    const clientId = body?.clientId || body?.client_id as string | undefined;

    if (!clientId) {
      return new Response(JSON.stringify({ error: "Client ID manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Créer le client Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 3. Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentification échouée", authError);
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Récupérer les données du client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single<ClientData>();

    if (clientError || !client) {
      console.error("Erreur récupération client", clientError);
      return new Response(JSON.stringify({ error: "Client introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 5. Récupérer les associés
    const { data: associes, error: associesError } = await supabase
      .from("associes")
      .select("*")
      .eq("client_id", clientId)
      .returns<AssocieData[]>();

    if (associesError || !associes || associes.length === 0) {
      console.error("Erreur récupération associés", associesError);
      return new Response(JSON.stringify({ error: "Aucun associé trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 6. Générer l'Attestation de Dépôt des Fonds
    console.log(`Génération de l'Attestation de Dépôt des Fonds pour le client ${client.nom_entreprise}...`);
    const documentBuffer = await generateAttestationDepotFonds(client, associes);

    // 7. Retourner le fichier Word
    return new Response(new Uint8Array(documentBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Attestation_Depot_Fonds_${client.nom_entreprise || "document"}.docx"`
      }
    });

  } catch (error) {
    console.error("Erreur génération Attestation de Dépôt des Fonds:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur lors de la génération de l'Attestation de Dépôt des Fonds" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}


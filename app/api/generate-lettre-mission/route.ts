import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { ClientData, CabinetData } from "@/lib/types/database";
import { generateLettreMission } from "@/lib/generateLettreMission";
import { getCabinetInfo } from "@/lib/cabinet-params";

/**
 * Route POST /api/generate-lettre-mission
 * Génère la lettre de mission comptable Word pour un client donné en s'appuyant sur les données Supabase.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch((): null => null);
    const clientId = body?.client_id as string | undefined;

    if (!clientId) {
      return NextResponse.json(
        { error: "Paramètre client_id manquant." },
        { status: 400 }
      );
    }

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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentification échouée", authError);
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    console.log('🔐 User ID:', user?.id);

    // Récupérer le client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single<ClientData>();

    if (clientError) {
      console.error("Erreur récupération client", clientError);
      return NextResponse.json(
        { error: "Client introuvable ou inaccessible." },
        { status: 404 }
      );
    }

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable." },
        { status: 404 }
      );
    }

    // Validations spécifiques pour la lettre de mission
    if (!client.mission_objectif) {
      return NextResponse.json(
        { error: "L'objectif de la mission est requis pour générer la lettre de mission." },
        { status: 400 }
      );
    }

    if (!client.mission_honoraires) {
      return NextResponse.json(
        { error: "Les honoraires sont requis pour générer la lettre de mission." },
        { status: 400 }
      );
    }

    if (!client.mission_periodicite) {
      return NextResponse.json(
        { error: "La périodicité des interventions est requise pour générer la lettre de mission." },
        { status: 400 }
      );
    }

    // Récupérer les informations du cabinet (ACPM mono-tenant)
    const cabinet = await getCabinetInfo();

    // Générer le document
    const documentBuffer = await generateLettreMission(client, cabinet);

    // Nettoyer le nom de l'entreprise pour le nom de fichier (enlever caractères spéciaux)
    const nomEntrepriseSafe = (client.nom_entreprise || "document")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50); // Limiter la longueur

    return new Response(new Uint8Array(documentBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Lettre_Mission_${nomEntrepriseSafe}.docx"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération de la lettre de mission", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inattendue lors de la génération de la lettre de mission.",
      },
      { status: 500 }
    );
  }
}


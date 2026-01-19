import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { ActeJuridiqueData, ClientData, CabinetData, AssocieData } from "@/lib/types/database";
import { generateCessionActions } from "@/lib/generateCessionActions";
import { getCabinetInfo } from "@/lib/cabinet-params";

/**
 * Route POST /api/generate-cession-actions
 * Génère l'acte de cession d'actions Word pour un acte juridique donné en s'appuyant sur les données Supabase.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch((): null => null);
    const acteId = body?.acte_id as string | undefined;

    if (!acteId) {
      return NextResponse.json(
        { error: "Paramètre acte_id manquant." },
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

    // Récupérer l'acte avec les relations
    const { data: acte, error: acteError } = await supabase
      .from("actes_juridiques")
      .select(`
        *,
        cedant:associes(*),
        client:clients(*)
      `)
      .eq("id", acteId)
      .single();

    if (acteError) {
      console.error("Erreur récupération acte", acteError);
      return NextResponse.json(
        { error: "Acte juridique introuvable ou inaccessible." },
        { status: 404 }
      );
    }

    if (!acte) {
      return NextResponse.json(
        { error: "Acte juridique introuvable." },
        { status: 404 }
      );
    }

    // Vérifier le type d'acte
    if (acte.type !== 'cession_actions') {
      return NextResponse.json(
        { error: "Ce générateur ne peut être utilisé que pour les actes de cession d'actions." },
        { status: 400 }
      );
    }

    // Extraire les données
    const acteData = acte as unknown as ActeJuridiqueData & {
      cedant: AssocieData | AssocieData[] | null;
      client: ClientData | null;
    };

    const client = acteData.client;
    const cedant = Array.isArray(acteData.cedant) 
      ? acteData.cedant[0] 
      : acteData.cedant;

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable pour cet acte." },
        { status: 404 }
      );
    }

    if (!cedant) {
      return NextResponse.json(
        { error: "Cédant introuvable pour cet acte. Veuillez vérifier que cedant_id correspond à un associé valide." },
        { status: 400 }
      );
    }

    // Validations des données requises
    if (!acteData.cessionnaire_nom || !acteData.cessionnaire_prenom) {
      return NextResponse.json(
        { error: "Le nom et prénom du cessionnaire sont requis." },
        { status: 400 }
      );
    }

    if (!acteData.nombre_actions || acteData.nombre_actions <= 0) {
      return NextResponse.json(
        { error: "Le nombre d'actions cédées doit être supérieur à zéro." },
        { status: 400 }
      );
    }

    if (!acteData.prix_unitaire || acteData.prix_unitaire <= 0) {
      return NextResponse.json(
        { error: "Le prix unitaire doit être supérieur à zéro." },
        { status: 400 }
      );
    }

    if (!acteData.prix_total || acteData.prix_total <= 0) {
      return NextResponse.json(
        { error: "Le prix total doit être supérieur à zéro." },
        { status: 400 }
      );
    }

    // Récupérer les informations du cabinet (ACPM mono-tenant)
    const cabinet = await getCabinetInfo();

    // Générer le document
    const documentBuffer = await generateCessionActions(
      acteData as ActeJuridiqueData,
      client,
      cabinet as CabinetData,
      cedant
    );

    // Nettoyer le nom de l'entreprise pour le nom de fichier
    const nomEntrepriseSafe = (client.nom_entreprise || "document")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);

    // Formater la date pour le nom de fichier
    const dateActe = acteData.date_acte 
      ? new Date(acteData.date_acte).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    return new Response(new Uint8Array(documentBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Acte_Cession_Actions_${nomEntrepriseSafe}_${dateActe}.docx"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération de l'acte de cession d'actions", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inattendue lors de la génération de l'acte de cession d'actions.",
      },
      { status: 500 }
    );
  }
}


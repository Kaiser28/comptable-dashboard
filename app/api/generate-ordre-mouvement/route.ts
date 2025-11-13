import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { ActeJuridiqueData, ClientData, CabinetData, AssocieData } from "@/lib/types/database";
import { generateOrdreMouvementTitres } from "@/lib/generateOrdreMouvementTitres";

/**
 * Route POST /api/generate-ordre-mouvement
 * Génère l'Ordre de Mouvement de Titres (OMT) Word pour un acte de cession d'actions donné.
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

    // Validations des données requises pour l'OMT
    if (!acteData.cessionnaire_civilite) {
      return NextResponse.json(
        { error: "La civilité du cessionnaire est requise." },
        { status: 400 }
      );
    }

    if (!acteData.cessionnaire_nom || !acteData.cessionnaire_prenom) {
      return NextResponse.json(
        { error: "Le nom et prénom du cessionnaire sont requis." },
        { status: 400 }
      );
    }

    if (!acteData.cessionnaire_adresse) {
      return NextResponse.json(
        { error: "L'adresse du cessionnaire est requise." },
        { status: 400 }
      );
    }

    if (!acteData.cessionnaire_nationalite) {
      return NextResponse.json(
        { error: "La nationalité du cessionnaire est requise." },
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

    // Récupérer le cabinet_id depuis experts_comptables
    const { data: expertComptable, error: expertError } = await supabase
      .from("experts_comptables")
      .select("cabinet_id")
      .eq("user_id", user.id)
      .single();

    console.log('👤 Expert comptable:', expertComptable);
    console.log('🏢 Cabinet ID trouvé:', expertComptable?.cabinet_id);
    console.log('❌ Error expert:', expertError);

    if (expertError || !expertComptable?.cabinet_id) {
      console.error("Erreur récupération expert comptable", expertError);
      return NextResponse.json(
        { error: "Cabinet introuvable ou inaccessible." },
        { status: 404 }
      );
    }

    // Récupérer le cabinet
    const { data: cabinet, error: cabinetError } = await supabase
      .from('cabinets')
      .select('*')
      .eq("id", expertComptable.cabinet_id)
      .single();

    console.log('🏢 Cabinet récupéré:', cabinet);
    console.log('📊 Data cabinet:', cabinet);
    console.log('❌ Error cabinet:', cabinetError);

    if (cabinetError || !cabinet) {
      console.error("Erreur récupération cabinet", cabinetError);
      return NextResponse.json(
        { error: "Cabinet introuvable ou inaccessible." },
        { status: 404 }
      );
    }

    // Préparer l'acte avec les relations pour le générateur
    const acteWithRelations = {
      ...acteData,
      cedant,
      client,
    } as ActeJuridiqueData & { cedant: AssocieData; client: ClientData };

    // Générer le document
    const documentBuffer = await generateOrdreMouvementTitres(
      acteWithRelations,
      cabinet as CabinetData
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
        "Content-Disposition": `attachment; filename="Ordre_Mouvement_Titres_${nomEntrepriseSafe}_${dateActe}.docx"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération de l'Ordre de Mouvement de Titres", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inattendue lors de la génération de l'Ordre de Mouvement de Titres.",
      },
      { status: 500 }
    );
  }
}


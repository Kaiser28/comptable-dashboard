import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import type { ActeJuridiqueData, ClientData, CabinetData } from "@/lib/types/database";
import { generateReductionCapital } from "@/lib/generateReductionCapital";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch((): null => null);
    const acteId = body?.acte_id as string | undefined;

    if (!acteId) {
      return NextResponse.json({ error: "Paramètre acte_id manquant." }, { status: 400 });
    }

    // Vérifier le token dans le header Authorization (pour tests) ou cookies (pour navigateur)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let supabase;
    let user;
    let authError;

    if (token) {
      // Utiliser le token du header pour les tests automatisés
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      authError = result.error;
    } else {
      // Utiliser les cookies pour l'authentification navigateur
      const cookieStore = await cookies();
      supabase = createServerClient(
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
      const result = await supabase.auth.getUser();
      user = result.data.user;
      authError = result.error;
    }

    if (authError || !user) {
      console.error("Authentification échouée", authError);
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: acte, error: acteError } = await supabase
      .from("actes_juridiques")
      .select(
        `
        *,
        ancien_capital,
        nouveau_capital_apres_reduction,
        modalite_reduction,
        montant_reduction,
        nombre_actions_rachetees,
        ancienne_valeur_nominale,
        nouvelle_valeur_nominale,
        client:clients(*)
      `
      )
      .eq("id", acteId)
      .single();

    if (acteError || !acte) {
      console.error("Erreur récupération acte", acteError);
      return NextResponse.json(
        { error: "Acte juridique introuvable ou inaccessible." },
        { status: 404 }
      );
    }

    // Log de debug après récupération
    console.log('📥 API A REÇU:', {
      ancien_capital: acte?.ancien_capital,
      nouveau_capital: acte?.nouveau_capital_apres_reduction,
      modalite: acte?.modalite_reduction
    });

    if (acte.type !== "reduction_capital") {
      return NextResponse.json(
        { error: "Ce générateur est réservé aux actes de réduction de capital." },
        { status: 400 }
      );
    }

    if (!acte.client) {
      return NextResponse.json(
        { error: "Client introuvable pour cet acte." },
        { status: 404 }
      );
    }

    if (
      acte.ancien_capital === null ||
      acte.ancien_capital === undefined ||
      acte.nouveau_capital_apres_reduction === null ||
      acte.nouveau_capital_apres_reduction === undefined ||
      !acte.modalite_reduction
    ) {
      return NextResponse.json(
        {
          error:
            "Les informations suivantes sont requises : ancien capital, nouveau capital après réduction et modalité de réduction.",
        },
        { status: 400 }
      );
    }

    const { data: expertComptable, error: expertError } = await supabase
      .from("experts_comptables")
      .select("cabinet_id")
      .eq("user_id", user.id)
      .single();

    if (expertError || !expertComptable?.cabinet_id) {
      console.error("Erreur récupération expert comptable", expertError);
      return NextResponse.json(
        { error: "Cabinet introuvable ou inaccessible." },
        { status: 404 }
      );
    }

    const { data: cabinet, error: cabinetError } = await supabase
      .from("cabinets")
      .select("*")
      .eq("id", expertComptable.cabinet_id)
      .single();

    if (cabinetError || !cabinet) {
      console.error("Erreur récupération cabinet", cabinetError);
      return NextResponse.json(
        { error: "Cabinet introuvable ou inaccessible." },
        { status: 404 }
      );
    }

    const acteWithRelations = acte as ActeJuridiqueData & { client: ClientData };

    const documentBuffer = await generateReductionCapital(
      acteWithRelations,
      cabinet as CabinetData
    );

    const nomEntrepriseSafe = (acte.client.nom_entreprise || "document")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);

    const dateActe = acte.date_acte
      ? new Date(acte.date_acte).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    return new Response(new Uint8Array(documentBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="PV_Reduction_Capital_${nomEntrepriseSafe}_${dateActe}.docx"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération du PV de réduction de capital", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inattendue lors de la génération du document.",
      },
      { status: 500 }
    );
  }
}


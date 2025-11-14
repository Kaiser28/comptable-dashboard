import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { ActeJuridiqueData, ClientData, CabinetData } from "@/lib/types/database";
import { generateAugmentationCapital } from "@/lib/generateAugmentationCapital";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch((): null => null);
    const acteId = body?.acte_id as string | undefined;

    if (!acteId) {
      return NextResponse.json({ error: "Paramètre acte_id manquant." }, { status: 400 });
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
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: acte, error: acteError } = await supabase
      .from("actes_juridiques")
      .select(
        `
        *,
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

    if (acte.type !== "augmentation_capital") {
      return NextResponse.json(
        { error: "Ce générateur est réservé aux actes d'augmentation de capital." },
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
      acte.nouveau_capital === null ||
      acte.nouveau_capital === undefined ||
      !acte.modalite ||
      !acte.nombre_nouvelles_actions
    ) {
      return NextResponse.json(
        {
          error:
            "Les informations suivantes sont requises : ancien capital, nouveau capital, modalité et nombre de nouvelles actions.",
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

    const documentBuffer = await generateAugmentationCapital(
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
        "Content-Disposition": `attachment; filename="PV_Augmentation_Capital_${nomEntrepriseSafe}_${dateActe}.docx"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération du PV d'augmentation de capital", error);
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


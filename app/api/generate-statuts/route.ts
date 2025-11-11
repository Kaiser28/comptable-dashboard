import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { ClientData, AssocieData } from "@/lib/generateStatuts";
import { generateStatuts } from "@/lib/generateStatuts";

/**
 * Route POST /api/generate-statuts
 * Génère les statuts Word pour un client donné en s'appuyant sur les données Supabase.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
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

    const { data: associes, error: associesError } = await supabase
      .from("associes")
      .select("*")
      .eq("client_id", clientId)
      .returns<AssocieData[]>();

    if (associesError) {
      console.error("Erreur récupération associés", associesError);
      return NextResponse.json(
        { error: "Impossible de récupérer les associés." },
        { status: 500 }
      );
    }

    if (!client || !associes || associes.length === 0) {
      return NextResponse.json(
        { error: "Données client incomplètes." },
        { status: 400 }
      );
    }

    const documentBuffer = await generateStatuts(client, associes);

    return new Response(new Uint8Array(documentBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Statuts-${client.nom_entreprise || "document"}.docx"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la génération des statuts", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inattendue lors de la génération des statuts.",
      },
      { status: 500 }
    );
  }
}

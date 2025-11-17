import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/clients/[id]/associes
 * Liste tous les associés d'un client
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json(
        { error: "ID client manquant" },
        { status: 400 }
      );
    }

    // Authentification
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let supabase;
    let user;
    let authError;

    if (token) {
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
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le client existe et appartient au cabinet de l'expert
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, cabinet_id, nb_actions, capital_social")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'expert appartient au même cabinet que le client
    const { data: expert } = await supabase
      .from("experts_comptables")
      .select("cabinet_id")
      .eq("user_id", user.id)
      .single();

    if (!expert || expert.cabinet_id !== client.cabinet_id) {
      return NextResponse.json(
        { error: "Accès non autorisé à ce client" },
        { status: 403 }
      );
    }

    // Récupérer tous les associés du client, triés par pourcentage_capital DESC
    const { data: associes, error: associesError } = await supabase
      .from("associes")
      .select("*")
      .eq("client_id", clientId)
      .order("pourcentage_capital", { ascending: false });

    if (associesError) {
      console.error("Erreur récupération associés:", associesError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des associés" },
        { status: 500 }
      );
    }

    return NextResponse.json(associes || [], { status: 200 });
  } catch (error: any) {
    console.error("Erreur GET associés:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des associés" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/[id]/associes
 * Crée un nouvel associé pour un client
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json(
        { error: "ID client manquant" },
        { status: 400 }
      );
    }

    const body = await request.json().catch((): null => null);
    if (!body) {
      return NextResponse.json(
        { error: "Corps de la requête invalide" },
        { status: 400 }
      );
    }

    // Authentification
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let supabase;
    let user;
    let authError;

    if (token) {
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
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le client existe et appartient au cabinet de l'expert
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, cabinet_id, nb_actions, capital_social")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'expert appartient au même cabinet que le client
    const { data: expert } = await supabase
      .from("experts_comptables")
      .select("cabinet_id")
      .eq("user_id", user.id)
      .single();

    if (!expert || expert.cabinet_id !== client.cabinet_id) {
      return NextResponse.json(
        { error: "Accès non autorisé à ce client" },
        { status: 403 }
      );
    }

    // Validation : vérifier le nombre d'actions disponibles
    const nombreActionsDemande = body.nombre_actions;
    if (!nombreActionsDemande || nombreActionsDemande <= 0) {
      return NextResponse.json(
        { error: "Le nombre d'actions doit être supérieur à 0" },
        { status: 400 }
      );
    }

    // Calculer le total d'actions déjà utilisées par les associés existants
    const { data: associesExistants, error: associesError } = await supabase
      .from("associes")
      .select("nombre_actions")
      .eq("client_id", clientId);

    if (associesError) {
      console.error("Erreur récupération associés existants:", associesError);
      return NextResponse.json(
        { error: "Erreur lors de la vérification des associés existants" },
        { status: 500 }
      );
    }

    const totalActionsUtilisees =
      associesExistants?.reduce(
        (sum, a) => sum + (a.nombre_actions || 0),
        0
      ) || 0;
    const actionsDisponibles = (client.nb_actions || 0) - totalActionsUtilisees;

    // Vérifier que le nombre d'actions demandé ne dépasse pas les actions disponibles
    if (nombreActionsDemande > actionsDisponibles) {
      return NextResponse.json(
        {
          error: `Seulement ${actionsDisponibles} action(s) disponible(s) sur ${client.nb_actions} au total`,
        },
        { status: 400 }
      );
    }

    // Calculs automatiques
    const valeurNominale =
      client.capital_social && client.nb_actions
        ? client.capital_social / client.nb_actions
        : 0;
    const montantApport = nombreActionsDemande * valeurNominale;
    const pourcentageCapital =
      client.nb_actions && client.nb_actions > 0
        ? (nombreActionsDemande / client.nb_actions) * 100
        : 0;

    // Préparer les données de l'associé
    const associeData = {
      client_id: clientId,
      civilite: body.civilite || null,
      nom: body.nom || null,
      prenom: body.prenom || null,
      date_naissance: body.date_naissance || null,
      lieu_naissance: body.lieu_naissance || null,
      Nationalite: body.Nationalite || body.nationalite || null,
      adresse: body.adresse || null,
      email: body.email || null,
      telephone: body.telephone || null,
      profession: body.profession || null,
      numero_cni: body.numero_cni || null,
      situation_matrimoniale: body.situation_matrimoniale || null,
      president: body.president === true,
      directeur_general: body.directeur_general === true,
      nombre_actions: nombreActionsDemande,
      type_apport: body.type_apport || "numeraire",
      montant_apport: montantApport,
      pourcentage_capital: pourcentageCapital,
    };

    // Insérer l'associé
    const { data: associeCree, error: insertError } = await supabase
      .from("associes")
      .insert(associeData)
      .select()
      .single();

    if (insertError) {
      console.error("Erreur insertion associé:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'associé" },
        { status: 500 }
      );
    }

    // Le trigger SQL gère automatiquement la synchronisation du président vers clients
    return NextResponse.json(associeCree, { status: 201 });
  } catch (error) {
    console.error('❌ ERREUR CRÉATION ASSOCIÉ:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Message:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'associé', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * PATCH /api/clients/[id]/associes/[associeId]
 * Modifie un associé existant
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; associeId: string } }
) {
  try {
    const clientId = params.id;
    const associeId = params.associeId;

    if (!clientId || !associeId) {
      return NextResponse.json(
        { error: "ID client ou associé manquant" },
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

    // Vérifier que le client existe (ACPM mono-tenant)
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, nb_actions, capital_social")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    // RLS vérifie automatiquement les permissions (ACPM mono-tenant)

    // Vérifier que l'associé existe et appartient au client
    const { data: associeExistant, error: associeError } = await supabase
      .from("associes")
      .select("id, nombre_actions")
      .eq("id", associeId)
      .eq("client_id", clientId)
      .single();

    if (associeError || !associeExistant) {
      return NextResponse.json(
        { error: "Associé non trouvé" },
        { status: 404 }
      );
    }

    // Si le nombre d'actions change, valider la disponibilité
    const nouveauNombreActions = body.nombre_actions;
    if (nouveauNombreActions !== undefined) {
      if (nouveauNombreActions <= 0) {
        return NextResponse.json(
          { error: "Le nombre d'actions doit être supérieur à 0" },
          { status: 400 }
        );
      }

      // Calculer le total d'actions déjà utilisées (en excluant l'associé actuel)
      const { data: autresAssocies, error: autresError } = await supabase
        .from("associes")
        .select("nombre_actions")
        .eq("client_id", clientId)
        .neq("id", associeId);

      if (autresError) {
        console.error("Erreur récupération autres associés:", autresError);
        return NextResponse.json(
          { error: "Erreur lors de la vérification des autres associés" },
          { status: 500 }
        );
      }

      const totalActionsAutres =
        autresAssocies?.reduce((sum, a) => sum + (a.nombre_actions || 0), 0) ||
        0;
      const actionsDisponibles =
        (client.nb_actions || 0) - totalActionsAutres;

      // Vérifier que le nouveau nombre d'actions ne dépasse pas les actions disponibles
      if (nouveauNombreActions > actionsDisponibles) {
        return NextResponse.json(
          {
            error: `Seulement ${actionsDisponibles} action(s) disponible(s) sur ${client.nb_actions} au total`,
          },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    // Mettre à jour les champs fournis
    if (body.civilite !== undefined) updateData.civilite = body.civilite;
    if (body.nom !== undefined) updateData.nom = body.nom;
    if (body.prenom !== undefined) updateData.prenom = body.prenom;
    if (body.date_naissance !== undefined)
      updateData.date_naissance = body.date_naissance;
    if (body.lieu_naissance !== undefined)
      updateData.lieu_naissance = body.lieu_naissance;
    if (body.Nationalite !== undefined)
      updateData.Nationalite = body.Nationalite;
    if (body.nationalite !== undefined)
      updateData.Nationalite = body.nationalite;
    if (body.adresse !== undefined) updateData.adresse = body.adresse;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.telephone !== undefined) updateData.telephone = body.telephone;
    if (body.profession !== undefined) updateData.profession = body.profession;
    if (body.numero_cni !== undefined) updateData.numero_cni = body.numero_cni;
    if (body.situation_matrimoniale !== undefined)
      updateData.situation_matrimoniale = body.situation_matrimoniale;
    if (body.president !== undefined) updateData.president = body.president === true;
    if (body.directeur_general !== undefined)
      updateData.directeur_general = body.directeur_general === true;
    if (body.type_apport !== undefined) updateData.type_apport = body.type_apport;

    // Recalculer montant_apport et pourcentage_capital si nombre_actions change
    const nombreActionsFinal =
      nouveauNombreActions !== undefined
        ? nouveauNombreActions
        : associeExistant.nombre_actions;

    if (nouveauNombreActions !== undefined) {
      const valeurNominale =
        client.capital_social && client.nb_actions
          ? client.capital_social / client.nb_actions
          : 0;
      updateData.nombre_actions = nombreActionsFinal;
      updateData.montant_apport = nombreActionsFinal * valeurNominale;
      updateData.pourcentage_capital =
        client.nb_actions && client.nb_actions > 0
          ? (nombreActionsFinal / client.nb_actions) * 100
          : 0;
    }

    // Mettre à jour l'associé
    const { data: associeModifie, error: updateError } = await supabase
      .from("associes")
      .update(updateData)
      .eq("id", associeId)
      .eq("client_id", clientId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur modification associé:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la modification de l'associé" },
        { status: 500 }
      );
    }

    // Le trigger SQL gère automatiquement la synchronisation du président vers clients
    return NextResponse.json(associeModifie, { status: 200 });
  } catch (error: any) {
    console.error("Erreur PATCH associé:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la modification de l'associé" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]/associes/[associeId]
 * Supprime un associé
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; associeId: string } }
) {
  try {
    const clientId = params.id;
    const associeId = params.associeId;

    if (!clientId || !associeId) {
      return NextResponse.json(
        { error: "ID client ou associé manquant" },
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

    // Vérifier que le client existe (ACPM mono-tenant)
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    // RLS vérifie automatiquement les permissions (ACPM mono-tenant)

    // Vérifier que l'associé existe et appartient au client
    const { data: associeExistant, error: associeError } = await supabase
      .from("associes")
      .select("id")
      .eq("id", associeId)
      .eq("client_id", clientId)
      .single();

    if (associeError || !associeExistant) {
      return NextResponse.json(
        { error: "Associé non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer l'associé
    const { error: deleteError } = await supabase
      .from("associes")
      .delete()
      .eq("id", associeId)
      .eq("client_id", clientId);

    if (deleteError) {
      console.error("Erreur suppression associé:", deleteError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression de l'associé" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur DELETE associé:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression de l'associé" },
      { status: 500 }
    );
  }
}


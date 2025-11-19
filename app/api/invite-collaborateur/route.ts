import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { withRateLimit } from "@/lib/ratelimit-upstash";

/**
 * POST /api/invite-collaborateur
 * Invite un collaborateur au cabinet
 * 
 * Rate limiting strict : 10 req/min (invitation - action sensible)
 */
export const POST = withRateLimit(
  async (request: Request) => {
    try {
      let body: { email?: string; nom?: string; prenom?: string } | null;
      try {
        body = await request.json();
      } catch {
        body = null;
      }

      if (!body) {
        return NextResponse.json(
          { error: "Corps de la requête invalide" },
          { status: 400 }
        );
      }

      const { email, nom, prenom } = body;

      if (!email || !nom) {
        return NextResponse.json(
          { error: "Email et nom sont requis" },
          { status: 400 }
        );
      }

      // Validation email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "Email invalide" },
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

      // Authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { error: "Non authentifié" },
          { status: 401 }
        );
      }

      // Vérifier que l'utilisateur est admin
      const { data: expertComptable, error: expertError } = await supabase
        .from("experts_comptables")
        .select("id, role, cabinet_id")
        .eq("user_id", user.id)
        .single();

      if (expertError || !expertComptable) {
        return NextResponse.json(
          { error: "Expert-comptable introuvable" },
          { status: 404 }
        );
      }

      if (expertComptable.role !== "admin") {
        return NextResponse.json(
          { error: "Accès refusé. Seuls les administrateurs peuvent inviter des collaborateurs." },
          { status: 403 }
        );
      }

      const cabinetId = expertComptable.cabinet_id;
      if (!cabinetId) {
        return NextResponse.json(
          { error: "Cabinet introuvable" },
          { status: 404 }
        );
      }

      // Vérifier si l'email existe déjà
      const { data: existingExpert } = await supabase
        .from("experts_comptables")
        .select("id")
        .eq("email", email)
        .single();

      if (existingExpert) {
        return NextResponse.json(
          { error: "Cet email est déjà associé à un compte" },
          { status: 400 }
        );
      }

      // Créer le client Supabase Admin pour utiliser Auth Admin
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Inviter l'utilisateur via Auth Admin
      const { data: invitedUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            nom,
            prenom,
            cabinet_id: cabinetId,
          },
        }
      );

      if (inviteError) {
        console.error("Erreur invitation:", inviteError);
        return NextResponse.json(
          { error: inviteError.message || "Erreur lors de l'invitation" },
          { status: 500 }
        );
      }

      if (!invitedUser.user) {
        return NextResponse.json(
          { error: "Erreur lors de la création de l'utilisateur" },
          { status: 500 }
        );
      }

      // Créer l'enregistrement dans experts_comptables
      const defaultPermissions = {
        clients: {
          read: true,
          write: true,
          delete: false,
        },
      };

      const { error: insertError } = await supabase
        .from("experts_comptables")
        .insert({
          user_id: invitedUser.user.id,
          email: email,
          nom: nom,
          prenom: prenom || null,
          role: "collaborateur",
          cabinet_id: cabinetId,
          created_by: user.id,
          is_active: true,
          permissions: defaultPermissions,
          invited_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Erreur insertion expert:", insertError);
        // Nettoyer l'utilisateur créé si l'insertion échoue
        await supabaseAdmin.auth.admin.deleteUser(invitedUser.user.id);
        return NextResponse.json(
          { error: "Erreur lors de l'enregistrement du collaborateur" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `Invitation envoyée à ${email}`,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Erreur inattendue:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Erreur inattendue lors de l'invitation",
        },
        { status: 500 }
      );
    }
  },
  { limiter: "strict" } // 10 req/min pour invitation
);


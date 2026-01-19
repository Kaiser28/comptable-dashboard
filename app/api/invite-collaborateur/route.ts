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

      // Vérifier que l'utilisateur est admin (ACPM mono-tenant)
      const { data: currentUser, error: userError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (userError || !currentUser) {
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 404 }
        );
      }

      if (currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Accès refusé. Seuls les administrateurs peuvent inviter des collaborateurs." },
          { status: 403 }
        );
      }

      // Vérifier si l'email existe déjà (ACPM mono-tenant)
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
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

      // Créer l'utilisateur dans la table users (ACPM mono-tenant)
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: invitedUser.user.id,
          email: email,
          nom: nom,
          prenom: prenom || null,
          role: "collaborateur",
          is_active: true,
          created_at: new Date().toISOString(),
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


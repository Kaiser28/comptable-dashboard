import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/ratelimit-upstash";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/beta-signup
 * Inscription Beta Founder pour LexiGen
 * 
 * Rate limiting : moderate (100 req/min)
 */
export const POST = withRateLimit(
  async (request: Request) => {
    try {
      let body: {
        prenom?: string;
        email?: string;
        cabinet?: string;
        nb_creations_mois?: string;
      } | null;

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

      const { prenom, email, cabinet, nb_creations_mois } = body;

      // Validation
      if (!prenom || !email) {
        return NextResponse.json(
          { error: "Prénom et email sont requis" },
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

      // Créer le client Supabase Admin pour insérer dans la table beta_signups
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

      // Vérifier si l'email existe déjà
      const { data: existing } = await supabaseAdmin
        .from("beta_signups")
        .select("id")
        .eq("email", email)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Cet email est déjà inscrit à la beta" },
          { status: 400 }
        );
      }

      // Compter le nombre d'inscriptions actuelles
      const { count } = await supabaseAdmin
        .from("beta_signups")
        .select("*", { count: "exact", head: true });

      const placesRestantes = Math.max(0, 50 - (count || 0));

      if (placesRestantes <= 0) {
        return NextResponse.json(
          { error: "Désolé, toutes les places beta sont prises" },
          { status: 400 }
        );
      }

      // Insérer l'inscription
      const { error: insertError } = await supabaseAdmin
        .from("beta_signups")
        .insert({
          prenom: prenom.trim(),
          email: email.trim(),
          cabinet: cabinet?.trim() || null,
          nb_creations_mois: nb_creations_mois || null,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Erreur insertion beta signup:", insertError);
        return NextResponse.json(
          { error: "Erreur lors de l'inscription" },
          { status: 500 }
        );
      }

      // Envoyer l'email de confirmation via Resend (si configuré)
      if (process.env.RESEND_API_KEY) {
        try {
          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "LexiGen <contact@lexigen.fr>",
              to: email,
              subject: "🎉 Bienvenue dans la Beta LexiGen !",
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bienvenue ${prenom} !</h1>
                    </div>
                    <div style="background: #F9FAFB; padding: 30px; border-radius: 0 0 10px 10px;">
                      <p style="font-size: 18px; margin-top: 0;">Merci de votre intérêt pour LexiGen !</p>
                      <p>Votre inscription à la <strong>Beta Founder</strong> a bien été enregistrée.</p>
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B35;">
                        <h2 style="margin-top: 0; color: #FF6B35;">Vos avantages Beta Founder :</h2>
                        <ul style="list-style: none; padding: 0;">
                          <li style="padding: 8px 0;">✓ Accès gratuit 1 mois complet</li>
                          <li style="padding: 8px 0;">✓ Prix bloqué à vie : 29€/mois (vs 59€)</li>
                          <li style="padding: 8px 0;">✓ Priorité support</li>
                          <li style="padding: 8px 0;">✓ Badge Founder exclusif</li>
                          <li style="padding: 8px 0;">✓ Accès anticipé aux nouvelles features</li>
                        </ul>
                      </div>
                      <p><strong>Prochaines étapes :</strong></p>
                      <p>Nous vous enverrons un email dans les prochains jours avec vos identifiants d'accès à la plateforme.</p>
                      <p style="margin-bottom: 0;">À très bientôt !<br><strong>L'équipe LexiGen</strong></p>
                    </div>
                  </body>
                </html>
              `,
            }),
          });

          if (!resendResponse.ok) {
            console.error("Erreur envoi email Resend:", await resendResponse.text());
          }
        } catch (emailError) {
          console.error("Erreur envoi email:", emailError);
          // Ne pas faire échouer l'inscription si l'email échoue
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: "Inscription réussie !",
          placesRestantes: placesRestantes - 1,
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
              : "Erreur inattendue lors de l'inscription",
        },
        { status: 500 }
      );
    }
  },
  { limiter: "moderate" } // 100 req/min
);


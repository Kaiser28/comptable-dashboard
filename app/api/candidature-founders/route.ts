import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/ratelimit-upstash";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/candidature-founders
 * Gestion des candidatures au Programme Founders
 * 
 * Rate limiting : moderate (100 req/min)
 */
export const POST = withRateLimit(
  async (request: Request) => {
    try {
      let body: {
        nom_cabinet?: string;
        prenom_nom?: string;
        fonction?: string;
        email?: string;
        telephone?: string;
        ville?: string;
        nb_collaborateurs?: string;
        nb_creations?: string;
        process_actuel?: string;
        pain_principal?: string;
        outils_saas?: string[];
        outils_saas_autre?: string;
        quand_demarrer?: string;
        engagement_feedback?: string;
        consent_contact?: string;
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

      const {
        nom_cabinet,
        prenom_nom,
        fonction,
        email,
        telephone,
        ville,
        nb_collaborateurs,
        nb_creations,
        process_actuel,
        pain_principal,
        outils_saas,
        outils_saas_autre,
        quand_demarrer,
        engagement_feedback,
        consent_contact,
      } = body;

      // Validation champs requis
      if (!nom_cabinet || !prenom_nom || !fonction || !email || !telephone || !ville) {
        return NextResponse.json(
          { error: "Tous les champs obligatoires doivent être remplis" },
          { status: 400 }
        );
      }

      if (!nb_collaborateurs || !nb_creations || !process_actuel || !pain_principal || !quand_demarrer || !engagement_feedback) {
        return NextResponse.json(
          { error: "Tous les champs de qualification doivent être remplis" },
          { status: 400 }
        );
      }

      if (!consent_contact) {
        return NextResponse.json(
          { error: "Vous devez accepter d'être contacté" },
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

      // Créer le client Supabase Admin
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

      // NOTE: beta_signups table removed - checking in founders_applications instead
      // Vérifier si l'email existe déjà dans founders_applications
      const { data: existing } = await supabaseAdmin
        .from("founders_applications")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "Cet email a déjà soumis une candidature" },
          { status: 400 }
        );
      }

      // Compter le nombre de candidatures actuelles
      const { count } = await supabaseAdmin
        .from("founders_applications")
        .select("*", { count: "exact", head: true });

      const placesRestantes = Math.max(0, 20 - (count || 0));

      if (placesRestantes <= 0) {
        return NextResponse.json(
          { error: "Désolé, toutes les places Founders sont prises" },
          { status: 400 }
        );
      }

      // Préparer les données pour l'insertion
      const candidatureData = {
        prenom: prenom_nom.split(' ')[0] || prenom_nom,
        email: email.trim(),
        cabinet: nom_cabinet.trim(),
        nb_creations_mois: nb_creations || null,
        // Champs supplémentaires stockés dans un JSONB ou une table séparée
        // Pour l'instant, on stocke les infos principales
        created_at: new Date().toISOString(),
      };

      // Insérer la candidature dans founders_applications
      const { error: insertError, data: insertedData } = await supabaseAdmin
        .from("founders_applications")
        .insert(candidatureData)
        .select()
        .single();

      if (insertError) {
        console.error("Erreur insertion candidature:", insertError);
        return NextResponse.json(
          { error: "Erreur lors de l'enregistrement de la candidature" },
          { status: 500 }
        );
      }

      // TODO: Stocker les détails supplémentaires dans une table séparée si nécessaire
      // Pour l'instant, on peut les logger ou les envoyer par email

      // Envoyer l'email de confirmation via Resend (si configuré)
      if (process.env.RESEND_API_KEY) {
        try {
          const outilsSaaSList = outils_saas && outils_saas.length > 0
            ? outils_saas.map(o => `• ${o}`).join('\n')
            : 'Aucun';

          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              // Expéditeur : contact@sferia.fr (domaine vérifié SFERIA)
              from: "LexiGen <contact@sferia.fr>",
              to: email,
              subject: "🎉 Candidature Founders reçue !",
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1E40AF 0%, #2563EB 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Candidature reçue !</h1>
                    </div>
                    <div style="background: #F9FAFB; padding: 30px; border-radius: 0 0 10px 10px;">
                      <p style="font-size: 18px; margin-top: 0;">Merci ${prenom_nom.split(' ')[0]} !</p>
                      <p>Votre candidature au <strong>Programme Founders</strong> a bien été enregistrée.</p>
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1E40AF;">
                        <h2 style="margin-top: 0; color: #1E40AF;">Prochaines étapes :</h2>
                        <p>Nous étudions votre candidature sous <strong>48h</strong>.</p>
                        <p>Si votre profil correspond, nous vous appelons pour un <strong>entretien de 30 min</strong> (sans engagement).</p>
                      </div>
                      <p style="margin-bottom: 0;">À très bientôt,<br><strong>L'équipe LexiGen</strong></p>
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
          // Ne pas faire échouer la candidature si l'email échoue
        }
      }

      // Retourner JSON avec succès (la redirection sera gérée côté client)
      return NextResponse.json(
        {
          success: true,
          message: "Candidature enregistrée avec succès",
          email,
          prenom: prenom_nom.split(' ')[0],
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Erreur inattendue:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Erreur inattendue lors de l'enregistrement de la candidature",
        },
        { status: 500 }
      );
    }
  },
  { limiter: "moderate" } // 100 req/min
);


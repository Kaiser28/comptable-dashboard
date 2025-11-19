import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { withRateLimit } from "@/lib/ratelimit-upstash";
import { Resend } from "resend";

/**
 * Route POST /api/send-form-link
 * Envoie un email au client avec le lien vers son formulaire de collecte d'informations.
 * 
 * Rate limiting : moderate (100 req/min)
 * 
 * Body: { clientId: string }
 * 
 * Retourne : { success: true, emailId: string } ou { error: string }
 */
export const POST = withRateLimit(
  async (request: Request) => {
    try {
      // Vérifier que la clé API Resend est configurée
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.error("RESEND_API_KEY non configurée");
        return NextResponse.json(
          { error: "Configuration email manquante" },
          { status: 500 }
        );
      }

      // Vérifier que NEXT_PUBLIC_SITE_URL est configurée
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!siteUrl) {
        console.error("NEXT_PUBLIC_SITE_URL non configurée");
        return NextResponse.json(
          { error: "Configuration site manquante" },
          { status: 500 }
        );
      }

      // Parser le body
      const body = await request.json().catch((): null => null);
      const clientId = body?.clientId as string | undefined;

      // Validation : clientId requis
      if (!clientId) {
        return NextResponse.json(
          { error: "Paramètre clientId manquant" },
          { status: 400 }
        );
      }

      // Validation : format UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(clientId)) {
        return NextResponse.json(
          { error: "Format clientId invalide (UUID requis)" },
          { status: 400 }
        );
      }

      // Créer le client Supabase avec RLS
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

      // Vérifier l'authentification
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

      // Récupérer le client avec son cabinet (pour le footer)
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select(`
          id,
          nom_entreprise,
          email,
          formulaire_token,
          cabinet_id,
          cabinets!cabinet_id (
            nom_cabinet,
            email_contact
          )
        `)
        .eq("id", clientId)
        .single();

      if (clientError) {
        console.error("Erreur récupération client", clientError);
        return NextResponse.json(
          { error: "Client introuvable ou inaccessible" },
          { status: 404 }
        );
      }

      if (!client) {
        return NextResponse.json(
          { error: "Client introuvable" },
          { status: 404 }
        );
      }

      // Vérifier que le client a un email et un formulaire_token
      if (!client.email) {
        return NextResponse.json(
          { error: "Le client n'a pas d'adresse email configurée" },
          { status: 400 }
        );
      }

      if (!client.formulaire_token) {
        return NextResponse.json(
          { error: "Le client n'a pas de token de formulaire généré" },
          { status: 400 }
        );
      }

      // Générer l'URL du formulaire
      const formUrl = `${siteUrl}/formulaire/${client.formulaire_token}`;

      // Récupérer le nom du cabinet pour le footer
      const cabinetName = (client.cabinets as any)?.nom_cabinet || "Votre expert-comptable";

      // Initialiser Resend
      const resend = new Resend(resendApiKey);

      // Template HTML professionnel avec branding LexiGen
      const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complétez votre dossier de création d'entreprise</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header avec logo LexiGen -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background-color: rgba(255,255,255,0.2); border-radius: 12px; margin-bottom: 16px;">
                <span style="font-size: 28px; font-weight: bold; color: #ffffff;">L</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px;">LexiGen</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Juridique automatisé</p>
            </td>
          </tr>
          
          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1e293b; line-height: 1.3;">
                Bonjour,
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #475569;">
                Votre expert-comptable vous a préparé un dossier pour la création de votre entreprise <strong style="color: #1e40af;">${client.nom_entreprise || 'votre société'}</strong>.
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #475569;">
                Pour finaliser votre dossier, nous avons besoin que vous complétiez le formulaire en ligne ci-dessous. Ce formulaire vous permettra de nous transmettre toutes les informations nécessaires à la création de votre entreprise.
              </p>
              
              <!-- Bouton CTA -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${formUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(30, 64, 175, 0.3); transition: all 0.2s;">
                      Accéder au formulaire
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #64748b;">
                <strong>⏱️ Temps estimé :</strong> 10-15 minutes<br>
                <strong>📋 Documents nécessaires :</strong> Pièce d'identité, justificatif de domicile, RIB
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-left: 4px solid #d97706; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
                  <strong style="color: #d97706;">💡 Astuce :</strong> Vous pouvez sauvegarder votre progression et revenir compléter le formulaire plus tard.
                </p>
              </div>
              
              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #64748b;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="${formUrl}" style="color: #1e40af; text-decoration: underline; word-break: break-all;">${formUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1e293b;">
                ${cabinetName}
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                Cet email a été envoyé par LexiGen, la plateforme SaaS de génération juridique automatisée.<br>
                Si vous n'avez pas demandé ce formulaire, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer externe -->
        <table role="presentation" style="max-width: 600px; width: 100%; margin-top: 20px;">
          <tr>
            <td align="center" style="padding: 0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} LexiGen. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      // Envoyer l'email via Resend
      const result = await resend.emails.send({
        from: "LexiGen <contact@lexigen.fr>",
        to: client.email,
        subject: "Complétez votre dossier de création d'entreprise",
        html: emailHtml,
      });

      // Vérifier le résultat
      if (result.error) {
        console.error("Erreur Resend:", result.error);
        return NextResponse.json(
          {
            error: result.error.message || "Erreur lors de l'envoi de l'email",
          },
          { status: 500 }
        );
      }

      // Succès
      return NextResponse.json(
        {
          success: true,
          emailId: result.data?.id || "unknown",
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Erreur API send-form-link:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Une erreur inattendue est survenue lors de l'envoi de l'email",
        },
        { status: 500 }
      );
    }
  },
  { limiter: "moderate" }
);


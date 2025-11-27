/**
 * Utilitaire d'envoi d'emails avec Resend
 * En mode développement, tous les emails sont redirigés vers TEST_EMAIL
 */

import { Resend } from "resend";

// Expéditeur : contact@sferia.fr (domaine vérifié SFERIA)
const DEFAULT_FROM = "LexiGen <contact@sferia.fr>";

/**
 * Envoie un email via Resend
 * @param to - Adresse email du destinataire
 * @param subject - Sujet de l'email
 * @param html - Contenu HTML de l'email
 * @returns Objet avec success (boolean) et error (string optionnel)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que la clé API est configurée
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Clé API Resend non configurée (RESEND_API_KEY)",
      };
    }

    // Initialiser Resend
    const resend = new Resend(apiKey);

    // En mode développement, rediriger tous les emails vers TEST_EMAIL
    let recipientEmail = to;
    if (process.env.NODE_ENV === "development") {
      const testEmail = process.env.TEST_EMAIL;
      if (testEmail) {
        recipientEmail = testEmail;
      }
    }

    // Envoyer l'email
    const result = await resend.emails.send({
      from: DEFAULT_FROM,
      to: recipientEmail,
      subject: subject,
      html: html,
    });

    // Vérifier le résultat
    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Erreur lors de l'envoi de l'email",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    // Gestion des erreurs
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inattendue est survenue lors de l'envoi de l'email";

    console.error("Erreur Resend:", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Envoie un email avec un template HTML simple
 * @param to - Adresse email du destinataire
 * @param subject - Sujet de l'email
 * @param body - Corps de l'email (sera encapsulé dans un template HTML basique)
 * @returns Objet avec success (boolean) et error (string optionnel)
 */
export async function sendEmailWithTemplate(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          ${body}
        </div>
        <footer style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center;">
          <p>SaaS Statuts Juridiques</p>
        </footer>
      </body>
    </html>
  `;

  return sendEmail(to, subject, html);
}


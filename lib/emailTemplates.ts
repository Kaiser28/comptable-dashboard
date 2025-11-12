/**
 * Templates d'emails pour l'application SaaS Statuts Juridiques
 * HTML inline CSS pour compatibilité maximale avec les clients email
 */

/**
 * Génère le HTML de l'email pour inviter le client à compléter le formulaire
 * @param clientName - Nom de l'entreprise du client
 * @param expertName - Nom de l'expert-comptable
 * @param expertEmail - Email de l'expert-comptable (pour le footer)
 * @param formUrl - URL complète du formulaire à compléter
 * @returns HTML de l'email
 */
export function getFormulaireEmail(
  clientName: string,
  expertName: string,
  expertEmail: string,
  formUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complétez vos informations</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #1e40af; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                SaaS Statuts Juridiques
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                Bonjour ${clientName},
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${expertName}, votre expert-comptable, vous invite à compléter vos informations pour la création de votre société.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Veuillez cliquer sur le bouton ci-dessous pour accéder au formulaire et renseigner les informations nécessaires.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${formUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1e40af; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; text-align: center;">
                      Accéder au formulaire
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :
              </p>
              
              <p style="margin: 0 0 30px 0; color: #1e40af; font-size: 14px; word-break: break-all;">
                ${formUrl}
              </p>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Ce lien est personnel et sécurisé. Il restera valide jusqu'à ce que vous ayez complété le formulaire.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">
                Votre expert-comptable
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ${expertName}<br>
                <a href="mailto:${expertEmail}" style="color: #1e40af; text-decoration: none;">${expertEmail}</a>
              </p>
            </td>
          </tr>
          
          <!-- Bottom text -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                Cet email a été envoyé automatiquement par le système SaaS Statuts Juridiques.<br>
                Si vous n'avez pas demandé ce formulaire, vous pouvez ignorer cet email.
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
}


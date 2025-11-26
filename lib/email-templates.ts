/**
 * Templates d'emails transactionnels pour LexiGen
 * HTML responsive avec inline CSS
 */

const BRAND_COLOR = '#0074d4';
const DASHBOARD_URL = 'https://v0-acpm-pi.vercel.app/dashboard';
const CONTACT_EMAIL = 'contact@lexigen.fr';

/**
 * Template de base pour tous les emails
 */
function getEmailBase(htmlContent: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LexiGen</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #005a9e 100%); border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">LexiGen</h1>
              <p style="margin: 5px 0 0 0; color: #e0f2ff; font-size: 14px;">Génération juridique automatisée</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${htmlContent}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px;">
                LexiGen - Automatisation juridique pour experts-comptables
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                Questions ? Contactez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none;">${CONTACT_EMAIL}</a>
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

/**
 * Email de bienvenue après création de compte
 */
export function welcomeEmail(
  prenom: string,
  nom: string,
  nom_cabinet: string,
  trial_end_date: string
): string {
  const formattedDate = new Date(trial_end_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const htmlContent = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Bienvenue ${prenom} !
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Votre compte <strong>${nom_cabinet}</strong> a été créé avec succès.
    </p>
    
    <div style="background-color: #f0f7ff; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; font-weight: 600;">
        🎉 Vous avez 14 jours d'essai gratuit
      </p>
      <p style="margin: 0; color: #555555; font-size: 14px;">
        Votre essai se termine le <strong>${formattedDate}</strong>
      </p>
    </div>
    
    <p style="margin: 25px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Générez vos premiers statuts juridiques dès maintenant et découvrez comment LexiGen peut vous faire gagner des heures chaque semaine.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${DASHBOARD_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accéder au dashboard →
      </a>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
      À très bientôt,<br>
      <strong style="color: #333333;">L'équipe LexiGen</strong>
    </p>
  `;

  return getEmailBase(htmlContent);
}

/**
 * Email de rappel avant la fin de l'essai
 */
export function trialEndingSoonEmail(
  prenom: string,
  days: number,
  trial_end_date: string
): string {
  const formattedDate = new Date(trial_end_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const htmlContent = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Votre essai se termine bientôt
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Bonjour ${prenom},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Votre période d'essai gratuit se termine dans <strong>${days} jour${days > 1 ? 's' : ''}</strong> (le ${formattedDate}).
    </p>
    
    <div style="background-color: #fff4e6; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.6;">
        <strong>Pour continuer à utiliser LexiGen :</strong> aucune action de votre part n'est requise. Le paiement se fera automatiquement à la fin de votre essai.
      </p>
    </div>
    
    <p style="margin: 25px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Si vous souhaitez annuler votre abonnement, vous pouvez le faire à tout moment depuis votre dashboard.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${DASHBOARD_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Gérer mon abonnement →
      </a>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
      Cordialement,<br>
      <strong style="color: #333333;">L'équipe LexiGen</strong>
    </p>
  `;

  return getEmailBase(htmlContent);
}

/**
 * Email de confirmation après premier paiement réussi
 */
export function firstPaymentSuccessEmail(
  prenom: string,
  amount: string,
  next_billing_date: string
): string {
  const formattedDate = new Date(next_billing_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const htmlContent = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Merci ${prenom} !
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Votre premier paiement de <strong>${amount}€</strong> a été effectué avec succès.
    </p>
    
    <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; font-weight: 600;">
        ✅ Paiement confirmé
      </p>
      <p style="margin: 0; color: #555555; font-size: 14px;">
        Prochain prélèvement prévu le <strong>${formattedDate}</strong>
      </p>
    </div>
    
    <p style="margin: 25px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Vous pouvez maintenant continuer à utiliser LexiGen sans interruption. Merci de votre confiance !
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${DASHBOARD_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accéder au dashboard →
      </a>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
      À très bientôt,<br>
      <strong style="color: #333333;">L'équipe LexiGen</strong>
    </p>
  `;

  return getEmailBase(htmlContent);
}

/**
 * Email d'alerte en cas d'échec de paiement
 */
export function paymentFailedEmail(
  prenom: string,
  retry_date: string
): string {
  const formattedDate = new Date(retry_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const htmlContent = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Problème de paiement
    </h2>
    
    <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Bonjour ${prenom},
    </p>
    
    <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Nous n'avons pas pu traiter votre paiement. Votre carte bancaire a peut-être expiré ou les fonds sont insuffisants.
    </p>
    
    <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #333333; font-size: 15px; font-weight: 600;">
        ⚠️ Action requise
      </p>
      <p style="margin: 0; color: #555555; font-size: 14px;">
        Nous réessaierons automatiquement le <strong>${formattedDate}</strong>. Veuillez vérifier vos informations de paiement avant cette date.
      </p>
    </div>
    
    <p style="margin: 25px 0; color: #555555; font-size: 16px; line-height: 1.6;">
      Pour éviter toute interruption de service, mettez à jour vos informations de paiement dès maintenant.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${DASHBOARD_URL}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Mettre à jour mon paiement →
      </a>
    </div>
    
    <p style="margin: 25px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
      Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:${CONTACT_EMAIL}" style="color: ${BRAND_COLOR}; text-decoration: none;">${CONTACT_EMAIL}</a>.
    </p>
    
    <p style="margin: 15px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
      Cordialement,<br>
      <strong style="color: #333333;">L'équipe LexiGen</strong>
    </p>
  `;

  return getEmailBase(htmlContent);
}


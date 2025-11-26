import { Resend } from 'resend';

/**
 * Instance Resend pour l'envoi d'emails transactionnels
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Options pour l'envoi d'email
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Envoie un email transactionnel via Resend
 * 
 * @param options - Options d'envoi (to, subject, html, from)
 * @returns Promise avec l'ID de l'email envoyé ou null en cas d'erreur
 */
export async function sendEmail(options: EmailOptions): Promise<string | null> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('[EMAIL] RESEND_API_KEY manquante dans les variables d\'environnement');
      return null;
    }

    const result = await resend.emails.send({
      from: options.from || 'LexiGen <contact@lexigen.fr>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error('[EMAIL] Erreur Resend:', result.error);
      return null;
    }

    console.log('[EMAIL] Email envoyé avec succès:', result.data?.id);
    return result.data?.id || null;

  } catch (error: any) {
    console.error('[EMAIL] Erreur inattendue lors de l\'envoi:', error);
    return null;
  }
}


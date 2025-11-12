import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";

/**
 * API route pour envoyer des emails via Resend
 * POST /api/send-email
 * Body: { to: string, subject: string, html: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html } = body;

    // Validation
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: "Paramètres manquants (to, subject, html)" },
        { status: 400 }
      );
    }

    // Envoyer l'email
    const result = await sendEmail(to, subject, html);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API send-email:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'envoi de l'email",
      },
      { status: 500 }
    );
  }
}


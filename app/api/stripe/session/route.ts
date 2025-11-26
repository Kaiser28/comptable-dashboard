import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

/**
 * GET /api/stripe/session?session_id=xxx
 * Récupère les infos d'une session Stripe après paiement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id requis' },
        { status: 400 }
      );
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session introuvable' },
        { status: 404 }
      );
    }

    // Extraire les données importantes
    const subscription: any = session.subscription;
    
    return NextResponse.json({
      email: session.customer_details?.email || session.metadata?.email,
      nom_cabinet: session.metadata?.nom_cabinet,
      customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      subscription_id: typeof subscription === 'string' ? subscription : subscription?.id,
      trial_end: subscription?.trial_end,
      status: subscription?.status,
    });

  } catch (error: any) {
    console.error('[STRIPE SESSION] Erreur:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur récupération session' },
      { status: 500 }
    );
  }
}

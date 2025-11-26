import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

/**
 * POST /api/stripe/create-checkout-session-simple
 * Crée une session Stripe SANS créer de compte Supabase d'abord
 * Le compte sera créé après paiement via webhook
 * 
 * Body attendu :
 * {
 *   email: string,
 *   nom_cabinet: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nom_cabinet } = body;

    if (!email || !nom_cabinet) {
      return NextResponse.json(
        { error: 'Email et nom du cabinet requis' },
        { status: 400 }
      );
    }

    // Créer la session Checkout avec trial 14 jours
    // On stocke les infos dans metadata pour les récupérer dans le webhook
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email, // Stripe crée le customer automatiquement
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          nom_cabinet,
          email,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?checkout=cancel`,
      metadata: {
        nom_cabinet,
        email,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('[STRIPE CHECKOUT SIMPLE] Erreur:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur Stripe' },
      { status: 500 }
    );
  }
}


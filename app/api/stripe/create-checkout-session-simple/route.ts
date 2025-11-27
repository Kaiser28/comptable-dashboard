import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeSecretKey, getStripePriceId } from '@/lib/stripe-config';
import { getSiteUrl } from '@/lib/site-config';

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
    // Initialiser Stripe dans la fonction POST (pas au top level)
    // Utiliser la configuration selon l'environnement
    let stripe: Stripe;
    try {
      const secretKey = getStripeSecretKey();
      stripe = new Stripe(secretKey, {
        apiVersion: '2025-11-17.clover',
        typescript: true,
      });
    } catch (configError: any) {
      console.error('[STRIPE CHECKOUT SIMPLE] Erreur configuration Stripe:', configError);
      return NextResponse.json(
        { error: 'Erreur de configuration Stripe' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, nom_cabinet } = body;

    if (!email || !nom_cabinet) {
      return NextResponse.json(
        { error: 'Email et nom du cabinet requis' },
        { status: 400 }
      );
    }

    // Récupérer le Price ID selon l'environnement
    let priceId: string;
    try {
      priceId = getStripePriceId();
    } catch (configError: any) {
      console.error('[STRIPE CHECKOUT SIMPLE] Erreur récupération Price ID:', configError);
      return NextResponse.json(
        { error: 'Erreur de configuration Stripe Price ID' },
        { status: 500 }
      );
    }

    // Récupérer l'URL de base selon l'environnement
    let siteUrl: string;
    try {
      siteUrl = getSiteUrl();
    } catch (configError: any) {
      console.error('[STRIPE CHECKOUT SIMPLE] Erreur récupération Site URL:', configError);
      return NextResponse.json(
        { error: 'Erreur de configuration Site URL' },
        { status: 500 }
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
          price: priceId,
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
      success_url: `${siteUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
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


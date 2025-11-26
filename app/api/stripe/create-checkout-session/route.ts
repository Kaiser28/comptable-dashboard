import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/stripe/create-checkout-session
 * Crée une session Stripe Checkout avec trial 14 jours
 * 
 * Body attendu :
 * {
 *   cabinet_id: string,
 *   email: string,
 *   nom_cabinet: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Parser le body
    const body = await request.json();
    const { cabinet_id, email, nom_cabinet } = body;

    if (!cabinet_id || !email || !nom_cabinet) {
      return NextResponse.json(
        { error: 'Données manquantes (cabinet_id, email, nom_cabinet requis)' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur appartient bien à ce cabinet
    const { data: cabinet, error: cabinetError } = await supabase
      .from('cabinets')
      .select('id, stripe_customer_id')
      .eq('id', cabinet_id)
      .single();

    if (cabinetError || !cabinet) {
      return NextResponse.json(
        { error: 'Cabinet introuvable' },
        { status: 404 }
      );
    }

    // Si le cabinet a déjà un customer Stripe, on le réutilise
    let customerId = cabinet.stripe_customer_id;

    if (!customerId) {
      // Créer un nouveau customer Stripe
      const customer = await stripe.customers.create({
        email,
        name: nom_cabinet,
        metadata: {
          cabinet_id,
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Mettre à jour le cabinet avec le customer_id
      await supabase
        .from('cabinets')
        .update({ stripe_customer_id: customerId })
        .eq('id', cabinet_id);
    }

    // Créer la session Checkout avec trial 14 jours
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14, // ← TRIAL 14 JOURS ICI
        metadata: {
          cabinet_id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=cancel`,
      metadata: {
        cabinet_id,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('[STRIPE CHECKOUT] Erreur:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la création de la session Stripe' },
      { status: 500 }
    );
  }
}


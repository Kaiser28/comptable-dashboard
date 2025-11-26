import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/create-account
 * Crée un compte Beta Founder après paiement Stripe
 * Utilise le Service Role Key pour bypass les restrictions RLS et triggers
 * 
 * Body attendu :
 * {
 *   email: string,
 *   password: string,
 *   nom_cabinet: string,
 *   prenom: string,
 *   nom: string,
 *   stripe_customer_id: string,
 *   stripe_subscription_id?: string,
 *   trial_end_date?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      nom_cabinet,
      prenom,
      nom,
      stripe_customer_id,
      stripe_subscription_id,
      trial_end_date,
    } = body;

    // Validation des champs requis
    if (!email || !password || !nom_cabinet || !prenom || !nom || !stripe_customer_id) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validation email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Validation mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Créer le client Supabase Admin avec Service Role Key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(u => u.email === email);

    if (userExists) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // 2. Vérifier si le cabinet existe déjà (par email ou stripe_customer_id)
    const { data: existingCabinet } = await supabaseAdmin
      .from('cabinets')
      .select('id')
      .or(`email.eq.${email},stripe_customer_id.eq.${stripe_customer_id}`)
      .maybeSingle();

    if (existingCabinet) {
      return NextResponse.json(
        { error: 'Un cabinet avec cet email ou ce customer Stripe existe déjà' },
        { status: 400 }
      );
    }

    // 3. Créer l'utilisateur via Admin API (bypass les triggers et RLS)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // IMPORTANT : confirmer l'email automatiquement
      user_metadata: {
        prenom,
        nom,
        nom_cabinet,
      },
    });

    if (authError) {
      console.error('[CREATE ACCOUNT] Erreur création utilisateur:', authError);
      return NextResponse.json(
        { error: `Erreur création utilisateur: ${authError.message}` },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Erreur : userId non retourné' },
        { status: 500 }
      );
    }

    // 4. Créer le cabinet avec les infos Stripe
    const { data: cabinet, error: cabinetError } = await supabaseAdmin
      .from('cabinets')
      .insert({
        nom: nom_cabinet,
        email: email,
        stripe_customer_id: stripe_customer_id,
        stripe_subscription_id: stripe_subscription_id || null,
        subscription_status: 'trialing',
        trial_end_date: trial_end_date || null,
      })
      .select()
      .single();

    if (cabinetError) {
      console.error('[CREATE ACCOUNT] Erreur création cabinet:', cabinetError);
      
      // Si erreur de création cabinet, supprimer l'utilisateur créé pour éviter les orphelins
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: `Erreur création cabinet: ${cabinetError.message}` },
        { status: 500 }
      );
    }

    // 5. Créer l'expert_comptable lié au cabinet (FK cabinet_id obligatoire)
    const { error: ecError } = await supabaseAdmin
      .from('experts_comptables')
      .insert({
        cabinet_id: cabinet.id,
        user_id: userId,
        prenom: prenom,
        nom: nom,
        email: email,
        role: 'admin',
      });

    if (ecError) {
      console.error('[CREATE ACCOUNT] Erreur création expert_comptable:', ecError);
      
      // Si erreur de création expert_comptable, nettoyer : supprimer cabinet et utilisateur
      await supabaseAdmin.from('cabinets').delete().eq('id', cabinet.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: `Erreur création expert_comptable: ${ecError.message}` },
        { status: 500 }
      );
    }

    // 6. Succès : retourner les données de l'utilisateur créé
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
        cabinet_id: cabinet.id,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[CREATE ACCOUNT] Erreur inattendue:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Erreur inattendue lors de la création du compte',
      },
      { status: 500 }
    );
  }
}


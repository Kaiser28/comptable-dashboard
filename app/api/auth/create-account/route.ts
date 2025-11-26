import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { welcomeEmail } from '@/lib/email-templates';

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

    // Validation des champs requis avec vérification stricte
    if (!email || !password || !nom_cabinet || !prenom || !nom || !stripe_customer_id) {
      console.error('[CREATE ACCOUNT] Champs manquants:', {
        email: !!email,
        password: !!password,
        nom_cabinet: !!nom_cabinet,
        prenom: !!prenom,
        nom: !!nom,
        stripe_customer_id: !!stripe_customer_id,
      });
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validation stricte : s'assurer que les valeurs ne sont pas des chaînes vides
    if (
      email.trim() === '' ||
      password.trim() === '' ||
      nom_cabinet.trim() === '' ||
      prenom.trim() === '' ||
      nom.trim() === '' ||
      stripe_customer_id.trim() === ''
    ) {
      console.error('[CREATE ACCOUNT] Champs vides détectés');
      return NextResponse.json(
        { error: 'Tous les champs doivent être renseignés' },
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
    // Vérification stricte pour éviter les cabinets zombies
    const { data: existingCabinetByEmail, error: errorEmail } = await supabaseAdmin
      .from('cabinets')
      .select('id, nom, stripe_customer_id, email')
      .eq('email', email)
      .maybeSingle();

    if (errorEmail) {
      console.error('[CREATE ACCOUNT] Erreur vérification cabinet par email:', errorEmail);
    }

    const { data: existingCabinetByStripe, error: errorStripe } = await supabaseAdmin
      .from('cabinets')
      .select('id, nom, stripe_customer_id, email')
      .eq('stripe_customer_id', stripe_customer_id)
      .maybeSingle();

    if (errorStripe) {
      console.error('[CREATE ACCOUNT] Erreur vérification cabinet par stripe_customer_id:', errorStripe);
    }

    if (existingCabinetByEmail) {
      console.error('[CREATE ACCOUNT] Cabinet existant trouvé par email:', existingCabinetByEmail);
      return NextResponse.json(
        { error: 'Un cabinet avec cet email existe déjà' },
        { status: 400 }
      );
    }

    if (existingCabinetByStripe) {
      console.error('[CREATE ACCOUNT] Cabinet existant trouvé par stripe_customer_id:', existingCabinetByStripe);
      return NextResponse.json(
        { error: 'Un cabinet avec ce customer Stripe existe déjà' },
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

    // 4. Créer le cabinet avec TOUTES les infos Stripe en une seule insertion
    // Préparer les données avec validation stricte
    const cabinetData = {
      nom: nom_cabinet.trim(), // Colonne 'nom' dans la table, pas 'nom_cabinet'
      email: email.trim(),
      stripe_customer_id: stripe_customer_id.trim(),
      stripe_subscription_id: stripe_subscription_id?.trim() || null,
      subscription_status: 'trialing' as const,
      trial_end_date: trial_end_date ? new Date(trial_end_date).toISOString() : null,
    };

    // Log des données avant insertion pour debug
    console.log('[CREATE ACCOUNT] Données cabinet à insérer:', {
      nom: cabinetData.nom,
      email: cabinetData.email,
      stripe_customer_id: cabinetData.stripe_customer_id,
      stripe_subscription_id: cabinetData.stripe_subscription_id,
      subscription_status: cabinetData.subscription_status,
      trial_end_date: cabinetData.trial_end_date,
    });

    // Insertion unique avec toutes les données
    const { data: cabinet, error: cabinetError } = await supabaseAdmin
      .from('cabinets')
      .insert(cabinetData)
      .select()
      .single();

    if (cabinetError) {
      console.error('[CREATE ACCOUNT] Erreur création cabinet:', {
        message: cabinetError.message,
        details: cabinetError.details,
        hint: cabinetError.hint,
        code: cabinetError.code,
      });
      
      // Si erreur de duplicate key, logger et retourner erreur claire
      if (cabinetError.code === '23505') {
        console.error('[CREATE ACCOUNT] Erreur duplicate key - cabinet existe déjà');
        // Supprimer l'utilisateur créé pour éviter les orphelins
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: 'Un cabinet avec ces informations existe déjà' },
          { status: 400 }
        );
      }
      
      // Si erreur de création cabinet, supprimer l'utilisateur créé pour éviter les orphelins
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: `Erreur création cabinet: ${cabinetError.message}` },
        { status: 500 }
      );
    }

    // Vérifier que le cabinet a bien été créé avec toutes les données
    if (!cabinet || !cabinet.id) {
      console.error('[CREATE ACCOUNT] Cabinet créé mais id manquant');
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erreur : cabinet créé mais id manquant' },
        { status: 500 }
      );
    }

    // Vérifier que les données critiques sont présentes
    if (!cabinet.nom || !cabinet.email || !cabinet.stripe_customer_id) {
      console.error('[CREATE ACCOUNT] Cabinet créé avec données incomplètes:', cabinet);
      // Nettoyer : supprimer le cabinet incomplet et l'utilisateur
      await supabaseAdmin.from('cabinets').delete().eq('id', cabinet.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erreur : cabinet créé avec des données incomplètes' },
        { status: 500 }
      );
    }

    console.log('[CREATE ACCOUNT] Cabinet créé avec succès:', {
      id: cabinet.id,
      nom: cabinet.nom,
      email: cabinet.email,
      stripe_customer_id: cabinet.stripe_customer_id,
    });

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

    // 6. Envoyer l'email de bienvenue (ne pas bloquer si échec)
    if (process.env.NODE_ENV === 'production' && trial_end_date) {
      try {
        const emailHtml = welcomeEmail(prenom, nom, nom_cabinet, trial_end_date);
        const emailId = await sendEmail({
          to: email,
          subject: 'Bienvenue sur LexiGen ! 🎉',
          html: emailHtml,
        });
        if (emailId) {
          console.log('[CREATE-ACCOUNT] Email de bienvenue envoyé:', emailId);
        } else {
          console.warn('[CREATE-ACCOUNT] Échec envoi email de bienvenue (non bloquant)');
        }
      } catch (emailError: any) {
        console.error('[CREATE-ACCOUNT] Erreur envoi email de bienvenue (non bloquant):', emailError);
        // Ne pas faire échouer la création si l'email échoue
      }
    }

    // 7. Succès : retourner les données de l'utilisateur créé
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


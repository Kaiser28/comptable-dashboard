import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { generatePVAGOrdinaire, type AGOrdinaireData } from "@/lib/generatePVAGOrdinaire";

export async function POST(request: Request) {
  try {
    console.log('🚀 API generate-ag-ordinaire appelée');

    const body = await request.json().catch((): null => null);
    const acteId = (body?.acteId || body?.acte_id) as string | undefined;

    console.log('📋 acteId:', acteId);

    if (!acteId) {
      return NextResponse.json(
        { success: false, error: 'acteId manquant' },
        { status: 400 }
      );
    }

    // Vérifier le token dans le header Authorization (pour tests) ou cookies (pour navigateur)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let supabase;
    let user;
    let authError;

    if (token) {
      // Utiliser le token du header pour les tests automatisés
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      authError = result.error;
    } else {
      // Utiliser les cookies pour l'authentification navigateur
      const cookieStore = await cookies();
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );
      const result = await supabase.auth.getUser();
      user = result.data.user;
      authError = result.error;
    }

    if (authError || !user) {
      console.error('❌ Authentification échouée:', authError);
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 1. Récupérer l'acte avec client
    console.log('🔍 Récupération acte...');
    const { data: acte, error: acteError } = await supabase
      .from('actes_juridiques')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', acteId)
      .single();

    if (acteError || !acte) {
      console.error('❌ Erreur récupération acte:', acteError);
      return NextResponse.json(
        { success: false, error: 'Acte introuvable' },
        { status: 404 }
      );
    }

    if (acte.type !== 'ag_ordinaire') {
      return NextResponse.json(
        { success: false, error: 'Ce générateur est réservé aux actes d\'AG Ordinaire' },
        { status: 400 }
      );
    }

    const client = acte.client as any;
    console.log('✅ Acte récupéré:', client?.nom_entreprise || 'Client inconnu');

    // 2. Récupérer les associés
    console.log('🔍 Récupération associés...');
    const { data: associes, error: associesError } = await supabase
      .from('associes')
      .select('*')
      .eq('client_id', acte.client_id);

    if (associesError) {
      console.error('❌ Erreur récupération associés:', associesError);
      return NextResponse.json(
        { success: false, error: 'Erreur récupération associés' },
        { status: 500 }
      );
    }

    console.log('✅ Associés récupérés:', associes?.length || 0);

    // Le président est stocké dans la table clients, pas dans associes
    console.log('👔 Président:', client.president_prenom, client.president_nom);

    // Validations des champs requis avec messages clairs
    if (!acte.date_ag) {
      return NextResponse.json(
        {
          success: false,
          error: 'La date de l\'assemblée générale est requise. Veuillez remplir ce champ dans l\'acte.',
        },
        { status: 400 }
      );
    }

    if (!acte.exercice_clos) {
      return NextResponse.json(
        {
          success: false,
          error: 'L\'exercice clos est requis. Veuillez indiquer l\'exercice concerné (ex: "2024").',
        },
        { status: 400 }
      );
    }

    if (acte.resultat_exercice === null || acte.resultat_exercice === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le résultat de l\'exercice est requis. Veuillez indiquer le bénéfice ou la perte de l\'exercice.',
        },
        { status: 400 }
      );
    }

    if (!acte.affectation_resultat) {
      return NextResponse.json(
        {
          success: false,
          error: 'L\'affectation du résultat est requise. Veuillez sélectionner comment le résultat sera affecté.',
        },
        { status: 400 }
      );
    }

    if (!client.president_nom || !client.president_prenom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Président manquant : Allez dans la fiche client et remplissez "Président (nom/prénom)".',
        },
        { status: 400 }
      );
    }

    if (!associes || associes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucun associé trouvé pour cette société. Ajoutez au moins un associé dans la fiche client.',
        },
        { status: 400 }
      );
    }

    // Validation des votes
    const nbActionsTotal = associes.reduce((sum, a) => sum + (a.nombre_actions || 0), 0);
    const totalVotes = (acte.votes_pour_comptes || 0) + (acte.votes_contre_comptes || 0) + (acte.votes_abstention_comptes || 0);

    if (acte.votes_pour_comptes === null || acte.votes_pour_comptes === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Le nombre de votes POUR est requis. Veuillez remplir ce champ dans l\'acte.',
        },
        { status: 400 }
      );
    }

    if (totalVotes !== nbActionsTotal) {
      return NextResponse.json(
        {
          success: false,
          error: `Total des votes (${totalVotes}) différent du nombre d'actions (${nbActionsTotal}). Modifiez l'acte pour corriger.`,
        },
        { status: 400 }
      );
    }

    // Formater la date AG en français
    const dateAGFormatee = new Date(acte.date_ag).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Formater l'heure AG (convertir de HH:mm à HHhmm)
    let heureAG = '14h00';
    if (acte.heure_ag) {
      const [hours, minutes] = acte.heure_ag.split(':');
      heureAG = `${hours}h${minutes || '00'}`;
    }

    // Construire le RCS
    const rcs = client.ville_rcs
      ? `RCS ${client.ville_rcs} ${client.siret || ''}`
      : client.siret
      ? `RCS ${client.siret}`
      : `${client.ville || ''} (en cours)`;

    // 3. Mapper vers AGOrdinaireData
    const agData: AGOrdinaireData = {
      denomination: client.nom_entreprise || '',
      forme_juridique: client.forme_juridique || '',
      capital_social: client.capital_social || 0,
      siege_social: client.adresse || '',
      rcs: rcs,

      date_ag: dateAGFormatee,
      heure_ag: heureAG,
      lieu_ag: acte.lieu_ag || 'au siège social',
      exercice_clos: acte.exercice_clos || '',

      resultat_exercice: acte.resultat_exercice || 0,
      affectation_resultat: acte.affectation_resultat as
        | 'report_nouveau'
        | 'reserves'
        | 'dividendes'
        | 'mixte',
      montant_dividendes: acte.montant_dividendes || undefined,
      montant_reserves: acte.montant_reserves || undefined,
      montant_report: acte.montant_report || undefined,

      president_nom: client.president_nom || '',
      president_prenom: client.president_prenom || '',
      associes: (associes || []).map((a: any) => ({
        nom: a.nom || '',
        prenom: a.prenom || '',
        nb_actions: a.nombre_actions || 0,
        present: true, // Par défaut tous présents
      })),

      quitus_president: acte.quitus_president ?? true,
      votes_pour_comptes: acte.votes_pour_comptes || 0,
      votes_contre_comptes: acte.votes_contre_comptes || 0,
      votes_abstention_comptes: acte.votes_abstention_comptes || 0,
    };

    console.log('📝 Données mappées, génération du document...');

    // 4. Générer le document
    const generationResult = await generatePVAGOrdinaire(agData);

    // Vérifier si c'est une erreur
    if (typeof generationResult === 'object' && 'success' in generationResult && !generationResult.success) {
      console.error('❌ Erreur génération:', generationResult.error);
      return NextResponse.json(
        { success: false, error: generationResult.error },
        { status: 400 }
      );
    }

    // Extraire le buffer
    let docBuffer: Buffer;
    if (typeof generationResult === 'object' && 'buffer' in generationResult) {
      docBuffer = Buffer.from(new Uint8Array(generationResult.buffer as ArrayBuffer));
    } else if (Buffer.isBuffer(generationResult)) {
      docBuffer = generationResult;
    } else {
      docBuffer = Buffer.from(new Uint8Array(generationResult as unknown as ArrayBuffer));
    }

    if (!docBuffer) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la génération du document. Aucun buffer retourné.' },
        { status: 500 }
      );
    }

    console.log('✅ Document généré, taille:', docBuffer.length, 'bytes');

    // 5. Upload dans Storage
    const nomEntrepriseSafe = (client.nom_entreprise || 'document')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    const fileName = `pv-ag-ordinaire-${nomEntrepriseSafe}-${Date.now()}.docx`;

    console.log('☁️ Upload fichier:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, docBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError);
      // Si le bucket n'existe pas ou erreur upload, on retourne quand même le buffer pour téléchargement direct
      console.log('⚠️ Upload échoué, retour du buffer directement');
      const nomEntrepriseSafe2 = (client.nom_entreprise || 'document')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const dateActe = acte.date_ag
        ? new Date(acte.date_ag).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      return new Response(new Uint8Array(docBuffer), {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="PV_AG_Ordinaire_${nomEntrepriseSafe2}_${dateActe}.docx"`,
        },
      });
    }

    console.log('✅ Fichier uploadé:', uploadData.path);

    // 6. Créer URL publique
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

    const documentUrl = urlData.publicUrl;

    console.log('🔗 URL publique:', documentUrl);

    // 7. Insérer dans documents_generes (si la table existe)
    console.log('💾 Insertion dans documents_generes...');

    const { error: insertError } = await supabase.from('documents_generes').insert({
      client_id: acte.client_id,
      type_document: 'pv_ag_ordinaire',
      nom_fichier: fileName,
      url: documentUrl,
    });

    if (insertError) {
      console.error('⚠️ Erreur insertion documents_generes:', insertError);
      // Non bloquant, on continue
    } else {
      console.log('✅ Document enregistré dans documents_generes');
    }

    console.log('🎉 Génération terminée avec succès');

    return NextResponse.json({
      success: true,
      documentUrl,
    });
  } catch (error: any) {
    console.error('❌ ERREUR GLOBALE:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inattendue',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/verify-siret
 * Vérifie si un SIRET correspond à un expert-comptable via l'API Pappers
 * 
 * Body attendu :
 * {
 *   siret: string (14 chiffres)
 * }
 * 
 * Retourne :
 * {
 *   valid: boolean,
 *   est_expert_comptable: boolean,
 *   nom_entreprise?: string,
 *   adresse?: string,
 *   code_naf?: string,
 *   libelle_naf?: string,
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siret } = body;

    // Validation format SIRET
    if (!siret || !/^\d{14}$/.test(siret)) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'SIRET invalide (14 chiffres requis)' 
        },
        { status: 400 }
      );
    }

    // Vérifier que la clé API Pappers est configurée
    if (!process.env.PAPPERS_API_KEY) {
      console.error('[VERIFY SIRET] PAPPERS_API_KEY manquante');
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Configuration API Pappers manquante' 
        },
        { status: 500 }
      );
    }

    // Appel API Pappers
    const response = await fetch(
      `https://api.pappers.fr/v2/entreprise?siret=${siret}&api_token=${process.env.PAPPERS_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Si l'API retourne 404, l'entreprise n'existe pas
      if (response.status === 404) {
        return NextResponse.json({
          valid: false,
          error: 'Entreprise non trouvée',
        });
      }
      
      // Autres erreurs API
      const errorText = await response.text();
      console.error('[VERIFY SIRET] Erreur API Pappers:', response.status, errorText);
      throw new Error(`Erreur API Pappers: ${response.status}`);
    }

    const data = await response.json();

    // Vérifier si l'entreprise existe
    if (!data || data.statut_diffusion === 'P') {
      return NextResponse.json({
        valid: false,
        error: 'Entreprise non trouvée ou données non diffusibles',
      });
    }

    // Codes NAF pour experts-comptables
    // 6920Z = Activités comptables
    // 69.20Z = Activités comptables
    const CODE_NAF_EXPERT_COMPTABLE = ['6920Z', '69.20Z'];
    
    const codeNaf = data.code_naf || '';
    const estExpertComptable = CODE_NAF_EXPERT_COMPTABLE.includes(codeNaf);

    // Construire l'adresse complète
    const adresseParts = [];
    if (data.siege?.adresse_ligne_1) {
      adresseParts.push(data.siege.adresse_ligne_1);
    }
    if (data.siege?.code_postal) {
      adresseParts.push(data.siege.code_postal);
    }
    if (data.siege?.ville) {
      adresseParts.push(data.siege.ville);
    }
    const adresse = adresseParts.length > 0 ? adresseParts.join(', ') : undefined;

    return NextResponse.json({
      valid: true,
      est_expert_comptable: estExpertComptable,
      nom_entreprise: data.nom_entreprise || data.denomination,
      adresse,
      code_naf: codeNaf || undefined,
      libelle_naf: data.libelle_code_naf || undefined,
    });

  } catch (error: any) {
    console.error('[VERIFY SIRET] Erreur:', error);
    return NextResponse.json(
      { 
        valid: false, 
        error: error.message || 'Erreur lors de la vérification du SIRET' 
      },
      { status: 500 }
    );
  }
}


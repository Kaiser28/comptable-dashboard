/**
 * Helper pour interroger l'API Pappers et enrichir les données entreprise
 */

export interface EntrepriseData {
  nom_entreprise: string;
  forme_juridique: string;
  categorie_juridique?: string;
  adresse_siege: {
    numero_voie?: string;
    type_voie?: string;
    libelle_voie?: string;
    code_postal?: string;
    ville?: string;
    pays?: string;
    adresse_ligne_1?: string;
  };
  adresse_ligne_1?: string;
  siret: string;
  code_naf: string;
  date_creation: string; // Format ISO
  capital_social: number;
  objet_social: string;
}

interface PappersResponse {
  siret?: string;
  denomination?: string;
  nom_complet?: string;
  forme_juridique?: string;
  categorie_juridique?: string;
  adresse_siege?: {
    numero_voie?: string;
    type_voie?: string;
    nom_voie?: string;
    code_postal?: string;
    ville?: string;
    pays?: string;
    adresse_ligne_1?: string;
  };
  siege?: {
    numero_voie?: string;
    type_voie?: string;
    libelle_voie?: string;
    code_postal?: string;
    ville?: string;
    adresse_ligne_1?: string;
  };
  code_naf?: string;
  date_creation?: string;
  capital?: number;
  capital_formate?: string;
  objet_social?: string;
  denomination_usuelle?: string;
  tranche_effectif?: string;
  statut?: string;
  error?: string;
  message?: string;
}

/**
 * Recherche une entreprise par son SIRET via l'API Pappers
 * @param siret - Numéro SIRET de l'entreprise (14 chiffres)
 * @returns Données structurées de l'entreprise
 * @throws Error si l'entreprise n'est pas trouvée ou en cas d'erreur API
 */
export async function searchEntreprise(siret: string): Promise<EntrepriseData> {
  // Validation du SIRET
  const cleanSiret = siret.replace(/\s/g, "");
  if (!/^\d{14}$/.test(cleanSiret)) {
    throw new Error("Le SIRET doit contenir exactement 14 chiffres");
  }

  const apiKey = process.env.NEXT_PUBLIC_PAPPERS_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API Pappers non configurée (NEXT_PUBLIC_PAPPERS_API_KEY)");
  }

  const url = `https://api.pappers.fr/v2/entreprise?api_token=${apiKey}&siret=${cleanSiret}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Vérifier le status HTTP
    if (response.status === 404) {
      throw new Error("Entreprise introuvable");
    }

    if (response.status === 429) {
      throw new Error("Limite API atteinte. Veuillez réessayer plus tard.");
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("Erreur d'authentification API Pappers");
    }

    if (!response.ok) {
      throw new Error(`Erreur API Pappers: ${response.status} ${response.statusText}`);
    }

    const data: PappersResponse = await response.json();

    // Vérifier si l'API retourne une erreur dans le body
    if (data.error || data.message) {
      const errorMessage = data.error || data.message || "Erreur API Pappers";
      if (errorMessage.toLowerCase().includes("introuvable") || errorMessage.toLowerCase().includes("not found")) {
        throw new Error("Entreprise introuvable");
      }
      throw new Error(`Erreur API Pappers: ${errorMessage}`);
    }

    // Vérifier que les données essentielles sont présentes
    if (!data.siret && !data.denomination && !data.nom_complet) {
      throw new Error("Entreprise introuvable");
    }

    // Mapper les données Pappers vers notre structure
    const entrepriseData: EntrepriseData = {
      nom_entreprise: data.denomination || data.nom_complet || data.denomination_usuelle || "",
      forme_juridique: data.forme_juridique || "",
      categorie_juridique: data.categorie_juridique || undefined,
      adresse_siege: {
        numero_voie: data.siege?.numero_voie || undefined,
        type_voie: data.siege?.type_voie || undefined,
        libelle_voie: data.siege?.libelle_voie || undefined,
        code_postal: data.siege?.code_postal || undefined,
        ville: data.siege?.ville || undefined,
        pays: "France",
        adresse_ligne_1: data.siege?.adresse_ligne_1 || undefined,
      },
      adresse_ligne_1: data.siege?.adresse_ligne_1 || undefined,
      siret: data.siret || cleanSiret,
      code_naf: data.code_naf || "",
      date_creation: data.date_creation || "",
      capital_social: parseCapitalSocial(data.capital, data.capital_formate),
      objet_social: data.objet_social || data.denomination || "",
    };

    // Validation des champs requis
    if (!entrepriseData.nom_entreprise) {
      throw new Error("Données entreprise incomplètes: nom_entreprise manquant");
    }

    return entrepriseData;
  } catch (error) {
    // Réutiliser les erreurs déjà formatées
    if (error instanceof Error) {
      throw error;
    }

    // Erreur réseau ou autre
    console.error("Erreur lors de l'appel API Pappers:", error);
    throw new Error("Erreur API Pappers: Impossible de contacter le service");
  }
}

/**
 * Parse le capital social depuis différents formats Pappers
 * @param capital - Capital numérique (peut être null)
 * @param capitalFormate - Capital formaté (ex: "10 000 €")
 * @returns Capital en nombre (0 si non trouvé)
 */
function parseCapitalSocial(capital: number | null | undefined, capitalFormate?: string): number {
  // Si capital numérique disponible, l'utiliser
  if (capital !== null && capital !== undefined && !isNaN(capital)) {
    return Math.round(capital);
  }

  // Sinon, parser depuis le format string
  if (capitalFormate) {
    // Extraire les chiffres du format "10 000 €" ou "10,000 €"
    const cleaned = capitalFormate.replace(/[^\d,.]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      return Math.round(parsed);
    }
  }

  return 0;
}


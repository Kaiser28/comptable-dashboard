/**
 * Runner pour tester la génération de documents
 * 
 * Ce fichier contient les fonctions utilitaires pour tester
 * la génération de documents Word pour différents types d'actes.
 */

export interface DocumentGenerationTest {
  acteId: string;
  type: string;
  apiRoute: string;
}

const API_ROUTES: Record<string, string> = {
  'augmentation_capital': '/api/generate-augmentation-capital',
  'reduction_capital': '/api/generate-reduction-capital',
  'ag_ordinaire': '/api/generate-ag-ordinaire',
  'cession_actions': '/api/generate-cession-actions',
  'ordre_mouvement_titres': '/api/generate-ordre-mouvement'
};

export function getApiRoute(type: string): string | null {
  return API_ROUTES[type] || null;
}

export async function testGenerateDocument(
  acteId: string,
  type: string,
  baseUrl: string = 'http://localhost:3000'
): Promise<{ success: boolean; size?: number; error?: string }> {
  const apiRoute = getApiRoute(type);

  if (!apiRoute) {
    return { success: false, error: 'API route non implémentée' };
  }

  try {
    const response = await fetch(`${baseUrl}${apiRoute}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acte_id: acteId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const blob = await response.blob();
    return { success: true, size: blob.size };
  } catch (error: any) {
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      return { success: false, error: 'Serveur Next.js non démarré' };
    }
    return { success: false, error: error.message || String(error) };
  }
}


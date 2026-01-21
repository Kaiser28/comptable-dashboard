/**
 * Script de test du rate limiting
 * Envoie 25 requêtes rapides pour déclencher l'erreur 429
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const EXPERT_EMAIL = process.env.EXPERT_EMAIL!;
const EXPERT_PASSWORD = process.env.EXPERT_PASSWORD!;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !EXPERT_EMAIL || !EXPERT_PASSWORD) {
  console.error('❌ Variables d\'environnement manquantes :');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   - EXPERT_EMAIL');
  console.error('   - EXPERT_PASSWORD');
  process.exit(1);
}

interface TestResult {
  status: number;
  success: boolean;
  error?: string;
  duration: number;
}

/**
 * Couleurs pour les logs
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Authentification avec Supabase pour obtenir un token
 */
async function authenticate(): Promise<string> {
  console.log(`${colors.cyan}🔐 Authentification...${colors.reset}`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: EXPERT_EMAIL,
    password: EXPERT_PASSWORD,
  });

  if (authError || !authData.session) {
    throw new Error(`❌ Authentification échouée: ${authError?.message || 'Session manquante'}`);
  }

  console.log(`${colors.green}✅ Authentifié: ${authData.user.email}${colors.reset}\n`);
  return authData.session.access_token;
}

/**
 * Récupère ou crée un client de test
 */
async function getTestClientId(token: string): Promise<string> {
  console.log(`${colors.cyan}📋 Récupération d'un client de test...${colors.reset}`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Essayer de récupérer un client existant avec nb_actions
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, nb_actions')
    .limit(1);

  if (!error && clients && clients.length > 0) {
    const client = clients[0];
    // S'assurer que le client a nb_actions défini (nécessaire pour créer des associés)
    // 25 requêtes × 100 actions = 2500 actions minimum nécessaires
    if (!client.nb_actions || client.nb_actions < 5000) {
      // Mettre à jour le client pour avoir suffisamment d'actions
      await supabase
        .from('clients')
        .update({ nb_actions: 5000 })
        .eq('id', client.id);
    }
    console.log(`${colors.green}✅ Client trouvé: ${client.id.substring(0, 8)}...${colors.reset}\n`);
    return client.id;
  }

  // Si aucun client, créer un client de test
  console.log(`${colors.yellow}⚠️  Aucun client trouvé, création d'un client de test...${colors.reset}`);
  
  const { data: expert } = await supabase
    .from('users')
    .select('cabinet_id')
    .single();

  if (!expert?.cabinet_id) {
    throw new Error('❌ Cabinet introuvable pour créer un client de test');
  }

  const { data: newClient, error: createError } = await supabase
    .from('clients')
    .insert({
      denomination: 'Test Rate Limit Client',
      forme_juridique: 'SAS',
      capital_social: 10000,
      nb_actions: 5000, // Nombre d'actions suffisant pour 25 requêtes × 100 actions
      siege_type: 'local_commercial',
      cabinet_id: expert.cabinet_id,
    })
    .select()
    .single();

  if (createError || !newClient) {
    throw new Error(`❌ Erreur création client: ${createError?.message || 'Client non créé'}`);
  }

  console.log(`${colors.green}✅ Client créé: ${newClient.id.substring(0, 8)}...${colors.reset}\n`);
  return newClient.id;
}

/**
 * Envoie une requête POST vers l'API
 */
async function sendRequest(
  url: string,
  token: string,
  clientId: string,
  requestNumber: number
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        civilite: 'M.',
        nom: `TEST${requestNumber}`,
        prenom: 'RateLimit',
        date_naissance: '1990-01-01',
        lieu_naissance: 'Paris',
        Nationalite: 'Française',
        adresse: '123 Rue Test',
        email: `test${requestNumber}@ratelimit.com`,
        telephone: '0612345678',
        profession: 'Testeur',
        nombre_actions: 100,
        type_apport: 'numeraire',
        president: false,
      }),
      signal: AbortSignal.timeout(30000), // Timeout 30 secondes
    });

    const duration = Date.now() - startTime;
    const status = response.status;
    const success = status === 200 || status === 201;

    let error: string | undefined;
    if (!success) {
      try {
        const errorData = await response.json();
        error = errorData.error || `Status ${status}`;
      } catch {
        error = `Status ${status}`;
      }
    }

    return {
      status,
      success,
      error,
      duration,
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    return {
      status: 0,
      success: false,
      error: err.message || 'Erreur réseau',
      duration,
    };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        🚀 TEST RATE LIMITING - DÉMARRAGE             ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let token: string;
  let clientId: string;

  try {
    // Phase 1 : Authentification
    token = await authenticate();

    // Phase 2 : Récupération client de test
    clientId = await getTestClientId(token);

    // Phase 3 : Envoi de 25 requêtes en parallèle
    // Note: La route /api/clients/[id]/associes a un rate limit de 30 req/min
    // En envoyant 25 requêtes, certaines devraient être bloquées (429)
    console.log(`${colors.bright}${colors.blue}📤 Envoi de 25 requêtes POST en parallèle...${colors.reset}\n`);

    const url = `${API_BASE_URL}/api/clients/${clientId}/associes`;
    const requests = Array.from({ length: 25 }, (_, i) =>
      sendRequest(url, token, clientId, i + 1)
    );

    const results = await Promise.all(requests);

    // Phase 4 : Analyse des résultats
    const successCount = results.filter(r => r.status === 200 || r.status === 201).length;
    const rateLimitedCount = results.filter(r => r.status === 429).length;
    const errorCount = results.filter(r => !r.success && r.status !== 429).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    // Affichage des résultats
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                  📊 RÉSULTATS                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`${colors.green}✅ Requêtes réussies (200/201):${colors.reset} ${colors.bright}${successCount}${colors.reset}`);
    console.log(`${colors.red}🚫 Requêtes rate limited (429):${colors.reset} ${colors.bright}${rateLimitedCount}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Autres erreurs:${colors.reset} ${colors.bright}${errorCount}${colors.reset}`);
    console.log(`${colors.cyan}⏱️  Durée moyenne:${colors.reset} ${colors.bright}${avgDuration.toFixed(2)}ms${colors.reset}\n`);

    // Détails par statut
    const statusCounts = new Map<number, number>();
    results.forEach(r => {
      statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1);
    });

    console.log(`${colors.blue}📋 Détail par statut:${colors.reset}`);
    Array.from(statusCounts.entries())
      .sort((a, b) => b[0] - a[0])
      .forEach(([status, count]) => {
        const emoji = status === 429 ? '🚫' : status >= 200 && status < 300 ? '✅' : '❌';
        console.log(`   ${emoji} ${status}: ${count} requête(s)`);
      });

    // Conclusion
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                  🎯 CONCLUSION                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    if (rateLimitedCount >= 5) {
      console.log(`${colors.green}${colors.bright}✅ TEST RÉUSSI${colors.reset}`);
      console.log(`   Le rate limiting fonctionne correctement !`);
      console.log(`   ${rateLimitedCount} requêtes ont été bloquées (429).\n`);
      process.exit(0);
    } else {
      console.log(`${colors.red}${colors.bright}❌ TEST ÉCHOUÉ${colors.reset}`);
      console.log(`   Le rate limiting ne fonctionne pas comme attendu.`);
      console.log(`   Seulement ${rateLimitedCount} requêtes bloquées (attendu: ≥5).\n`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bright}❌ ERREUR FATALE${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);
    if (error.stack) {
      console.error(`${colors.yellow}Stack trace:${colors.reset}`);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécution
main();


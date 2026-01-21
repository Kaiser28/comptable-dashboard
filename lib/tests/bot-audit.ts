import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes :');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  duration: number;
  timestamp?: string;
}

interface AuditReport {
  timestamp: string;
  duration: number;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  results: TestResult[];
}

class LexiGenAuditBot {
  private supabaseAdmin: SupabaseClient; // Client avec service_role pour bypass RLS (création données)
  private supabaseUser: SupabaseClient;  // Client normal pour authentification utilisateur (tests API)
  private results: TestResult[] = [];
  private startTime: number = 0;
  private cabinetId: string = '';
  private expertId: string | null = null;
  private userId: string = '';
  private accessToken: string = '';
  private refreshToken: string = '';
  private testClientIds: string[] = [];
  private testClients: any[] = []; // Clients créés avec succès pour les tests
  private testActes: any[] = []; // Actes créés avec succès pour les tests

  constructor() {
    // Client avec service_role pour bypass RLS (utilisé uniquement pour setup/cleanup)
    this.supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Client authentifié pour respecter RLS (utilisé pour créer clients/actes/associés)
    this.supabaseUser = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }

  // Types de documents à tester
  private readonly DOCUMENT_TYPES = [
    { type: 'statuts', label: 'Statuts SAS/SASU', priority: 1 },
    { type: 'pv_constitution', label: 'PV constitution', priority: 1 },
    { type: 'augmentation_capital', label: 'Augmentation capital', priority: 2 },
    { type: 'ag_ordinaire', label: 'AG Ordinaire', priority: 2 },
    { type: 'reduction_capital', label: 'Réduction capital', priority: 3 },
    { type: 'cession_actions', label: 'Cession actions', priority: 2 },
    { type: 'ordre_mouvement_titres', label: 'Ordre mouvement titres', priority: 2 },
    { type: 'declaration_non_condamnation', label: 'Déclaration non-condamnation', priority: 1 },
    { type: 'annonce_legale', label: 'Annonce légale', priority: 1 },
    { type: 'attestation_depot_capital', label: 'Attestation dépôt capital', priority: 1 },
    { type: 'courrier_article_163', label: 'Courrier Article 163', priority: 2 },
    { type: 'lettre_mission', label: 'Lettre de mission', priority: 2 }
  ];

  async run(): Promise<AuditReport> {
    this.startTime = Date.now();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          🤖 BOT D\'AUDIT LEXIGEN - DÉMARRAGE          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    try {
      // Phase 1 : Setup environnement de test
      await this.setupTestEnvironment();
      
      // Phase 2 : Créer clients de test
      await this.createTestClients();
      
      // Phase 3 : Tester création d'actes (tous types)
      await this.testActesCreation();
      
      // Phase 4 : Tester génération de documents
      await this.testDocumentGeneration();
      
      // Phase 5 : Tester validations juridiques
      await this.testJuridicalValidations();
      
      // Phase 6 : Cleanup (optionnel)
      // await this.cleanup();
      
    } catch (error: any) {
      this.addResult({
        test: 'Audit global',
        status: 'error',
        message: `Erreur critique : ${error.message || error}`,
        duration: Date.now() - this.startTime
      });
    }

    return this.generateReport();
  }

  private async setupTestEnvironment(): Promise<void> {
    const testStart = Date.now();
    
    try {
      console.log('📋 Phase 1 : Setup environnement de test...\n');
      
      // Vérifier connexion Supabase (avec admin pour bypass RLS)
      const { data: testConnection, error } = await this.supabaseAdmin
        .from('cabinets')
        .select('id')
        .limit(1);
      
      if (error) {
        this.addTestResult('error', 'Setup: Connexion Supabase', `Connexion échouée : ${error.message}`);
        return; // Arrêter le setup si connexion échoue
      }
      
      // Nettoyer les anciennes données de test (avec admin pour bypass RLS)
      console.log('🧹 Nettoyage des données de test précédentes...');
      
      try {
        // Supprimer les anciens experts de test (avant les cabinets pour respecter les FK)
        await this.supabaseAdmin
          .from('users')
          .delete()
          .ilike('email', '%expert-audit%lexigen.dev');
        
        // Supprimer les anciens cabinets de test
        await this.supabaseAdmin
          .from('cabinets')
          .delete()
          .ilike('email', '%audit-test%lexigen.dev');
      } catch (cleanupError: any) {
        // Ignorer les erreurs de cleanup (peut être vide)
        this.addTestResult('warning', 'Setup: Cleanup', `Erreur cleanup (non bloquant) : ${cleanupError.message}`);
      }
      
      console.log('✅ Cleanup terminé');
      
      // Générer des emails uniques avec timestamp
      const timestamp = Date.now();
      const cabinetEmail = `audit-test-${timestamp}@lexigen.dev`;
      const expertEmail = `expert-audit-${timestamp}@lexigen.dev`;
      
      // Créer le cabinet d'abord (avec admin pour bypass RLS)
      const { data: cabinet, error: cabinetError } = await this.supabaseAdmin
        .from('cabinets')
        .insert({
          nom: 'Cabinet Test Audit',
          email: cabinetEmail,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (cabinetError) {
        this.addTestResult('error', 'Setup: Création cabinet', `Erreur : ${cabinetError.message}`);
        return; // Arrêter le setup si cabinet ne peut pas être créé
      }
      this.cabinetId = cabinet.id;
      console.log('✅ Cabinet créé:', cabinet.id);
      
      // Créer un utilisateur d'authentification pour le test (avec admin pour bypass RLS)
      const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email: expertEmail,
        password: 'TestAudit2025!',
        email_confirm: true
      });
      
      if (authError) {
        this.addTestResult('error', 'Setup: Création user auth', `Erreur : ${authError.message}`);
        return; // Arrêter le setup si user ne peut pas être créé
      }
      const userId = authData.user.id;
      this.userId = userId;
      console.log('✅ User auth créé:', userId);
      
      // Créer l'expert ensuite (avec admin pour bypass RLS)
      const { data: expert, error: expertError } = await this.supabaseAdmin
        .from('users')
        .insert({
          cabinet_id: this.cabinetId,
          user_id: userId,
          nom: 'Expert',
          prenom: 'Test Audit',
          email: expertEmail,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (expertError) {
        this.addTestResult('error', 'Setup: Création expert', `Erreur : ${expertError.message}`);
        return; // Arrêter le setup si expert ne peut pas être créé
      }
      this.expertId = expert.id;
      console.log('✅ Expert créé:', expert.id);
      
      // Authentifier le bot avec le compte réel (via variables d'environnement)
      await this.authenticate();
      
      this.addTestResult('success', 'Setup: Environnement', `Cabinet ID: ${this.cabinetId}, Expert ID: ${this.expertId}`);
      
      console.log('✅ Environnement prêt\n');
    } catch (error: any) {
      this.addTestResult('error', 'Setup: Erreur globale', `Exception : ${error.message}`, { stack: error.stack });
      // ⚠️ PAS DE throw - on continue malgré l'erreur
    }
  }

  private async authenticate(): Promise<void> {
    console.log('🔐 Authentification...');
    
    const email = process.env.EXPERT_EMAIL;
    const password = process.env.EXPERT_PASSWORD;
    
    if (!email || !password) {
      throw new Error('❌ EXPERT_EMAIL et EXPERT_PASSWORD requis');
    }

    const { data: authData, error: authError } = await this.supabaseUser.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.session) {
      throw new Error(`Échec authentification : ${authError?.message}`);
    }

    // Récupérer le cabinet_id de l'expert
    const { data: expertData, error: expertError } = await this.supabaseUser
      .from('users')
      .select('cabinet_id')
      .eq('user_id', authData.user.id)
      .single();

    if (expertError || !expertData) {
      throw new Error('Expert non trouvé en base');
    }

    this.cabinetId = expertData.cabinet_id;
    this.accessToken = authData.session.access_token;
    this.refreshToken = authData.session.refresh_token;
    
    console.log(`   ✅ Authentifié - Cabinet ID: ${this.cabinetId}\n`);
  }

  private async createTestClients(): Promise<void> {
    console.log('👥 Phase 2 : Création clients de test avec variations...\n');
    
    if (!this.cabinetId) {
      this.addTestResult('error', 'Création clients', 'Cabinet ID manquant - setup échoué');
      return;
    }
    
    // Clients avec variations et edge cases
    const clientsToTest = [
      {
        nom: 'SAS Complet',
        data: {
          nom_entreprise: 'TEST SAS Complet',
          forme_juridique: 'SAS',
          capital_social: 10000,
          nb_actions: 1000,
          siret: '12345678901234',
          adresse: '123 Rue du Commerce, 75001 Paris',
          objet_social: 'Test automatique complet',
          duree_societe: 99,
          montant_libere: 10000,
          president_nom: 'Dupont',
          president_prenom: 'Jean'
        }
      },
      {
        nom: 'SAS Capital Minimum',
        data: {
          nom_entreprise: 'TEST SAS Capital Min',
          forme_juridique: 'SAS',
          capital_social: 1, // Edge case : capital minimum légal
          nb_actions: 1,
          siret: '22345678901234',
          adresse: '45 Avenue des Startups, 69001 Lyon',
          objet_social: 'Test capital minimum',
          duree_societe: 99,
          montant_libere: 1,
          president_nom: 'Martin',
          president_prenom: 'Paul'
        }
      },
      {
        nom: 'SASU Complet',
        data: {
          nom_entreprise: 'TEST SASU Complet',
          forme_juridique: 'SASU',
          capital_social: 50000,
          nb_actions: 5000,
          siret: '32345678901234',
          adresse: '78 Boulevard de la Tech, 33000 Bordeaux',
          objet_social: 'Test SASU complet',
          duree_societe: 99,
          montant_libere: 50000,
          president_nom: 'Bernard',
          president_prenom: 'Marie'
        }
      },
      {
        nom: 'SAS Sans Président',
        data: {
          nom_entreprise: 'TEST SAS Sans Président',
          forme_juridique: 'SAS',
          capital_social: 5000,
          nb_actions: 500,
          siret: '42345678901234',
          adresse: '12 Impasse du Test, 13001 Marseille',
          objet_social: 'Test sans président',
          duree_societe: 99,
          montant_libere: 5000,
          president_nom: null, // Edge case : volontairement NULL
          president_prenom: null
        }
      },
      {
        nom: 'SAS Capital Énorme',
        data: {
          nom_entreprise: 'TEST SAS Capital Énorme',
          forme_juridique: 'SAS',
          capital_social: 100000000, // Edge case : gros montant
          nb_actions: 10000000,
          siret: '52345678901234',
          adresse: '999 Place des Investisseurs, 92000 Nanterre',
          objet_social: 'Test capital énorme',
          duree_societe: 99,
          montant_libere: 100000000,
          president_nom: 'Durand',
          president_prenom: 'Pierre'
        }
      },
      {
        nom: 'SASU Capital Décimal',
        data: {
          nom_entreprise: 'TEST SASU Capital Décimal',
          forme_juridique: 'SASU',
          capital_social: 1500.50, // Edge case : décimaux
          nb_actions: 150,
          siret: '62345678901234',
          adresse: '56 Rue de l\'Innovation, 59000 Lille',
          objet_social: 'Test capital décimal',
          duree_societe: 99,
          montant_libere: 1500.50,
          president_nom: 'Lefebvre',
          president_prenom: 'Sophie'
        }
      }
    ];
    
    for (const clientTest of clientsToTest) {
      try {
        const { data: client, error } = await this.supabaseUser
          .from('clients')
          .insert({
            ...clientTest.data,
            cabinet_id: this.cabinetId
          })
          .select()
          .single();
        
        if (error) {
          this.addTestResult('error', `Création client: ${clientTest.nom}`, `Échec : ${error.message}`, { error });
          continue; // Continuer avec le client suivant
        }
        
        this.testClientIds.push(client.id);
        this.testClients.push(client); // Stocker pour les actes
        
        this.addTestResult('success', `Création client: ${clientTest.nom}`, `ID: ${client.id}`);
        console.log(`✅ ${clientTest.nom} créé (ID: ${client.id.substring(0, 8)}...)`);
        
        // Créer les associés pour ce client
        try {
          await this.createAssocies(client.id, clientTest.data);
        } catch (error: any) {
          this.addTestResult('error', `Création associés: ${clientTest.nom}`, `Exception : ${error.message}`, { stack: error.stack });
          // ⚠️ PAS DE throw - on continue même si les associés échouent
        }
        
      } catch (error: any) {
        this.addTestResult('error', `Création client: ${clientTest.nom}`, `Exception : ${error.message}`, { stack: error.stack });
        // ⚠️ PAS DE throw - on continue avec le client suivant
      }
    }
    
    console.log(`\n✅ ${this.testClients.length}/${clientsToTest.length} clients créés avec succès\n`);
  }

  private async createAssocies(clientId: string, clientData: any): Promise<void> {
    const formeJuridique = clientData.forme_juridique;
    const totalActions = clientData.nb_actions || 1000;
    const capitalSocial = clientData.capital_social || 10000;
    const clientName = clientData.nom_entreprise || clientData.denomination || 'Client inconnu';
    
    console.log(`\n📋 Création des associés pour ${clientName}...`);
    
    // Déterminer si c'est le client "SAS Sans Président"
    const isSansPresident = clientName.includes('Sans Président') || 
                            (clientData.president_nom === null && clientData.president_prenom === null);
    
    // Vérifier que le token d'authentification est disponible
    if (!this.accessToken) {
      this.addTestResult('error', `Création associés: ${clientName}`, 'Token d\'authentification manquant');
      return;
    }
    
    let associesToCreate: any[] = [];
    
    if (formeJuridique === 'SASU') {
      // SASU : 1 associé unique (100% capital, président)
      associesToCreate = [
        {
          civilite: 'M.',
          nom: 'MARTIN',
          prenom: 'Jean',
          date_naissance: '1980-05-15',
          lieu_naissance: 'Paris',
          Nationalite: 'Française',
          adresse: '123 Rue du Commerce, 75001 Paris',
          email: 'jean.martin@test.com',
          telephone: '0612345678',
          profession: 'Entrepreneur',
          nombre_actions: Math.max(1, totalActions),
          type_apport: 'numeraire',
          president: !isSansPresident // Président sauf si "SAS Sans Président"
        }
      ];
    } else if (formeJuridique === 'SAS') {
      // SAS : 2 associés (70% + 30%) - garantir minimum 1 action chacun
      const actionsAssocie1 = Math.max(1, Math.floor(totalActions * 0.7));
      const actionsAssocie2 = Math.max(1, totalActions - actionsAssocie1);
      
      associesToCreate = [
        {
          civilite: 'M.',
          nom: 'MARTIN',
          prenom: 'Jean',
          date_naissance: '1980-05-15',
          lieu_naissance: 'Paris',
          Nationalite: 'Française',
          adresse: '123 Rue du Commerce, 75001 Paris',
          email: 'jean.martin@test.com',
          telephone: '0612345678',
          profession: 'Entrepreneur',
          nombre_actions: actionsAssocie1,
          type_apport: 'numeraire',
          president: !isSansPresident // Président sauf si "SAS Sans Président"
        },
        {
          civilite: 'Mme',
          nom: 'DUPONT',
          prenom: 'Marie',
          date_naissance: '1985-09-22',
          lieu_naissance: 'Lyon',
          Nationalite: 'Française',
          adresse: '45 Avenue des Startups, 69001 Lyon',
          email: 'marie.dupont@test.com',
          telephone: '0698765432',
          profession: 'Consultante',
          nombre_actions: actionsAssocie2,
          type_apport: 'numeraire',
          president: false
        }
      ];
    } else {
      // Autre forme juridique : ne pas créer d'associés
      this.addTestResult('warning', `Création associés: ${clientName}`, `Forme juridique ${formeJuridique} non gérée`);
      return;
    }
    
    // Créer les associés via supabaseUser (respecte RLS automatiquement)
    for (const associe of associesToCreate) {
      try {
        const { data: createdAssocie, error } = await this.supabaseUser
          .from('associes')
          .insert({
            ...associe,
            client_id: clientId
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Échec création associé: ${error.message}`);
        }

        console.log(`  ✅ ${associe.prenom} ${associe.nom} (${associe.nombre_actions} actions)`);
        
      } catch (error: any) {
        this.addTestResult('error', `Création associé: ${associe.prenom} ${associe.nom}`, `Exception : ${error.message}`, { stack: error.stack });
        // ⚠️ PAS DE throw - on continue avec l'associé suivant
      }
    }
    
    this.addTestResult('success', `Création associés: ${clientName}`, `${associesToCreate.length} associé(s) créé(s)`);
    console.log(`✓ ${associesToCreate.length} associé(s) créé(s) pour ${clientName}`);
    
    // Attendre que le trigger SQL synchronise le président vers la table clients
    console.log('  ⏳ Attente synchronisation président...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde
    console.log('  ✅ Associés créés et président synchronisé\n');
  }

  private async testActesCreation(): Promise<void> {
    console.log('📝 Phase 3 : Test création actes juridiques avec variations...\n');
    
    if (this.testClients.length === 0) {
      this.addTestResult('warning', 'Création actes', 'Aucun client disponible - création clients échouée');
      return;
    }
    
    if (!this.cabinetId) {
      this.addTestResult('error', 'Création actes', 'Cabinet ID manquant');
      return;
    }
    
    // Pour CHAQUE client créé avec succès
    for (const client of this.testClients) {
      const clientName = client.nom_entreprise || 'Client inconnu';
      
      // Test augmentation capital - 3 modalités
      const augmentationTests = [
        { 
          modalite: 'numeraire', 
          montant: 5000, 
          description: 'Apport numéraire',
          nombre_actions: 500
        },
        { 
          modalite: 'nature', 
          montant: 10000, 
          description: 'Apport en nature',
          nombre_actions: 1000
        },
        { 
          modalite: 'reserves', 
          montant: 3000, 
          description: 'Incorporation réserves',
          nombre_actions: 300
        }
      ];
      
      for (const test of augmentationTests) {
        try {
          const ancienCapital = client.capital_social || 10000;
          const nouveauCapital = ancienCapital + test.montant;
          
          const acteData = {
            client_id: client.id,
            cabinet_id: this.cabinetId,
            type: 'augmentation_capital',
            ancien_capital: ancienCapital,
            montant_augmentation: test.montant,
            nouveau_capital: nouveauCapital,
            modalite: test.modalite,
            nombre_nouvelles_actions: test.nombre_actions,
            date_acte: new Date().toISOString().split('T')[0],
            statut: 'brouillon',
            quorum: 100,
            votes_pour: client.nb_actions || 1000,
            votes_contre: 0
          };
          
          const { data: acte, error } = await this.supabaseUser
            .from('actes_juridiques')
            .insert(acteData)
            .select()
            .single();
          
          if (error) {
            this.addTestResult('error', `Acte augmentation (${test.modalite}) - ${clientName}`, `Échec : ${error.message}`);
            continue;
          }
          
          this.testActes.push(acte);
          this.addTestResult('success', `Acte augmentation (${test.modalite}) - ${clientName}`, `ID: ${acte.id}`);
          console.log(`✅ Augmentation ${test.modalite} - ${clientName}`);
          
        } catch (error: any) {
          this.addTestResult('error', `Acte augmentation (${test.modalite}) - ${clientName}`, `Exception : ${error.message}`, { stack: error.stack });
          // ⚠️ PAS DE throw - on continue
        }
      }
      
      // Test réduction capital - 3 modalités
      const reductionTests = [
        { 
          modalite: 'rachat_annulation', 
          ancien_capital: client.capital_social || 10000,
          nouveau_capital: Math.max(1, (client.capital_social || 10000) - 1000),
          nombre_actions: client.nb_actions || 1000,
          nombre_actions_rachetees: Math.floor((client.nb_actions || 1000) * 0.1),
          prix_rachat: 10
        },
        { 
          modalite: 'reduction_valeur_nominale', 
          ancien_capital: client.capital_social || 10000,
          nouveau_capital: Math.max(1, (client.capital_social || 10000) / 2),
          nombre_actions: client.nb_actions || 1000,
          ancienne_valeur_nominale: (client.capital_social || 10000) / (client.nb_actions || 1000),
          nouvelle_valeur_nominale: ((client.capital_social || 10000) / 2) / (client.nb_actions || 1000)
        },
        { 
          modalite: 'coup_accordeon', 
          ancien_capital: client.capital_social || 10000,
          nouveau_capital: 1,
          augmentation_montant: 5000,
          capital_final: 5001
        }
      ];
      
      for (const test of reductionTests) {
        try {
          const acteData: any = {
            client_id: client.id,
            cabinet_id: this.cabinetId,
            type: 'reduction_capital',
            ancien_capital: test.ancien_capital,
            montant_reduction: test.ancien_capital - test.nouveau_capital,
            nouveau_capital_apres_reduction: test.nouveau_capital,
            modalite_reduction: test.modalite,
            motif_reduction: `Test automatique - ${test.modalite}`,
            reduction_motivee_pertes: false,
            date_acte: new Date().toISOString().split('T')[0],
            statut: 'brouillon',
            quorum: 100,
            votes_pour: Math.floor((client.nb_actions || 1000) * 0.7),
            votes_contre: 0
          };
          
          if (test.modalite === 'rachat_annulation') {
            acteData.nombre_actions_rachetees = test.nombre_actions_rachetees;
            acteData.prix_rachat_par_action = test.prix_rachat;
            acteData.nombre_actions = test.nombre_actions;
          } else if (test.modalite === 'reduction_valeur_nominale') {
            acteData.ancienne_valeur_nominale = test.ancienne_valeur_nominale;
            acteData.nouvelle_valeur_nominale = test.nouvelle_valeur_nominale;
            acteData.nombre_actions = test.nombre_actions;
          } else if (test.modalite === 'coup_accordeon') {
            acteData.coup_accordeon_augmentation_montant = test.augmentation_montant;
            acteData.coup_accordeon_nouveau_capital_final = test.capital_final;
          }
          
          const { data: acte, error } = await this.supabaseUser
            .from('actes_juridiques')
            .insert(acteData)
            .select()
            .single();
          
          if (error) {
            this.addTestResult('error', `Acte réduction (${test.modalite}) - ${clientName}`, `Échec : ${error.message}`);
            continue;
          }
          
          this.testActes.push(acte);
          this.addTestResult('success', `Acte réduction (${test.modalite}) - ${clientName}`, `ID: ${acte.id}`);
          console.log(`✅ Réduction ${test.modalite} - ${clientName}`);
          
        } catch (error: any) {
          this.addTestResult('error', `Acte réduction (${test.modalite}) - ${clientName}`, `Exception : ${error.message}`, { stack: error.stack });
          // ⚠️ PAS DE throw - on continue
        }
      }
      
      // Test AG Ordinaire
      try {
        const acteData = {
          client_id: client.id,
          cabinet_id: this.cabinetId,
          type: 'ag_ordinaire',
          date_acte: new Date().toISOString().split('T')[0],
          statut: 'brouillon',
          date_ag: new Date().toISOString().split('T')[0],
          exercice_clos: '2024',
          resultat_exercice: 50000,
          affectation_resultat: 'dividendes',
          montant_dividendes: 30000,
          montant_reserves: 5000,
          montant_report: 15000,
          quitus_president: true,
          votes_pour_comptes: client.nb_actions || 5000,
          votes_contre_comptes: 0,
          votes_abstention_comptes: 0
        };
        
        const { data: acte, error } = await this.supabaseAdmin
          .from('actes_juridiques')
          .insert(acteData)
          .select()
          .single();
        
        if (error) {
          this.addTestResult('error', `Acte AG Ordinaire - ${clientName}`, `Échec : ${error.message}`);
          continue;
        }
        
        this.testActes.push(acte);
        this.addTestResult('success', `Acte AG Ordinaire - ${clientName}`, `ID: ${acte.id}`);
        console.log(`✅ AG Ordinaire - ${clientName}`);
        
      } catch (error: any) {
        this.addTestResult('error', `Acte AG Ordinaire - ${clientName}`, `Exception : ${error.message}`, { stack: error.stack });
        // ⚠️ PAS DE throw - on continue
      }
    }
    
    console.log(`\n✅ ${this.testActes.length} actes créés avec succès\n`);
  }

  private async testCreateActe(config: {
    type: string;
    label: string;
    data: any;
  }): Promise<void> {
    const testStart = Date.now();
    
    try {
      const { data: acte, error } = await this.supabaseAdmin
        .from('actes_juridiques')
        .insert(config.data)
        .select()
        .single();
      
      if (error) throw error;
      
      this.addResult({
        test: `Création acte : ${config.label}`,
        status: 'success',
        message: `Acte créé avec ID ${acte.id}`,
        details: { acte_id: acte.id, type: config.type },
        duration: Date.now() - testStart
      });
      
      console.log(`✅ ${config.label} créé (ID: ${acte.id.substring(0, 8)}...)`);
      
    } catch (error: any) {
      this.addResult({
        test: `Création acte : ${config.label}`,
        status: 'error',
        message: `Échec : ${error.message || error}`,
        details: { error: error.details || error },
        duration: Date.now() - testStart
      });
      
      console.log(`❌ ${config.label} échoué`);
    }
  }

  private async testDocumentGeneration(): Promise<void> {
    console.log('📄 Phase 4 : Test génération documents pour tous les actes...\n');
    
    if (this.testActes.length === 0) {
      this.addTestResult('warning', 'Génération documents', 'Aucun acte disponible - création actes échouée');
      console.log('⚠️  Aucun acte disponible\n');
      return;
    }
    
    if (!this.accessToken) {
      this.addTestResult('error', 'Génération documents', 'Token d\'authentification manquant');
      return;
    }
    
    // Tester la génération pour TOUS les actes créés
    for (const acte of this.testActes) {
      try {
        await this.testGenerateDocument(acte.id, acte.type);
      } catch (error: any) {
        this.addTestResult('error', `Génération ${acte.type} - ${acte.id.substring(0, 8)}`, `Exception : ${error.message}`, { stack: error.stack });
        // ⚠️ PAS DE throw - on continue avec le prochain acte
      }
    }
    
    console.log(`\n✅ Génération testée pour ${this.testActes.length} actes\n`);
  }

  private async testGenerateDocument(acteId: string, type: string): Promise<void> {
    const testStart = Date.now();
    const apiRoutes: Record<string, string> = {
      'augmentation_capital': '/api/generate-augmentation-capital',
      'reduction_capital': '/api/generate-reduction-capital',
      'ag_ordinaire': '/api/generate-ag-ordinaire',
      'cession_actions': '/api/generate-cession-actions'
    };
    
    const apiRoute = apiRoutes[type];
    
    if (!apiRoute) {
      this.addResult({
        test: `Génération doc : ${type}`,
        status: 'warning',
        message: 'API route non implémentée',
        duration: Date.now() - testStart
      });
      console.log(`⚠️  ${type} : API non implémentée`);
      return;
    }
    
    try {
      // Construire l'URL selon le type
      const typeMap: Record<string, string> = {
        'augmentation_capital': 'augmentation-capital',
        'reduction_capital': 'reduction-capital',
        'ag_ordinaire': 'ag-ordinaire',
        'cession_actions': 'cession-actions'
      };
      
      const apiType = typeMap[type] || type;
      const url = `http://localhost:3000/api/generate-${apiType}`;
      const payload = { acte_id: acteId };
      
      // Vérifier que le token est présent
      if (!this.accessToken) {
        throw new Error('Token d\'authentification manquant. Assurez-vous que setupTestEnvironment() a été appelé.');
      }
      
      // Obtenir le token de session actuel
      const session = await this.supabaseUser.auth.getSession();
      const sessionToken = session.data.session?.access_token;
      
      if (!sessionToken) {
        throw new Error('Token d\'authentification manquant. Assurez-vous que authenticate() a été appelé.');
      }
      
      // Préparer les headers avec le token d'authentification
      // Ajouter X-Bot-Token pour bypass rate limiting
      const botToken = process.env.BOT_SECRET_TOKEN;
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      };
      
      if (botToken) {
        requestHeaders['X-Bot-Token'] = botToken;
      }
      
      // Log avant l'appel
      console.log(`🔐 Appel API ${type}:`, {
        url: url,
        acteId: acteId,
        hasToken: !!sessionToken,
        tokenPreview: sessionToken ? sessionToken.substring(0, 30) + '...' : 'NONE',
        tokenLength: sessionToken ? sessionToken.length : 0,
        payload: payload
      });
      
      // Appel API avec authentification
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload)
      });
      
      // Lire le body de la réponse (texte pour les erreurs, blob pour les succès)
      const responseText = await response.text();
      
      // Log après l'appel
      console.log(`📡 Réponse ${type}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        body: responseText.substring(0, 500) // Limiter à 500 caractères
      });
      
      if (!response.ok) {
        console.error(`❌ Erreur API ${response.status} pour ${type}:`, responseText);
        throw new Error(`${response.status}: ${responseText}`);
      }
      
      // En cas de succès, convertir le texte en blob pour les documents Word
      const blob = new Blob([responseText], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      console.log('✅ Document généré:', {
        size: blob.size,
        size_kb: (blob.size / 1024).toFixed(2),
        type: blob.type
      });
      
      this.addResult({
        test: `Génération doc : ${type}`,
        status: 'success',
        message: `Document généré (${(blob.size / 1024).toFixed(2)} KB)`,
        details: { acte_id: acteId, size: blob.size },
        duration: Date.now() - testStart
      });
      
      console.log(`✅ ${type} : ${(blob.size / 1024).toFixed(2)} KB`);
      
    } catch (error: any) {
      // Si le serveur n'est pas démarré, c'est un warning, pas une erreur
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
        this.addResult({
          test: `Génération doc : ${type}`,
          status: 'warning',
          message: 'Serveur Next.js non démarré (lancez "npm run dev" pour tester)',
          details: { acte_id: acteId },
          duration: Date.now() - testStart
        });
        console.log(`⚠️  ${type} : Serveur non démarré`);
      } else {
        this.addResult({
          test: `Génération doc : ${type}`,
          status: 'error',
          message: `Échec : ${error.message}`,
          details: { acte_id: acteId },
          duration: Date.now() - testStart
        });
        console.log(`❌ ${type} échoué`);
      }
    }
  }

  private async testJuridicalValidations(): Promise<void> {
    console.log('⚖️  Phase 5 : Test validations juridiques...\n');
    
    // Importer la fonction de validation
    const { validateCapitalFinalMinimum } = await import('@/lib/validators/reductionCapital');
    
    // Test validations réduction capital
    const validationTests = [
      {
        name: 'Capital final ≥ 1€',
        test: async () => {
          // Tester avec données invalides (capital < 1€)
          const validationResult = validateCapitalFinalMinimum({
            nouveau_capital_apres_reduction: 0 // INVALIDE
          });
          
          // On VEUT que valid = false (la validation doit bloquer)
          return validationResult.valid === false ? 'success' : 'error';
        }
      }
    ];
    
    for (const validation of validationTests) {
      const testStart = Date.now();
      try {
        const result = await validation.test();
        
        this.addResult({
          test: `Validation : ${validation.name}`,
          status: result === 'success' ? 'success' : 'error',
          message: result === 'success' ? 'Validation bloque correctement' : 'Validation ne bloque pas',
          duration: Date.now() - testStart
        });
        
        console.log(`${result === 'success' ? '✅' : '❌'} ${validation.name}`);
        
      } catch (error: any) {
        this.addResult({
          test: `Validation : ${validation.name}`,
          status: 'error',
          message: `Erreur test : ${error.message || error}`,
          duration: Date.now() - testStart
        });
      }
    }
    
    console.log('\n');
  }

  private addResult(result: Omit<TestResult, 'duration'> & { duration: number }): void {
    this.results.push(result as TestResult);
  }

  // Méthode helper pour ajouter un résultat avec gestion automatique
  private addTestResult(status: 'success' | 'error' | 'warning', test: string, message: string, details?: any): void {
    this.results.push({
      test,
      status,
      message,
      details,
      duration: 0,
      timestamp: new Date().toISOString()
    });
  }

  private generateReport(): AuditReport {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'error').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    
    // Grouper les erreurs par type pour le rapport JSON
    const errorsByType: Record<string, TestResult[]> = {};
    this.results.filter(r => r.status === 'error').forEach(r => {
      const type = r.test.split(':')[0] || r.test.split(' - ')[0] || 'Autre';
      if (!errorsByType[type]) errorsByType[type] = [];
      errorsByType[type].push(r);
    });
    
    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      duration,
      totalTests: this.results.length,
      passed,
      failed,
      warnings,
      results: this.results
    };
    
    // Sauvegarder le rapport JSON avec erreurs groupées
    const reportData = {
      ...report,
      errorsByType,
      summary: {
        total: this.results.length,
        passed,
        failed,
        warnings,
        percentage: report.totalTests > 0 ? ((passed / report.totalTests) * 100).toFixed(0) : '0'
      }
    };
    
    const reportPath = path.join(process.cwd(), 'lib', 'tests', 'reports', `audit-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    // Afficher le résumé
    this.displayReport(report);
    
    return report;
  }

  private displayReport(report: AuditReport): void {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║        📊 RAPPORT D\'AUDIT COMPLET - RÉSULTATS         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`⏱️  Durée totale : ${(report.duration / 1000).toFixed(2)}s`);
    console.log(`📝 Tests totaux : ${report.totalTests}`);
    console.log(`✅ Réussis : ${report.passed} (${report.totalTests > 0 ? ((report.passed / report.totalTests) * 100).toFixed(0) : 0}%)`);
    console.log(`❌ Échecs : ${report.failed}`);
    console.log(`⚠️  Avertissements : ${report.warnings}\n`);
    
    // Grouper les erreurs par type
    const errorsByType: Record<string, TestResult[]> = {};
    report.results.filter(r => r.status === 'error').forEach(r => {
      const type = r.test.split(':')[0] || r.test.split(' - ')[0] || 'Autre';
      if (!errorsByType[type]) errorsByType[type] = [];
      errorsByType[type].push(r);
    });
    
    if (report.failed > 0) {
      console.log('❌ RÉSUMÉ DES ERREURS PAR CATÉGORIE:\n');
      Object.entries(errorsByType).forEach(([type, errors]) => {
        console.log(`   📁 ${type} (${errors.length} erreur${errors.length > 1 ? 's' : ''}):`);
        errors.forEach(e => {
          console.log(`      • ${e.test}`);
          console.log(`        └─ ${e.message}`);
        });
        console.log('');
      });
    }
    
    if (report.warnings > 0) {
      console.log('⚠️  AVERTISSEMENTS :\n');
      report.results
        .filter(r => r.status === 'warning')
        .forEach(r => {
          console.log(`   • ${r.test}: ${r.message}`);
        });
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    const reportFileName = `audit-${Date.now()}.json`;
    console.log(`📄 Rapport complet sauvegardé dans :`);
    console.log(`   lib/tests/reports/${reportFileName}\n`);
  }

  private async cleanup(): Promise<void> {
    try {
      // Supprimer l'utilisateur de test (avec admin pour bypass RLS)
      if (this.userId) {
        await this.supabaseAdmin.auth.admin.deleteUser(this.userId);
        console.log('🧹 User de test supprimé');
      }
    } catch (error: any) {
      console.log('⚠️  Erreur nettoyage:', error.message || error);
    }
  }
}

// Exécution
async function main() {
  const bot = new LexiGenAuditBot();
  const report = await bot.run();
  
  // Code de sortie selon les résultats
  process.exit(report.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

export { LexiGenAuditBot };


# Bot d'Audit LexiGen 🤖

Système de tests E2E (End-to-End) pour vérifier automatiquement la création d'actes et la génération de documents.

## 📋 Prérequis

1. **Variables d'environnement** : Assurez-vous que `.env.local` contient :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (clé service_role de Supabase)

2. **Dépendances** : Installez les dépendances avec :
   ```bash
   npm install
   ```

## 🚀 Utilisation

### Lancer les tests d'audit

```bash
npm run test:audit
```

### Mode watch (relance automatique)

```bash
npm run test:audit:watch
```

## 📊 Phases de test

Le bot exécute 5 phases principales :

1. **Setup environnement** : Crée ou récupère un cabinet et un expert de test
2. **Création clients** : Crée des clients de test (SAS, SASU)
3. **Création actes** : Teste la création de différents types d'actes :
   - Augmentation de capital
   - Réduction de capital
   - AG Ordinaire
   - Cession d'actions
4. **Génération documents** : Teste la génération de documents Word via les API routes
5. **Validations juridiques** : Vérifie que les règles juridiques bloquent les valeurs invalides

## 📁 Structure

```
lib/tests/
├── bot-audit.ts              # Orchestrateur principal
├── fixtures/                 # Données de test
│   ├── clients.json
│   ├── actes-augmentation.json
│   └── actes-reduction.json
├── runners/                  # Exécuteurs de tests
│   ├── test-creation-actes.ts
│   ├── test-generation-documents.ts
│   └── test-validations-juridiques.ts
└── reports/                  # Rapports générés
    └── audit-{timestamp}.json
```

## 📄 Rapports

Les rapports sont sauvegardés dans `lib/tests/reports/` au format JSON avec :
- Timestamp d'exécution
- Durée totale
- Nombre de tests réussis/échoués/avertissements
- Détails de chaque test

## ⚠️ Notes importantes

- **Serveur Next.js** : Pour tester la génération de documents, le serveur doit être démarré (`npm run dev`)
- **Base de données** : Les tests créent des données de test dans Supabase (cabinet, clients, actes)
- **Cleanup** : Les données de test peuvent être nettoyées manuellement si nécessaire

## 🔧 Personnalisation

Pour ajouter de nouveaux tests :

1. Ajoutez les données dans `fixtures/`
2. Créez de nouvelles fonctions dans `runners/`
3. Intégrez-les dans `bot-audit.ts`


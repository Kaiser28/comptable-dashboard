# ACPM LexiGen - Plateforme de génération de documents juridiques

> **Version custom développée pour ACPM Expertise Comptable**
> 
> Plateforme sur-mesure pour automatiser la génération de documents juridiques (statuts SAS, PV, DNC, annonces légales, etc.)

---

## 📋 Informations du projet

- **Client** : ACPM Expertise Comptable (MÉRÉ, Yvelines 78)
- **Type** : Application mono-tenant (usage exclusif ACPM)
- **Domaine** : https://lexigen.fr
- **Tech Stack** : Next.js 14 + TypeScript + Supabase + Vercel

---

## ✨ Fonctionnalités

### Documents générés automatiquement
- ✅ Statuts SAS/SASU
- ✅ PV de constitution
- ✅ PV d'AG ordinaire et extraordinaire
- ✅ Déclaration de Non-Condamnation (DNC)
- ✅ Annonces légales pré-remplies
- ✅ Cession d'actions
- ✅ Augmentation/Réduction de capital
- ✅ Ordre de mouvement de titres
- ✅ Lettre de mission
- ✅ Courrier de reprise d'entreprise
- ✅ Attestation de dépôt de fonds

### Fonctionnalités plateforme
- ✅ Dashboard de suivi des dossiers
- ✅ Formulaires clients self-service
- ✅ Gestion multi-utilisateurs (4 comptes)
- ✅ Système de rôles (admin / collaborateur)
- ✅ Logs d'activité et traçabilité
- ✅ Export PDF/Word instantané
- ✅ Cohérence automatique des données entre documents

---

## 👥 Utilisateurs

### 4 comptes utilisateurs ACPM :

1. **Administrateur** (1 compte)
   - Email : `contact@acpm-expertise.com`
   - Accès complet + gestion des utilisateurs
   - Peut modifier les informations des autres utilisateurs
   - Accès aux logs d'activité

2. **Collaborateurs** (3 comptes)
   - Emails : `user1@acpm-expertise.com`, `user2@acpm-expertise.com`, `user3@acpm-expertise.com`
   - Accès complet sauf gestion des utilisateurs
   - Peuvent créer/modifier des dossiers
   - Peuvent générer tous les documents

**Mots de passe temporaires** : Voir le fichier `CREDENTIALS.md` (à créer après setup Supabase)

---

## 🏗️ Architecture technique

### Stack
- **Frontend** : Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend** : Next.js API Routes, Supabase (PostgreSQL)
- **Auth** : Supabase Auth (email/password)
- **Hébergement** : Vercel
- **Base de données** : Supabase (PostgreSQL)
- **Stockage fichiers** : Vercel Blob (ou Supabase Storage)
- **Génération documents** : Docxtemplater (templates Word)

### Base de données (Supabase)
- **users** : 4 utilisateurs ACPM (admin + collaborateurs)
- **clients** : Clients du cabinet (~200)
- **dossiers** : Dossiers de création SAS et modifications
- **documents_generes** : Documents générés (statuts, PV, etc.)
- **audit_logs** : Logs d'activité (traçabilité)
- **parametres** : Paramètres du cabinet

**Schema SQL** : Voir `supabase/migrations/00_acpm_schema.sql`

---

## 🚀 Installation et configuration

### Prérequis
- Node.js 18+ et npm
- Compte Supabase (instance dédiée ACPM)
- Compte Vercel pour le déploiement

### 1. Cloner le repo

```bash
git clone https://github.com/Sferia78/saas-statuts-juridiques.git acpm-lexigen
cd acpm-lexigen
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer l'instance Supabase

**Suivre le guide** : `SETUP_SUPABASE_ACPM.md`

Résumé :
1. Créer un projet Supabase `acpm-lexigen`
2. Exécuter le schéma SQL (`supabase/migrations/00_acpm_schema.sql`)
3. Créer les 4 utilisateurs dans Supabase Auth
4. Récupérer les clés API

### 4. Configurer les variables d'environnement

Créer `.env.local` à la racine :

```env
# Supabase (instance ACPM)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# App Config
NEXT_PUBLIC_APP_NAME="ACPM LexiGen"
NEXT_PUBLIC_APP_URL=https://lexigen.fr
NEXT_PUBLIC_CABINET_NAME="ACPM Expertise Comptable"
NEXT_PUBLIC_CABINET_EMAIL=contact@acpm-expertise.com

# Branding
NEXT_PUBLIC_PRIMARY_COLOR="#337ab7"
NEXT_PUBLIC_SECONDARY_COLOR="#2e6da4"

# Features (désactivées)
NEXT_PUBLIC_ENABLE_SIGNUP=false
NEXT_PUBLIC_ENABLE_STRIPE=false
NEXT_PUBLIC_ENABLE_MULTI_TENANT=false

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Mode
NODE_ENV=development
```

### 5. Lancer en local

```bash
npm run dev
```

Accéder à : http://localhost:3000

---

## 📦 Déploiement sur Vercel

### 1. Push sur GitHub

```bash
git add .
git commit -m "Setup ACPM LexiGen"
git push origin main
```

### 2. Connecter à Vercel

1. Aller sur https://vercel.com/dashboard
2. **Import Git Repository** → Sélectionner le repo GitHub
3. **Configure Project** :
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Configurer les variables d'environnement

Dans **Settings > Environment Variables**, ajouter toutes les variables de `.env.local`

**IMPORTANT** : Cocher **Production**, **Preview**, et **Development**

### 4. Déployer

Cliquer sur **Deploy**. Vercel build et déploie automatiquement.

### 5. Configurer le domaine `lexigen.fr`

1. Dans **Settings > Domains**, ajouter `lexigen.fr`
2. Configurer les DNS chez le registrar :
   - Type: `A`, Name: `@`, Value: `76.76.21.21`
   - Type: `CNAME`, Name: `www`, Value: `cname.vercel-dns.com`
3. Attendre la propagation DNS (quelques minutes)

---

## 🔐 Sécurité

- ✅ Authentification requise pour toutes les pages (sauf landing)
- ✅ Rôles et permissions (admin / collaborateur)
- ✅ Row Level Security (RLS) sur Supabase
- ✅ Rate limiting sur les routes sensibles
- ✅ Logs d'activité (audit trail)
- ✅ Chiffrement des données (Supabase)
- ✅ Hébergement France + RGPD compliant

---

## 📚 Documentation utilisateur

### Pour les collaborateurs

**Connexion** :
1. Aller sur https://lexigen.fr/login
2. Entrer votre email ACPM
3. Entrer votre mot de passe

**Créer un nouveau dossier** :
1. Aller sur le Dashboard
2. Cliquer sur "Nouveau dossier"
3. Remplir les informations du client
4. Générer les documents

**Modifier un dossier existant** :
1. Trouver le dossier dans la liste
2. Cliquer sur "Modifier"
3. Ajuster les informations
4. Régénérer les documents si nécessaire

### Pour l'administrateur

**Gérer les utilisateurs** :
1. Aller sur `/admin/users`
2. Modifier les informations des utilisateurs
3. Réinitialiser les mots de passe si besoin
4. Activer/désactiver des comptes

**Consulter les logs** :
1. Aller sur `/admin/logs`
2. Filtrer par utilisateur, action, date
3. Exporter si nécessaire

---

## 🛠️ Maintenance

### Mettre à jour les dépendances

```bash
npm update
npm audit fix
```

### Sauvegarder la base de données

Supabase fait des sauvegardes automatiques quotidiennes.

Pour une sauvegarde manuelle :
1. Aller dans le dashboard Supabase
2. **Database > Backups**
3. **Create backup**

### Consulter les logs d'application

**Vercel** :
1. Dashboard Vercel > Project > Logs
2. Filtrer par niveau (Error, Warning, Info)

**Supabase** :
1. Dashboard Supabase > Logs
2. API Logs, Database Logs, Auth Logs

---

## 📞 Support

- **Email** : support@lexigen.fr
- **Contact ACPM** : contact@acpm-expertise.com
- **Développeur** : [Votre contact]

---

## 📝 Changelog

### Version 1.0.0 (Janvier 2026)
- ✅ Setup initial ACPM custom
- ✅ Branding ACPM (logo, couleurs)
- ✅ Suppression inscription publique
- ✅ Système de rôles admin/collaborateur
- ✅ Page admin gestion utilisateurs
- ✅ Landing page adaptée ACPM
- ✅ 10+ types de documents générés
- ✅ Formulaires clients self-service
- ✅ Dashboard de suivi
- ✅ Logs d'activité

---

## 🔒 Licence

Propriété exclusive de **ACPM Expertise Comptable**.  
Usage commercial réservé.

---

**Dernière mise à jour** : 15 janvier 2026

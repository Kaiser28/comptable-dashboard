# 🔐 CREDENTIALS ACPM LexiGen

**Date de livraison** : 15 janvier 2026  
**Client** : ACPM Expertise Comptable  
**Domaine** : https://lexigen.fr (à configurer)

---

## 👥 COMPTES UTILISATEURS

### Administrateur (Accès complet)
- **Email** : `contact@acpm-expertise.com`
- **Mot de passe temporaire** : `AcpmAdmin2025!`
- **Rôle** : Admin
- **Permissions** : 
  - Tout + gestion des utilisateurs
  - Accès à `/admin/users`
  - Modification des comptes
  - Consultation des logs

### Collaborateurs (3 comptes)

#### Collaborateur 1
- **Email** : `user1@acpm-expertise.com`
- **Mot de passe temporaire** : `AcpmUser1_2025!`
- **Rôle** : Collaborateur
- **Permissions** : Tout sauf gestion des utilisateurs

#### Collaborateur 2
- **Email** : `user2@acpm-expertise.com`
- **Mot de passe temporaire** : `AcpmUser2_2025!`
- **Rôle** : Collaborateur
- **Permissions** : Tout sauf gestion des utilisateurs

#### Collaborateur 3
- **Email** : `user3@acpm-expertise.com`
- **Mot de passe temporaire** : `AcpmUser3_2025!`
- **Rôle** : Collaborateur
- **Permissions** : Tout sauf gestion des utilisateurs

---

## ⚠️ SÉCURITÉ - À FAIRE IMMÉDIATEMENT

**IMPORTANT** : Les mots de passe ci-dessus sont **TEMPORAIRES** et doivent être changés lors de la première connexion.

### Comment changer un mot de passe :

#### Option 1 : Via l'interface admin (Recommandé)
1. Se connecter en tant qu'admin : `contact@acpm-expertise.com`
2. Aller sur `/admin/users`
3. Cliquer sur un utilisateur
4. Cliquer sur "Reset MDP"
5. L'utilisateur recevra un email pour créer un nouveau mot de passe

#### Option 2 : Via Supabase Dashboard
1. Aller sur : https://supabase.com/dashboard/project/fdbljadwgeuaqhfgelsd
2. Cliquer sur "Authentication" > "Users"
3. Cliquer sur un utilisateur
4. Cliquer sur "Reset password"
5. Envoyer l'email de réinitialisation

---

## 🔑 ACCÈS SUPABASE (Admin technique)

**URL du projet** : https://supabase.com/dashboard/project/fdbljadwgeuaqhfgelsd

**Credentials Supabase** (à conserver précieusement) :

```
Project URL: https://fdbljadwgeuaqhfgelsd.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmxqYWR3Z2V1YXFoZmdlbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODgxNTksImV4cCI6MjA4NDA2NDE1OX0.iKKOk-StpUr3bGFnpBKFEkXcoTwCcKp2lc8utlxIfJ0
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmxqYWR3Z2V1YXFoZmdlbHNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4ODE1OSwiZXhwIjoyMDg0MDY0MTU5fQ.mkFQwO9x4TD5ZV8s9iDXcjPwr8l1RVr0MmwH_SkpbwI
```

⚠️ **La Service Role Key est SECRÈTE** - Ne jamais l'exposer côté client !

---

## 🎨 BRANDING

- **Logo** : `/public/acpm-logo.png`
- **Couleur principale** : `#337ab7` (bleu ACPM)
- **Couleur secondaire** : `#2e6da4`
- **Nom complet** : ACPM Expertise Comptable
- **Localisation** : MÉRÉ, Yvelines (78)

---

## 🌐 URLS DE L'APPLICATION

### Une fois déployé sur Vercel :

- **Landing page** : https://lexigen.fr
- **Connexion** : https://lexigen.fr/login
- **Dashboard** : https://lexigen.fr/dashboard
- **Admin utilisateurs** : https://lexigen.fr/admin/users
- **Logs d'activité** : https://lexigen.fr/admin/logs

---

## 📊 BASE DE DONNÉES

### Tables Supabase (6 tables)

1. **users** - 4 utilisateurs ACPM
2. **clients** - Clients du cabinet (~200)
3. **dossiers** - Dossiers de création SAS
4. **documents_generes** - Documents générés (statuts, PV, etc.)
5. **audit_logs** - Logs d'activité
6. **parametres** - Paramètres du cabinet

### Sauvegardes

- **Automatiques** : Quotidiennes (Supabase)
- **Manuelles** : Via Supabase Dashboard > Database > Backups

---

## 🛠️ MAINTENANCE

### Accès développeur

- **GitHub** : https://github.com/Sferia78/saas-statuts-juridiques
- **Vercel** : https://vercel.com/dashboard (une fois connecté)

### Support technique

- **Email** : support@lexigen.fr
- **Contact développeur** : [Votre email/téléphone]

---

## 📖 DOCUMENTATION

- **README.md** - Documentation complète du projet
- **SETUP_SUPABASE_ACPM.md** - Guide setup Supabase
- **GUIDE_DEMARRAGE_ACPM.md** - Guide démarrage rapide

---

## ✅ CHECKLIST POST-DÉPLOIEMENT

- [ ] Tester la connexion avec les 4 comptes
- [ ] Changer tous les mots de passe temporaires
- [ ] Créer un dossier test
- [ ] Générer des documents test
- [ ] Vérifier l'accès admin
- [ ] Vérifier les logs d'activité
- [ ] Former les utilisateurs
- [ ] Configurer le domaine lexigen.fr
- [ ] Activer HTTPS (automatique avec Vercel)

---

**Document confidentiel - Usage interne ACPM uniquement**

Date : 15 janvier 2026

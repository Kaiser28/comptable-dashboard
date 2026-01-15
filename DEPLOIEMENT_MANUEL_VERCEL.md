# 🚀 DÉPLOIEMENT MANUEL VERCEL - ACPM LexiGen

**Date** : 15 janvier 2026  
**Statut** : En attente de déploiement manuel

---

## ⚠️ PROBLÈME RENCONTRÉ

Le déploiement automatique via CLI a échoué à cause d'un problème de permissions :

```
Error: Git author github@sferia.com must have access to the team Sferia on Vercel
```

**Cause** : L'email Git (`github@sferia.com`) dans l'historique des commits n'a pas les permissions nécessaires pour déployer sur la team "Sferia".

---

## ✅ SOLUTION : DÉPLOIEMENT MANUEL VIA DASHBOARD

Vous devez déployer manuellement via le dashboard Vercel. C'est **très simple** et **plus rapide** que de résoudre le problème de permissions.

---

## 📋 ÉTAPES DE DÉPLOIEMENT MANUEL

### **ÉTAPE 1 : Accéder à Vercel Dashboard**

1. Allez sur : **https://vercel.com/dashboard**
2. Vous êtes déjà connecté ✅

---

### **ÉTAPE 2 : Ouvrir le projet existant**

Vous avez déjà un projet nommé **`v0-acpm`** sur Vercel.

**Option A : Utiliser le projet existant `v0-acpm`**

1. Cliquez sur le projet **`v0-acpm`**
2. Allez dans **Settings** > **Git**
3. **Déconnecter** le repo actuel si nécessaire
4. **Reconnecter** avec : `Sferia78/saas-statuts-juridiques`
5. Branch : `main`

**Option B : Créer un nouveau projet (RECOMMANDÉ pour éviter les conflits)**

1. Cliquez sur **"Add New..."** > **"Project"**
2. Sélectionnez **"Import Git Repository"**
3. Cherchez et sélectionnez : **`Sferia78/saas-statuts-juridiques`**
4. Cliquez sur **"Import"**

---

### **ÉTAPE 3 : Configurer le projet**

**Paramètres de base :**
- **Project Name** : `acpm-lexigen` (ou garder `saas-statuts-juridiques`)
- **Framework Preset** : `Next.js` (détecté automatiquement)
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run build`
- **Output Directory** : `.next`
- **Install Command** : `npm install`

⚠️ **NE PAS DÉPLOYER ENCORE** - D'abord configurer les variables d'environnement ci-dessous

---

### **ÉTAPE 4 : Configurer les variables d'environnement**

Cliquez sur **"Environment Variables"** et ajoutez **TOUTES** ces variables :

#### **Variables Supabase (OBLIGATOIRES) :**

```
NEXT_PUBLIC_SUPABASE_URL
https://fdbljadwgeuaqhfgelsd.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmxqYWR3Z2V1YXFoZmdlbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODgxNTksImV4cCI6MjA4NDA2NDE1OX0.iKKOk-StpUr3bGFnpBKFEkXcoTwCcKp2lc8utlxIfJ0
```

```
SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmxqYWR3Z2V1YXFoZmdlbHNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4ODE1OSwiZXhwIjoyMDg0MDY0MTU5fQ.mkFQwO9x4TD5ZV8s9iDXcjPwr8l1RVr0MmwH_SkpbwI
```

#### **Variables Configuration ACPM :**

```
NEXT_PUBLIC_APP_NAME
ACPM LexiGen
```

```
NEXT_PUBLIC_APP_URL
https://lexigen.fr
```

```
NEXT_PUBLIC_CABINET_NAME
ACPM Expertise Comptable
```

```
NEXT_PUBLIC_CABINET_EMAIL
contact@acpm-expertise.com
```

```
NEXT_PUBLIC_CABINET_LOCATION
MÉRÉ, Yvelines (78)
```

#### **Variables Branding :**

```
NEXT_PUBLIC_PRIMARY_COLOR
#337ab7
```

```
NEXT_PUBLIC_SECONDARY_COLOR
#2e6da4
```

#### **Variables Features (désactivées) :**

```
NEXT_PUBLIC_ENABLE_SIGNUP
false
```

```
NEXT_PUBLIC_ENABLE_STRIPE
false
```

```
NEXT_PUBLIC_ENABLE_MULTI_TENANT
false
```

#### **Mode Production :**

```
NODE_ENV
production
```

---

### ⚠️ **IMPORTANT POUR CHAQUE VARIABLE**

Pour **CHAQUE** variable ci-dessus, **COCHER LES 3 ENVIRONNEMENTS** :
- ✅ Production
- ✅ Preview
- ✅ Development

---

### **ÉTAPE 5 : Déployer**

1. Après avoir ajouté **TOUTES** les variables ci-dessus
2. Cliquez sur le bouton **"Deploy"** (en bas de la page)
3. ⏱️ Attendre **2-3 minutes** que Vercel build et déploie
4. Vous verrez **"Deployment Ready"** ✅

---

### **ÉTAPE 6 : Récupérer l'URL de déploiement**

Vercel vous donnera une URL comme :
- `https://acpm-lexigen.vercel.app`
- ou `https://saas-statuts-juridiques-xxxx.vercel.app`

**Copiez cette URL** et testez-la dans votre navigateur.

---

## 🧪 **ÉTAPE 7 : TESTER LE DÉPLOIEMENT**

### **7.1 Tester la landing page**

Ouvrez : `https://votre-url.vercel.app`

✅ Vérifications :
- Logo ACPM visible
- Couleurs ACPM (bleu #337ab7)
- Texte "ACPM LexiGen"
- Pas de mentions "Beta Founders" ou prix

---

### **7.2 Tester la connexion**

1. Aller sur : `https://votre-url.vercel.app/login`
2. Se connecter avec :
   - **Email** : `contact@acpm-expertise.com`
   - **Mot de passe** : `AcpmAdmin2025!`
3. Vous devriez être redirigé vers `/dashboard` ✅

---

### **7.3 Tester la page admin**

1. Aller sur : `https://votre-url.vercel.app/admin/users`
2. Vous devriez voir la liste des 4 utilisateurs
3. Vous devriez pouvoir modifier leurs informations

---

### **7.4 Vérifier les fonctionnalités**

- ✅ Création d'un nouveau client
- ✅ Génération de documents (statuts, PV, etc.)
- ✅ Dashboard accessible
- ✅ Pas de page /signup (doit retourner 404)

---

## 🌐 **ÉTAPE 8 : CONFIGURER LE DOMAINE `lexigen.fr`**

### **8.1 Dans Vercel**

1. Aller dans **Settings** > **Domains** du projet
2. Cliquer sur **"Add Domain"**
3. Entrer : `lexigen.fr`
4. Cliquer sur **"Add"**

Vercel vous donnera des instructions DNS.

---

### **8.2 Configurer les DNS**

Chez votre registrar (OVH, Gandi, etc.), ajoutez :

#### **Pour `lexigen.fr` uniquement :**

**Record A :**
- Type : `A`
- Name : `@` (ou laisser vide)
- Value : `76.76.21.21`
- TTL : Auto ou 3600

#### **Pour `www.lexigen.fr` (optionnel) :**

**Record CNAME :**
- Type : `CNAME`
- Name : `www`
- Value : `cname.vercel-dns.com`
- TTL : Auto ou 3600

---

### **8.3 Attendre la propagation DNS**

⏱️ **Temps** : 5 minutes à 48 heures (souvent 15-30 min)

✅ **Vérifier** : Ouvrez `https://lexigen.fr` dans un navigateur privé

✅ **HTTPS** : Vercel configure automatiquement le certificat SSL

---

## ✅ **CHECKLIST FINALE**

- [ ] Projet créé/configuré sur Vercel
- [ ] Repo GitHub `Sferia78/saas-statuts-juridiques` connecté
- [ ] 14 variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] URL Vercel fonctionnelle (https://xxx.vercel.app)
- [ ] Test de connexion réussi avec admin
- [ ] Dashboard accessible
- [ ] Page admin accessible
- [ ] Logo ACPM visible
- [ ] Couleurs ACPM correctes
- [ ] Pas de page /signup (404)
- [ ] Domaine `lexigen.fr` configuré (optionnel)
- [ ] DNS propagés
- [ ] HTTPS actif

---

## 📞 **BESOIN D'AIDE ?**

Si vous rencontrez un problème :

1. **Vérifiez les logs de build** dans Vercel > Deployments > View Function Logs
2. **Vérifiez les variables d'environnement** (toutes les 14 doivent être présentes)
3. **Vérifiez que les utilisateurs existent** dans Supabase Auth

---

## 🎯 **APRÈS LE DÉPLOIEMENT**

Une fois le déploiement réussi, **envoyez-moi l'URL Vercel** (exemple : `https://acpm-lexigen.vercel.app`) et je vais :

1. ✅ Tester l'application
2. ✅ Vérifier que tout fonctionne
3. ✅ Vous donner les dernières instructions pour le domaine personnalisé

---

**Date de création** : 15 janvier 2026  
**Dernière mise à jour** : 15 janvier 2026

# 🚀 GUIDE DE DÉPLOIEMENT VERCEL - ACPM LexiGen

**Date** : 15 janvier 2026  
**Projet** : ACPM LexiGen  
**Repository** : https://github.com/Sferia78/saas-statuts-juridiques

---

## ✅ PRÉ-REQUIS (DÉJÀ FAIT)

- ✅ Code pushé sur GitHub
- ✅ Instance Supabase créée et configurée
- ✅ 4 utilisateurs créés dans Supabase Auth
- ✅ Variables d'environnement documentées

---

## 📋 ÉTAPE 1 : CRÉER LE PROJET VERCEL

### 1.1 Aller sur Vercel

Ouvrez : https://vercel.com/dashboard

### 1.2 Importer le projet GitHub

1. Cliquer sur **"Add New..."** > **"Project"**
2. Sélectionner **"Import Git Repository"**
3. Chercher et sélectionner : **`Sferia78/saas-statuts-juridiques`**
4. Cliquer sur **"Import"**

### 1.3 Configurer le projet

- **Project Name** : `acpm-lexigen` (ou `saas-statuts-juridiques`)
- **Framework Preset** : `Next.js` (détecté automatiquement)
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run build` (par défaut)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)

✅ **Ne pas déployer encore** - D'abord configurer les variables d'environnement

---

## 🔑 ÉTAPE 2 : CONFIGURER LES VARIABLES D'ENVIRONNEMENT

### 2.1 Cliquer sur "Environment Variables"

Avant de déployer, ajouter toutes ces variables :

### 2.2 Variables Supabase (OBLIGATOIRES)

```
NEXT_PUBLIC_SUPABASE_URL=https://fdbljadwgeuaqhfgelsd.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmxqYWR3Z2V1YXFoZmdlbHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODgxNTksImV4cCI6MjA4NDA2NDE1OX0.iKKOk-StpUr3bGFnpBKFEkXcoTwCcKp2lc8utlxIfJ0
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmxqYWR3Z2V1YXFoZmdlbHNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ4ODE1OSwiZXhwIjoyMDg0MDY0MTU5fQ.mkFQwO9x4TD5ZV8s9iDXcjPwr8l1RVr0MmwH_SkpbwI
```

### 2.3 Variables de configuration ACPM

```
NEXT_PUBLIC_APP_NAME=ACPM LexiGen
```

```
NEXT_PUBLIC_APP_URL=https://lexigen.fr
```

```
NEXT_PUBLIC_CABINET_NAME=ACPM Expertise Comptable
```

```
NEXT_PUBLIC_CABINET_EMAIL=contact@acpm-expertise.com
```

```
NEXT_PUBLIC_CABINET_LOCATION=MÉRÉ, Yvelines (78)
```

### 2.4 Variables de branding

```
NEXT_PUBLIC_PRIMARY_COLOR=#337ab7
```

```
NEXT_PUBLIC_SECONDARY_COLOR=#2e6da4
```

### 2.5 Variables de features (désactivées)

```
NEXT_PUBLIC_ENABLE_SIGNUP=false
```

```
NEXT_PUBLIC_ENABLE_STRIPE=false
```

```
NEXT_PUBLIC_ENABLE_MULTI_TENANT=false
```

### 2.6 Mode

```
NODE_ENV=production
```

### ⚠️ IMPORTANT

Pour **chaque variable**, cocher les 3 environnements :
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🚀 ÉTAPE 3 : DÉPLOYER

1. Après avoir ajouté TOUTES les variables ci-dessus
2. Cliquer sur **"Deploy"**
3. Attendre 2-3 minutes que Vercel build et déploie
4. Vous verrez **"Deployment Ready"** avec une URL temporaire

---

## 🌐 ÉTAPE 4 : TESTER LE DÉPLOIEMENT

### 4.1 URL temporaire Vercel

Vous recevrez une URL comme : `https://acpm-lexigen.vercel.app` ou `https://saas-statuts-juridiques-xxxx.vercel.app`

### 4.2 Tests à effectuer

1. **Accéder à la landing page** : `https://votre-url.vercel.app`
2. **Tester la connexion** : `https://votre-url.vercel.app/login`
   - Email: `contact@acpm-expertise.com`
   - Password: `AcpmAdmin2025!`
3. **Vérifier le dashboard** : Vous devriez être redirigé vers `/dashboard`
4. **Vérifier la page admin** : `https://votre-url.vercel.app/admin/users`

### 4.3 Vérifier que tout fonctionne

- ✅ Logo ACPM visible
- ✅ Couleurs ACPM (bleu #337ab7)
- ✅ Connexion fonctionne
- ✅ Dashboard accessible
- ✅ Page admin accessible (pour l'admin uniquement)

---

## 🏷️ ÉTAPE 5 : CONFIGURER LE DOMAINE `lexigen.fr`

### 5.1 Dans Vercel

1. Aller dans **Settings** > **Domains**
2. Cliquer sur **"Add Domain"**
3. Entrer : `lexigen.fr`
4. Cliquer sur **"Add"**

Vercel va vous donner des instructions DNS à configurer.

### 5.2 Configurer les DNS chez votre registrar

Vous devrez ajouter ces enregistrements DNS chez votre registrar (OVH, Gandi, etc.) :

#### Option A : Si vous voulez `lexigen.fr` et `www.lexigen.fr`

**Record A** :
- Type: `A`
- Name: `@` (ou laisser vide)
- Value: `76.76.21.21`
- TTL: Auto ou 3600

**Record CNAME** :
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`
- TTL: Auto ou 3600

#### Option B : Si vous voulez UNIQUEMENT `lexigen.fr`

**Record A** :
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

### 5.3 Attendre la propagation DNS

- **Temps** : 5 minutes à 48 heures (souvent 15-30 min)
- **Vérifier** : Aller sur `https://lexigen.fr` dans un navigateur privé

### 5.4 HTTPS automatique

✅ Vercel configure automatiquement le certificat SSL (HTTPS)
✅ Aucune action nécessaire de votre part

---

## 🔄 ÉTAPE 6 : DÉPLOIEMENTS FUTURS

### Déploiement automatique

✅ **Déjà configuré** : Chaque fois que vous pushez sur GitHub (branche `main`), Vercel redéploie automatiquement !

### Déploiement manuel

Si besoin de redéployer manuellement :
1. Aller sur Vercel Dashboard
2. Sélectionner le projet
3. Aller dans **Deployments**
4. Cliquer sur **"..."** > **"Redeploy"**

---

## ✅ CHECKLIST FINALE

- [ ] Projet créé sur Vercel
- [ ] Variables d'environnement configurées (14 variables)
- [ ] Premier déploiement réussi
- [ ] Test de connexion réussi avec admin
- [ ] Dashboard accessible
- [ ] Page admin accessible
- [ ] Domaine `lexigen.fr` configuré
- [ ] DNS propagés
- [ ] HTTPS actif
- [ ] Tests complets effectués

---

## 🆘 DÉPANNAGE

### Erreur de build

Si le build échoue sur Vercel :
1. Vérifier les logs de build dans Vercel
2. Vérifier que toutes les variables d'environnement sont bien configurées
3. Vérifier que le code est bien pushé sur GitHub

### Erreur de connexion Supabase

Si la connexion ne fonctionne pas :
1. Vérifier que les 3 clés Supabase sont correctes
2. Vérifier que les utilisateurs sont bien créés dans Supabase Auth
3. Vérifier les logs dans Vercel > Functions

### Le domaine ne fonctionne pas

1. Vérifier la configuration DNS
2. Attendre la propagation (peut prendre jusqu'à 48h)
3. Tester avec `dig lexigen.fr` ou `nslookup lexigen.fr`
4. Vérifier dans Vercel > Settings > Domains que le statut est "Valid"

---

## 📞 SUPPORT

**Vercel Documentation** : https://vercel.com/docs  
**Supabase Documentation** : https://supabase.com/docs  
**Support développeur** : [Votre contact]

---

**Date de création** : 15 janvier 2026  
**Dernière mise à jour** : 15 janvier 2026

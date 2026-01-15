# 🚀 GUIDE DE DÉMARRAGE RAPIDE ACPM

**Pour : ACPM Expertise Comptable**  
**Date : 15 janvier 2026**

---

## ✅ **ÉTAPES À SUIVRE MAINTENANT**

### **ÉTAPE 1 : Créer l'instance Supabase (VOUS)**

📋 **Suivez le guide complet** : `SETUP_SUPABASE_ACPM.md`

**Résumé rapide** :
1. Aller sur https://supabase.com/dashboard
2. Créer un nouveau projet :
   - Name: `acpm-lexigen`
   - Region: `Europe West (Paris)`
   - Database Password: Choisir un mot de passe fort
3. Attendre 2 minutes (provisioning)
4. Aller dans **SQL Editor** → **New query**
5. Copier-coller le contenu de `supabase/migrations/00_acpm_schema.sql`
6. Cliquer sur **Run**
7. Aller dans **Authentication > Users** → Créer les 4 utilisateurs :
   - `contact@acpm-expertise.com` (admin) - MDP: `AcpmAdmin2025!`
   - `user1@acpm-expertise.com` (collaborateur) - MDP: `AcpmUser1_2025!`
   - `user2@acpm-expertise.com` (collaborateur) - MDP: `AcpmUser2_2025!`
   - `user3@acpm-expertise.com` (collaborateur) - MDP: `AcpmUser3_2025!`
8. Aller dans **Settings > API** → Récupérer :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

⏱️ **Temps estimé** : 15-20 minutes

---

### **ÉTAPE 2 : Envoyer les clés API au développeur**

📧 **Envoyez-moi les 3 clés récupérées à l'étape 1** :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

✅ **Une fois reçues, je finalise le déploiement**

---

### **ÉTAPE 3 : Tester la plateforme (APRÈS DÉPLOIEMENT)**

1. **Connexion** : https://lexigen.fr/login
2. **Tester avec le compte admin** :
   - Email: `contact@acpm-expertise.com`
   - MDP: `AcpmAdmin2025!`
3. **Explorer** :
   - Dashboard
   - Créer un dossier test
   - Générer des documents
   - Aller dans `/admin/users` pour gérer les utilisateurs

---

### **ÉTAPE 4 : Changer les mots de passe**

⚠️ **IMPORTANT** : Les mots de passe temporaires doivent être changés immédiatement après la première connexion.

**Pour chaque utilisateur** :
1. Se connecter avec le MDP temporaire
2. Aller dans **Profil** (ou demander à l'admin de reset le MDP)
3. Changer le mot de passe

---

## 📧 **COMPTES UTILISATEURS ACPM**

| Email | Rôle | MDP Temporaire | Permissions |
|-------|------|----------------|-------------|
| `contact@acpm-expertise.com` | Admin | `AcpmAdmin2025!` | Tout + gestion users |
| `user1@acpm-expertise.com` | Collaborateur | `AcpmUser1_2025!` | Tout sauf gestion users |
| `user2@acpm-expertise.com` | Collaborateur | `AcpmUser2_2025!` | Tout sauf gestion users |
| `user3@acpm-expertise.com` | Collaborateur | `AcpmUser3_2025!` | Tout sauf gestion users |

---

## 🎨 **BRANDING ACPM**

✅ **Logo** : Intégré  
✅ **Couleur principale** : `#337ab7` (bleu ACPM)  
✅ **Nom** : ACPM LexiGen  
✅ **Domaine** : lexigen.fr  

---

## 🛠️ **FONCTIONNALITÉS DISPONIBLES**

### Documents générés
- ✅ Statuts SAS/SASU
- ✅ PV de constitution
- ✅ PV AG ordinaire/extraordinaire
- ✅ DNC (Déclaration Non-Condamnation)
- ✅ Annonces légales
- ✅ Cession d'actions
- ✅ Augmentation/Réduction capital
- ✅ Lettre de mission
- ✅ Ordre de mouvement
- ✅ Courrier de reprise
- ✅ Attestation dépôt fonds

### Plateforme
- ✅ Dashboard suivi dossiers
- ✅ Formulaires clients self-service
- ✅ Multi-utilisateurs (4 comptes)
- ✅ Rôles admin/collaborateur
- ✅ Logs d'activité
- ✅ Export PDF/Word

---

## 📞 **SUPPORT**

**Besoin d'aide ?**
- Email: support@lexigen.fr
- Contact dev: [Votre email/téléphone]

---

## ✅ **CHECKLIST DE DÉPLOIEMENT**

- [ ] Instance Supabase créée (`acpm-lexigen`)
- [ ] Schéma SQL exécuté
- [ ] 4 utilisateurs créés dans Supabase Auth
- [ ] Clés API récupérées et envoyées au dev
- [ ] Déploiement Vercel effectué
- [ ] Tests de connexion réussis
- [ ] Mots de passe changés
- [ ] Dossier test créé
- [ ] Documents générés et validés
- [ ] Formation utilisateurs effectuée

---

**Date de livraison prévue** : 18 janvier 2026 (3-4 jours)  
**Status actuel** : ⏳ En attente clés Supabase

---

📧 **Dès que vous avez les clés Supabase, envoyez-les moi et je finalise le déploiement !**
